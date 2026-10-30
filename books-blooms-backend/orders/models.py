from django.conf import settings
from django.db import models


class Order(models.Model):

    # Order status
    class OrderStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        PROCESSING = "PROCESSING", "Processing"
        SHIPPED = "SHIPPED", "Shipped"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    # Payment method
    class PaymentMethod(models.TextChoices):
        COD = "COD", "Cash on Delivery"
        RAZORPAY = "RAZORPAY", "Razorpay"

    # Payment status
    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )

    # Keep the address used for this order, even if the
    # customer later edits or deletes their saved address.
    shipping_full_name = models.CharField(max_length=150)
    shipping_phone_number = models.CharField(max_length=20)
    shipping_address_line_1 = models.CharField(max_length=255)
    shipping_address_line_2 = models.CharField(
        max_length=255,
        blank=True,
    )
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100)

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    shipping_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    order_status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )

    # Store Razorpay's order ID when online payment is initiated.
    razorpay_order_id = models.CharField(
        max_length=100,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user}"


class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    # Preserve the purchased book/variant reference.
    # Keep the purchased title and price even if catalog details change.
    variant = models.ForeignKey(
        "catalog.PhysicalVariant",
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    book_title = models.CharField(max_length=255)
    book_format = models.CharField(max_length=20)
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    quantity = models.PositiveIntegerField()
    item_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    def __str__(self):
        return f"{self.book_title} x {self.quantity}"
