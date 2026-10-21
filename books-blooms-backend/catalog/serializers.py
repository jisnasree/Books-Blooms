
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
    
    author_name = serializers.CharField(source = "author.name",read_only = True)
    physical_variants = PhysicalVariantSerializer(source="physicalvariant_set",many=True,read_only=True)
    categories = serializers.StringRelatedField(many=True,read_only=True)
    
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
        ]


        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]