# Import Django REST Framework's serializer tools.
from rest_framework import serializers

# Import the database models that these serializers work with.
from .models import Cart, CartItem
from catalog.services import get_best_offer
from decimal import Decimal

class CartItemSerializer(serializers.ModelSerializer):
    """
    Converts a CartItem model object into JSON and validates
    the data received when adding a cart item.
    """

    # Book details retrieved through the related PhysicalVariant.
    book_title = serializers.CharField(source="variant.book.title", read_only=True)

    author_name = serializers.CharField(
        source="variant.book.author.name", read_only=True
    )

    cover_url = serializers.CharField(source="variant.book.cover_url", read_only=True)

    format = serializers.CharField(source="variant.format", read_only=True)

    price = serializers.DecimalField(
        source="variant.price", max_digits=12, decimal_places=2, read_only=True
    )
    discount_amount = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()
    applied_offer = serializers.SerializerMethodField()

    class Meta:
        # Tell Django REST Framework which model to use.
        model = CartItem

        # Fields included in the serialized response or accepted
        # as input when creating a CartItem.
        
        fields = [
            "id",
            "variant",
            "book_title",
            "author_name",
            "cover_url",
            "format",
            "price",
            "discount_amount",
            "discount_percentage",
            "final_price",
            "applied_offer",
            "quantity",
        ]
        # The database automatically generates the CartItem ID.
        # The client does not need to provide it.
        read_only_fields = ["id"]
    def get_offer_details(self, obj):
        return get_best_offer(obj.variant.book, obj.variant.price)

    def get_discount_amount(self, obj):
        return self.get_offer_details(obj)["discount_amount"]

    def get_discount_percentage(self, obj):
        return self.get_offer_details(obj)["discount_percentage"]

    def get_final_price(self, obj):
        return self.get_offer_details(obj)["final_price"]

    def get_applied_offer(self, obj):
        offer = self.get_offer_details(obj)["applied_offer"]
        if offer:
            return {
                "id": offer.id,
                "name": offer.name,
                "offer_type": offer.offer_type,
            }
        return None
    # Custom validation for the quantity field.
    # This prevents a customer from adding zero or negative quantities.
    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")

        # Return the quantity if it passes validation.
        return value


class CartSerializer(serializers.ModelSerializer):
    """
    Converts a Cart model object into JSON, including all the
    CartItems belonging to that cart.
    """

    # 'items' matches the related_name="items" on CartItem.cart.
    # many=True means a cart can contain multiple CartItems.
    # read_only=True means this serializer displays existing items
    # but does not create or update them through the Cart serializer.
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        # This serializer works with the Cart model.
        model = Cart

        # Return the cart ID, its items, and its timestamps.
        fields = ["id", "items", "created_at", "updated_at"]


class UpdateCartItemSerializer(serializers.ModelSerializer):
    """
    Used when updating an existing CartItem, such as changing
    its quantity through a PATCH request.
    """

    class Meta:
        # This serializer updates a CartItem model object.
        model = CartItem

        # Only the quantity can be changed using this serializer.
        fields = ["quantity"]

    # Apply the same quantity validation when updating an item.
    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")

        # Return the quantity if it passes validation.
        return value
