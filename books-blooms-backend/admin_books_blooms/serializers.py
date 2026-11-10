
from rest_framework import serializers
from django.contrib.auth import get_user_model
from orders.models import Order


User = get_user_model()


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "date_joined",
            "is_active",
            "is_blocked",
        ]

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
