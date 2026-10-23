from rest_framework import serializers
from .models import Author, Book, Category, PhysicalVariant


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
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
    categories = serializers.StringRelatedField(many=True, read_only=True)

    format = serializers.CharField(write_only=True)
    price = serializers.DecimalField(max_digits=12, decimal_places=2, write_only=True)
    currency = serializers.CharField(max_length=3, default="INR", write_only=True)
    stock_quantity = serializers.IntegerField(min_value=0, write_only=True)

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
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        # Remove physical variant fields from the book data
        book_format = validated_data.pop("format")
        price = validated_data.pop("price")
        currency = validated_data.pop("currency", "INR")
        stock_quantity = validated_data.pop("stock_quantity")

        # Create the book with its regular fields
        book = Book.objects.create(**validated_data)

        # Create the physical variant for this book
        PhysicalVariant.objects.create(
            book=book,
            format=book_format,
            price=price,
            currency=currency,
            stock_quantity=stock_quantity,
        )

        return book


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]
