# Import Django REST Framework's serializer tools.
from rest_framework import serializers

# Import the database models that these serializers work with.
from .models import Cart, CartItem


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
            "quantity",
        ]
        # The database automatically generates the CartItem ID.
        # The client does not need to provide it.
        read_only_fields = ["id"]

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
