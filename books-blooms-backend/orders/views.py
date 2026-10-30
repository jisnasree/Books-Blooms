from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from addresses.models import Address
from cart.models import Cart
from .models import Order, OrderItem
from .serializers import OrderCreateSerializer, OrderSerializer


from rest_framework.generics import ListCreateAPIView


class OrderListCreateView(ListCreateAPIView):
    """
    GET  /api/orders/ lists the user's orders, newest first.
    POST /api/orders/ creates an order from the user's cart.

    POST expects {"address_id": <id>, "payment_method": "COD"}.
    Totals are server-calculated; the address is snapshotted.
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

        address = Address.objects.filter(
            pk=serializer.validated_data["address_id"],
            user=request.user,
        ).first()
        if address is None:
            return Response(
                {"error": "Address not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = Cart.objects.filter(user=request.user).first()
        if cart is None or not cart.items.exists():
            return Response(
                {"error": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_items = cart.items.select_related("variant", "variant__book")

        for item in cart_items:
            if (
                not item.variant.is_available
                or item.quantity > item.variant.stock_quantity
            ):
                return Response(
                    {"error": f"Not enough stock for {item.variant.book.title}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            subtotal = sum(item.variant.price * item.quantity for item in cart_items)

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
                total_amount=subtotal,
                payment_method=serializer.validated_data["payment_method"],
                order_status=Order.OrderStatus.CONFIRMED,
                payment_status=Order.PaymentStatus.PENDING,
            )

            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    variant=item.variant,
                    book_title=item.variant.book.title,
                    book_format=item.variant.format,
                    unit_price=item.variant.price,
                    quantity=item.quantity,
                    item_total=item.variant.price * item.quantity,
                )
                item.variant.stock_quantity -= item.quantity
                item.variant.save(update_fields=["stock_quantity", "updated_at"])

            cart.items.all().delete()

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class OrderDetailView(RetrieveAPIView):
    """
    GET /api/orders/<pk>/ retrieves one of the user's own orders.
    Orders belonging to other users return 404.
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")
