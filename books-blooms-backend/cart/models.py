from django.db import models

# Create your models here.

from django.conf import settings
from django.db import models


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.email}"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items"
    )
    variant = models.ForeignKey(
        "catalog.PhysicalVariant",
        on_delete=models.PROTECT
    )
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.variant.book.title} - {self.quantity}"
