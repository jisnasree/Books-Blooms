from django.db import models


# Create your models here.
class Author(models.Model):
    name = models.CharField(max_length=200)


class Category(models.Model):
    name = models.CharField(max_length=100)

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


from django.conf import settings
from django.db import models


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
