import re

from rest_framework import serializers
from django.db import transaction
from .models import Author, Book, Category, PhysicalVariant, Offer
from .services import get_best_offer
from .models import WishlistItem


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ["id", "name"]

    def validate_name(self, value):
        value = value.strip()

        # Check for empty name
        if not value:
            raise serializers.ValidationError("Author name is required.")

        if not re.fullmatch(
            r"[^\W\d_]+(?:[ .'-][^\W\d_]+)*\.?",
            value,
            re.UNICODE
        ):
            raise serializers.ValidationError(
                "Author name can contain only letters, spaces, hyphens, apostrophes and periods."
            )
        # Check for duplicate names (case-insensitive)
        if Author.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("Author already exists.")

        return value


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]

    def validate_name(self, value):
        if Category.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("Category already exists.")


class PhysicalVariantSerializer(serializers.ModelSerializer):
    original_price = serializers.DecimalField(
        source="price", max_digits=12, decimal_places=2, read_only=True
    )

    discount_amount = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()
    applied_offer = serializers.SerializerMethodField()

    class Meta:
        model = PhysicalVariant
        fields = [
            "id",
            "format",
            "price",
            "original_price",
            "discount_amount",
            "discount_percentage",
            "final_price",
            "applied_offer",
            "currency",
            "stock_quantity",
            "is_available",
        ]

    def get_offer_details(self, obj):
        return get_best_offer(obj.book, obj.price)

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


class WishlistItemSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source="book", read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "book", "book_details", "created_at"]
        read_only_fields = ["id", "created_at"]


class OfferSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(source="category.name", read_only=True)

    book_title = serializers.CharField(source="book.title", read_only=True)

    class Meta:
        model = Offer
        fields = [
            "id",
            "name",
            "offer_type",
            "category",
            "category_name",
            "book",
            "book_title",
            "discount_type",
            "discount_value",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
        ]

        read_only_fields = ["id", "created_at"]

    def validate(self, data):

        # Get submitted values or existing values during update
        offer_type = data.get("offer_type", getattr(self.instance, "offer_type", None))

        category = data.get("category", getattr(self.instance, "category", None))

        book = data.get("book", getattr(self.instance, "book", None))

        discount_type = data.get(
            "discount_type", getattr(self.instance, "discount_type", None)
        )

        discount_value = data.get(
            "discount_value", getattr(self.instance, "discount_value", None)
        )

        start_date = data.get("start_date", getattr(self.instance, "start_date", None))

        end_date = data.get("end_date", getattr(self.instance, "end_date", None))

        # Validate offer type and related object
        if offer_type == "CATEGORY":
            if not category or book:
                raise serializers.ValidationError(
                    "Category offer requires a category only."
                )

        elif offer_type == "PRODUCT":
            if not book or category:
                raise serializers.ValidationError("Product offer requires a book only.")

        # Validate discount
        if discount_value is not None:
            if discount_value <= 0:
                raise serializers.ValidationError("Discount must be greater than zero.")

            if discount_type == "PERCENTAGE" and discount_value > 100:
                raise serializers.ValidationError(
                    "Percentage discount cannot exceed 100%."
                )

        # Validate dates
        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError("End date must be later than start date.")

        return data
