from rest_framework.generics import (
    ListAPIView,
    RetrieveUpdateAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from decimal import Decimal
import logging

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils import timezone

from addresses.models import Address
from cart.models import Cart
from catalog.models import PhysicalVariant

from .models import Order, OrderItem, Coupon
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
    OrderAlreadyPaidError,
    OrderNotAwaitingPaymentError,
    finalize_razorpay_order,
)
from .serializers import (

    OrderCreateSerializer,
    OrderSerializer,
    OrderCancellationSerializer,
    CouponSerializer,
)
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

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

        payment_method = serializer.validated_data["payment_method"]
        coupon_code = serializer.validated_data.get("coupon_code", "").strip()
        is_cod = payment_method == Order.PaymentMethod.COD

        # Find the selected address belonging to this user
        address = Address.objects.filter(
            pk=serializer.validated_data["address_id"],
            user=request.user,
        ).first()

        if address is None:
            return Response(
                {"error": "Address not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the customer's cart
        cart = Cart.objects.filter(user=request.user).first()

        if cart is None or not cart.items.exists():
            return Response(
                {"error": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_items = list(cart.items.select_related("variant", "variant__book"))

        # Check stock availability
        for item in cart_items:

            if (
                not item.variant.is_available
                or item.quantity > item.variant.stock_quantity
            ):
                return Response(
                    {"error": (f"Not enough stock for " f"{item.variant.book.title}.")},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():

            # Calculate subtotal
            subtotal = sum(item.variant.price * item.quantity for item in cart_items)

            # Apply coupon to the subtotal if a valid code was given
            discount_amount = Decimal("0.00")

            if coupon_code:
                coupon = Coupon.objects.filter(
                    code__iexact=coupon_code, is_active=True
                ).first()

                if coupon and (
                    coupon.expires_at is None or coupon.expires_at > timezone.now()
                ):
                    discount_amount = (
                        subtotal * Decimal(coupon.discount_percent) / Decimal("100")
                    )
                else:
                    return Response(
                        {"error": "Invalid or expired coupon code."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            discounted_subtotal = subtotal - discount_amount

            # Free delivery when subtotal is above ₹2,000.
            # Otherwise, charge ₹100.
            delivery_charge = (
                Decimal("0.00")
                if discounted_subtotal > Decimal("2000.00")
                else Decimal("100.00")
            )

            # Calculate tax at 8.25% on the discounted subtotal
            tax_rate = Decimal("0.0825")
            tax_amount = discounted_subtotal * tax_rate

            # Calculate final order amount
            total_amount = discounted_subtotal + delivery_charge + tax_amount

            # Cancel any earlier unpaid Razorpay orders so only one
            # pending online-payment order exists per customer.
            Order.objects.filter(
                user=request.user,
                payment_method=Order.PaymentMethod.RAZORPAY,
                payment_status=Order.PaymentStatus.PENDING,
                order_status=Order.OrderStatus.PENDING,
            ).update(
                order_status=Order.OrderStatus.CANCELLED,
                cancelled_at=timezone.now(),
                cancellation_reason="Superseded by a new checkout attempt.",
            )

            # Create Books & Blooms order
            order = Order.objects.create(
                user=request.user,
                shipping_full_name=address.full_name,
                shipping_phone_number=address.phone_number,
                shipping_address_line_1=address.address_line_1,
                shipping_address_line_2=address.address_line_2,
                shipping_city=address.city,
                shipping_state=address.state,
                shipping_postal_code=address.postal_code,
                shipping_country=address.country,
                subtotal=subtotal,
                shipping_charge=delivery_charge,
                tax_amount=tax_amount,
                discount_amount=discount_amount,
                total_amount=total_amount,
                payment_method=payment_method,
                # COD orders are confirmed immediately.
                # Razorpay orders remain pending until payment succeeds.
                order_status=(
                    Order.OrderStatus.CONFIRMED if is_cod else Order.OrderStatus.PENDING
                ),
                payment_status=Order.PaymentStatus.PENDING,
            )

            # Create order items
            for item in cart_items:

                OrderItem.objects.create(
                    order=order,
                    variant=item.variant,
                    book_title=item.variant.book.title,
                    book_format=item.variant.format,
                    unit_price=item.variant.price,
                    quantity=item.quantity,
                    item_total=(item.variant.price * item.quantity),
                )

                # Reduce stock immediately only for COD orders.
                if is_cod:

                    item.variant.stock_quantity -= item.quantity

                    item.variant.save(
                        update_fields=[
                            "stock_quantity",
                            "updated_at",
                        ]
                    )

            # Clear cart immediately only for COD orders.
            if is_cod:
                cart.items.all().delete()

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
        return Order.objects.filter(user=self.request.user).prefetch_related("items")


class OrderCancellationView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):

        with transaction.atomic():

            # Lock the order to prevent duplicate cancellation
            order = get_object_or_404(
                Order.objects.select_for_update(), id=order_id, user=request.user
            )

            # Check whether cancellation is allowed
            cancellable_statuses = [
                Order.OrderStatus.PENDING,
                Order.OrderStatus.CONFIRMED,
                Order.OrderStatus.PROCESSING,
            ]

            if order.order_status not in cancellable_statuses:
                return Response(
                    {"detail": "This order cannot be cancelled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate cancellation reason
            serializer = OrderCancellationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Restore stock only if it was previously deducted.
            # COD stock is deducted during order creation.
            # Razorpay stock is deducted after successful payment.
            if (
                order.payment_method == Order.PaymentMethod.COD
                or order.payment_status == Order.PaymentStatus.PAID
            ):

                for item in order.items.all():

                    PhysicalVariant.objects.filter(id=item.variant_id).update(
                        stock_quantity=F("stock_quantity") + item.quantity
                    )

            # Update order status and cancellation details
            order.order_status = Order.OrderStatus.CANCELLED
            order.cancellation_reason = serializer.validated_data.get("reason", "")
            order.cancelled_at = timezone.now()

            order.save(
                update_fields=[
                    "order_status",
                    "cancellation_reason",
                    "cancelled_at",
                    "updated_at",
                ]
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
