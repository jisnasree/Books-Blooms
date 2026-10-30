from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "book_title",
            "book_format",
            "unit_price",
            "quantity",
            "item_total",
        ]


class OrderSerializer(serializers.ModelSerializer):
    # Include the books belonging to this order.
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "items",
            "shipping_full_name",
            "shipping_phone_number",
            "shipping_address_line_1",
            "shipping_address_line_2",
            "shipping_city",
            "shipping_state",
            "shipping_postal_code",
            "shipping_country",
            "subtotal",
            "shipping_charge",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "order_status",
            "payment_method",
            "payment_status",
            "created_at",
        ]

        # These values are calculated or controlled by the backend.
        read_only_fields = fields


class OrderCreateSerializer(serializers.Serializer):
    address_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)

    def validate_payment_method(self, value):
        # Razorpay is not integrated yet; only COD can be
        # confirmed without a payment gateway callback.
        if value != Order.PaymentMethod.COD:
            raise serializers.ValidationError(
                "Only Cash on Delivery is currently supported."
            )
        return value
