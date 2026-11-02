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

    # Include the customer's name for admin order management.
    customer_name = serializers.SerializerMethodField()

    def get_customer_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name or obj.user.email

    class Meta:
        model = Order
        fields = [
            "id",
            "customer_name",
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

        read_only_fields = fields


class OrderCreateSerializer(serializers.Serializer):

    address_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)


class OrderCancellationSerializer(serializers.Serializer):

    reason = serializers.CharField(required=False, allow_blank=True)



# Serializer for admin order status updates.
class AdminOrderStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = Order
        fields = ["order_status"]

    def validate_order_status(self, value):

        # Cancellation needs separate inventory restoration logic.
        if value == Order.OrderStatus.CANCELLED:
            raise serializers.ValidationError(
                "Use the cancellation process to cancel an order."
            )

        return value