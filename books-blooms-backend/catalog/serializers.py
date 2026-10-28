from rest_framework import serializers
from django.db import transaction
from .models import Author, Book, Category, PhysicalVariant


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ["id", "name"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class PhysicalVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhysicalVariant
        fields = [
            "id",
            "format",
            "price",
            "currency",
            "stock_quantity",
            "is_available",
        ]


class BookSerializer(serializers.ModelSerializer):

    author_name = serializers.CharField(source="author.name", read_only=True)
    physical_variants = PhysicalVariantSerializer(
        source="physicalvariant_set", many=True, read_only=True
    )
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), many=True, required=False
    )

    format = serializers.CharField(write_only=True, required=False)
    price = serializers.DecimalField(
        max_digits=12, decimal_places=2, write_only=True, required=False
    )
    currency = serializers.CharField(
        max_length=3, default="INR", write_only=True, required=False
    )
    stock_quantity = serializers.IntegerField(
        min_value=0, write_only=True, required=False
    )

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "author",
            "description",
            "cover_url",
            "rating",
            "featured",
            "created_at",
            "updated_at",
            "author_name",
            "categories",
            "physical_variants",
            "format",
            "price",
            "currency",
            "stock_quantity",
            "category_ids",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    @transaction.atomic
    def create(self, validated_data):
        # Remove physical variant fields from the book data
        book_format = validated_data.pop("format")
        price = validated_data.pop("price")
        currency = validated_data.pop("currency", "INR")
        stock_quantity = validated_data.pop("stock_quantity")

        # Get the selected categories
        categories = validated_data.pop("category_ids", [])

        # Create the book with its regular fields
        book = Book.objects.create(**validated_data)

        # Assign categories to the book
        book.categories.set(categories)

        # Create the physical variant for this book
        PhysicalVariant.objects.create(
            book=book,
            format=book_format,
            price=price,
            currency=currency,
            stock_quantity=stock_quantity,
        )

        return book

    @transaction.atomic
    def update(self, instance, validated_data):
        category_ids = validated_data.pop("category_ids", None)

        variant_data = {
            key: validated_data.pop(key)
            for key in ("format", "price", "currency", "stock_quantity")
            if key in validated_data
        }

        instance = super().update(instance, validated_data)

        if category_ids is not None:
            instance.categories.set(category_ids)

        if variant_data:
            variant = instance.physicalvariant_set.first()

            if variant:
                for field, value in variant_data.items():
                    setattr(variant, field, value)

                # Keep availability in sync with stock
                if "stock_quantity" in variant_data:
                    variant.is_available = variant.stock_quantity > 0

                variant.save()
            elif {"format", "price", "stock_quantity"} <= variant_data.keys():
                PhysicalVariant.objects.create(
                    book=instance,
                    is_available=variant_data["stock_quantity"] > 0,
                    **variant_data,
                )

        return instance


from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source="book", read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "book", "book_details", "created_at"]
        read_only_fields = ["id", "created_at"]
