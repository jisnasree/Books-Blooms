from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticatedOrReadOnly
from .models import Book, Author, Category
from .serializers import BookSerializer, AuthorSerializer, CategorySerializer
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination


class BookPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 100


class BookListView(ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    pagination_class = BookPagination

    # permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        queryset = (
            Book.objects.select_related("author")
            .prefetch_related("categories", "physicalvariant_set")
            .order_by("id")
        )
        params = self.request.query_params

        search = params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(author__name__icontains=search)
            )

        category = params.get("category")
        if category:
            try:
                category_id = int(category)
            except ValueError as error:
                raise ValidationError(
                    {"category": "Category must be a positive integer."}
                ) from error

            if category_id < 1:
                raise ValidationError(
                    {"category": "Category must be a positive integer."}
                )

            queryset = queryset.filter(categories__id=category_id)

        price = params.get("price")
        price_filters = {
            "under1000": {"physicalvariant__price__lt": 1000},
            "1000to3000": {
                "physicalvariant__price__gte": 1000,
                "physicalvariant__price__lte": 3000,
            },
            "over3000": {"physicalvariant__price__gt": 3000},
        }

        if price:
            if price not in price_filters:
                raise ValidationError(
                    {"price": "Choose under1000, 1000to3000, or over3000."}
                )
            queryset = queryset.filter(**price_filters[price])

        book_format = params.get("format", "").strip()
        if book_format:
            queryset = queryset.filter(physicalvariant__format__iexact=book_format)

        return queryset.distinct()


class BookDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminUser()]


class AuthorsListView(ListCreateAPIView):
    queryset = Author.objects.all().order_by("name")
    serializer_class = AuthorSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]


class AuthorDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    permission_classes = [IsAdminUser]


class CategoryListView(ListCreateAPIView):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminUser()]


class CategoryDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]
