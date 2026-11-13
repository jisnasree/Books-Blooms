from django.conf import settings
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone
from django.core.exceptions import ValidationError


# Create your models here.
class Author(models.Model):
    name = models.CharField(max_length=200)


class Category(models.Model):
    name = models.CharField(max_length=100)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                Lower("name"),
                name="unique_category_name_case_insensitive"
            )
        ]
    def __str__(self):
        return self.name


class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.ForeignKey(Author, on_delete=models.PROTECT, related_name="books")
    description = models.TextField()
    cover_url = models.TextField(blank=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, null=True, blank=True)
    categories = models.ManyToManyField(
        Category, through="BookCategory", related_name="books"
    )
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class BookCategory(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["book", "category"], name="unique_book_category"
            )
        ]


class PhysicalVariant(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)

    format = models.CharField(max_length=10)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    stock_quantity = models.PositiveIntegerField()
    is_available = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.book.title} - {self.format}"


class WishlistItem(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )

    book = models.ForeignKey(
        "catalog.Book", on_delete=models.CASCADE, related_name="wishlisted_by"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "book"], name="unique_user_wishlist_book"
            )
        ]



class Offer(models.Model):

    OFFER_TYPES = [
        ("CATEGORY", "Category Offer"),
        ("PRODUCT", "Product Offer"),
    ]

    DISCOUNT_TYPES = [
        ("PERCENTAGE", "Percentage"),
        ("FIXED", "Fixed Amount"),
    ]

    name = models.CharField(max_length=100)

    offer_type = models.CharField(
        max_length=20,
        choices=OFFER_TYPES
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="offers"
    )

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="offers"
    )

    discount_type = models.CharField(
        max_length=20,
        choices=DISCOUNT_TYPES
    )

    discount_value = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    start_date = models.DateTimeField()
    end_date = models.DateTimeField()

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.offer_type == "CATEGORY":
            if not self.category or self.book:
                raise ValidationError(
                    "A category offer must have a category only."
                )

        elif self.offer_type == "PRODUCT":
            if not self.book or self.category:
                raise ValidationError(
                    "A product offer must have a book only."
                )

        if self.discount_value <= 0:
            raise ValidationError(
                "Discount value must be greater than zero."
            )

        if self.discount_type == "PERCENTAGE":
            if self.discount_value > 100:
                raise ValidationError(
                    "Percentage discount cannot exceed 100."
                )

        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError(
                    "End date must be later than start date."
                )

    def __str__(self):
        return self.name

