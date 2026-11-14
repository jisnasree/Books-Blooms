from rest_framework.generics import (
    ListCreateAPIView,
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

import logging

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Order, Coupon
from .payments import (
    PaymentGatewayError,
    PaymentVerificationError,
    amount_in_paise,
    create_razorpay_order,
    get_razorpay_client,
    request_razorpay_refund,
    verify_razorpay_payment,
)
from .services import (
    InsufficientStockError,
    OrderAddressNotFound,
    OrderAlreadyPaidError,
    OrderCartEmpty,
    OrderCouponInvalid,
    OrderNotCancellable,
    OrderNotFound,
    OrderNotAwaitingPaymentError,
    OrderStockUnavailable,
    cancel_order,
    create_order_from_cart,
    finalize_razorpay_order,
)
from .serializers import (

    OrderCreateSerializer,
    OrderSerializer,
    OrderCancellationSerializer,
    CouponSerializer,
)
logger = logging.getLogger(__name__)


class OrderListCreateView(ListCreateAPIView):
    """
    GET  /api/orders/ lists the user's orders, newest first.
    POST /api/orders/ creates an order from the user's cart.
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .select_related("user")
            .prefetch_related("items")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = create_order_from_cart(
                user=request.user,
                address_id=serializer.validated_data["address_id"],
                payment_method=serializer.validated_data["payment_method"],
                coupon_code=serializer.validated_data.get("coupon_code", "").strip(),
            )
        except OrderAddressNotFound:
            return Response(
                {"error": "Address not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except OrderCartEmpty:
            return Response(
                {"error": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except OrderCouponInvalid:
            return Response(
                {"error": "Invalid or expired coupon code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except OrderStockUnavailable as error:
            return Response(
                {"error": f"Not enough stock for {error.book_title}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class OrderDetailView(RetrieveAPIView):
    """
    GET /api/orders/<pk>/ retrieves one of the user's own orders.
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .select_related("user")
            .prefetch_related("items")
        )


class OrderCancellationView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        get_object_or_404(Order, id=order_id, user=request.user)

        serializer = OrderCancellationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cancel_order(
                order_id=order_id,
                user_id=request.user.id,
                reason=serializer.validated_data.get("reason", ""),
            )
        except OrderNotFound:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except OrderNotCancellable:
            return Response(
                {"detail": "This order cannot be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"detail": "Order cancelled successfully."}, status=status.HTTP_200_OK
        )


class RazorpayCreateOrderView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):

        # Find the order belonging to the logged-in customer
        order = get_object_or_404(Order, id=order_id, user=request.user)

        # Only Razorpay orders can use online payment
        if order.payment_method != Order.PaymentMethod.RAZORPAY:
            return Response(
                {"detail": "This order is not an online payment order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Payment must still be pending
        if (
            order.payment_status != Order.PaymentStatus.PENDING
            or order.order_status != Order.OrderStatus.PENDING
        ):
            return Response(
                {"detail": "This order is not awaiting payment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount = amount_in_paise(order.total_amount)
        client = get_razorpay_client()

        # Reuse an existing Razorpay order if called again
        if order.razorpay_order_id:
            razorpay_order_id = order.razorpay_order_id

        else:

            payment_data = {
                "amount": amount,
                "currency": "INR",
                "receipt": f"books-blooms-{order.id}",
                "notes": {"books_blooms_order_id": str(order.id)},
            }

            try:
                razorpay_order = create_razorpay_order(client, payment_data)

                # Save Razorpay order ID in our database
                razorpay_order_id = razorpay_order["id"]

                order.razorpay_order_id = razorpay_order_id
                order.save(update_fields=["razorpay_order_id"])

            except PaymentGatewayError:
                logger.exception("Razorpay order creation failed for order %s.", order.id)
                return Response(
                    {"detail": ("Unable to create Razorpay payment order.")},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

        # Send payment details to React
        return Response(
            {
                "key_id": settings.RAZORPAY_KEY_ID,
                "razorpay_order_id": razorpay_order_id,
                "amount": amount,
                "currency": "INR",
                "books_blooms_order_id": order.id,
            },
            status=status.HTTP_200_OK,
        )


class RazorpayVerifyPaymentView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):

        # Get payment details sent by Razorpay Checkout
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response(
                {"detail": "Missing payment verification details."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find the order belonging to the logged-in customer
        order = get_object_or_404(Order, id=order_id, user=request.user)

        # Make sure this is a Razorpay order
        if order.payment_method != Order.PaymentMethod.RAZORPAY:
            return Response(
                {"detail": "This is not a Razorpay order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check that the Razorpay order ID matches our database
        if order.razorpay_order_id != razorpay_order_id:
            return Response(
                {"detail": "Invalid Razorpay order ID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        client = get_razorpay_client()
        try:
            verify_razorpay_payment(
                client,
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature,
                expected_amount=amount_in_paise(order.total_amount),
            )
        except PaymentVerificationError as error:
            return Response(
                {"detail": error.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PaymentGatewayError:
            logger.exception(
                "Razorpay payment verification failed for order %s.", order_id
            )
            return Response(
                {"detail": "Payment verification failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order, already_verified = finalize_razorpay_order(
                order_id,
                request.user.id,
                razorpay_payment_id,
            )
        except OrderAlreadyPaidError:
            return Response(
                {"detail": "This order has already been paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except OrderNotAwaitingPaymentError:
            return Response(
                {"detail": "This order is no longer awaiting payment."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except InsufficientStockError:
            try:
                request_razorpay_refund(
                    client,
                    razorpay_payment_id,
                    {
                        "reason": "Insufficient stock",
                        "books_blooms_order_id": str(order_id),
                    },
                )

            except PaymentGatewayError:
                logger.exception(
                    "Refund request failed for Razorpay payment %s (order %s).",
                    razorpay_payment_id,
                    order_id,
                )
                return Response(
                    {
                        "detail": (
                            "Payment was received, but stock is unavailable. "
                            "Please contact support regarding your refund."
                        )
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            return Response(
                {
                    "detail": (
                        "Payment was received, but stock is unavailable. "
                        "A refund has been requested."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        if already_verified:
            return Response(
                {
                    "detail": "Payment already verified.",
                    "order": OrderSerializer(order).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "detail": "Payment verified successfully.",
                "order": OrderSerializer(order).data,
            },
            status=status.HTTP_200_OK,
        )


class CouponValidateView(APIView):
    """
    POST /api/orders/coupons/validate/
    Checks a coupon code and returns its discount percent.
    Used by checkout to show a live discount preview.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get("code", "").strip()

        coupon = Coupon.objects.filter(code__iexact=code, is_active=True).first()

        if not coupon or (coupon.expires_at and coupon.expires_at <= timezone.now()):
            return Response(
                {"error": "Invalid or expired coupon code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "code": coupon.code,
                "discount_percent": coupon.discount_percent,
            },
            status=status.HTTP_200_OK,
        )


class AvailableCouponListView(ListAPIView):
    """
    GET /api/orders/coupons/ — list active, unexpired coupons for customers.
    """

    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        now = timezone.now()
        active = Coupon.objects.filter(is_active=True)
        return active.exclude(expires_at__lte=now).order_by("code")
