from decimal import Decimal
from typing import NamedTuple

from django.db import transaction
from django.db.models import Case, F, PositiveIntegerField, When
from django.shortcuts import get_object_or_404
from django.utils import timezone

from addresses.models import Address
from cart.models import Cart
from catalog.models import PhysicalVariant

from .models import Coupon, Order, OrderItem
from .payments import (
    amount_in_paise,
    create_razorpay_order,
    get_razorpay_client,
)


class OrderAddressNotFound(Exception):
    pass


class OrderCartEmpty(Exception):
    pass


class OrderCouponInvalid(Exception):
    pass


class OrderStockUnavailable(Exception):
    def __init__(self, book_title):
        self.book_title = book_title
        super().__init__(book_title)


class OrderNotFound(Exception):
    pass


class OrderNotCancellable(Exception):
    pass


class OrderNotRazorpayOrder(Exception):
    pass


class OrderAlreadyPaidError(Exception):
    pass


class OrderNotAwaitingPaymentError(Exception):
    pass


class InsufficientStockError(Exception):
    pass


class OrderTotals(NamedTuple):
    subtotal: Decimal
    discount_amount: Decimal
    shipping_charge: Decimal
    tax_amount: Decimal
    total: Decimal


def get_valid_coupon(code):
    coupon = Coupon.objects.filter(
        code__iexact=code.strip(),
        is_active=True,
    ).first()
    if not coupon or (
        coupon.expires_at is not None and coupon.expires_at <= timezone.now()
    ):
        raise OrderCouponInvalid
    return coupon


def calculate_order_totals(subtotal, discount_percent=0):
    discount_amount = (
        subtotal * Decimal(discount_percent) / Decimal("100")
    )
    discounted_subtotal = subtotal - discount_amount
    shipping_charge = (
        Decimal("0.00")
        if discounted_subtotal > Decimal("2000.00")
        else Decimal("100.00")
    )
    tax_amount = discounted_subtotal * Decimal("0.0825")
    total = discounted_subtotal + shipping_charge + tax_amount
    return OrderTotals(
        subtotal,
        discount_amount,
        shipping_charge,
        tax_amount,
        total,
    )


def create_razorpay_order_for_order(order_id, user_id):
    order = Order.objects.filter(id=order_id, user_id=user_id).first()
    if order is None:
        raise OrderNotFound
    if order.payment_method != Order.PaymentMethod.RAZORPAY:
        raise OrderNotRazorpayOrder
    if (
        order.payment_status != Order.PaymentStatus.PENDING
        or order.order_status != Order.OrderStatus.PENDING
    ):
        raise OrderNotAwaitingPaymentError

    amount = amount_in_paise(order.total_amount)
    razorpay_order_id = order.razorpay_order_id
    if not razorpay_order_id:
        client = get_razorpay_client()
        razorpay_order = create_razorpay_order(
            client,
            {
                "amount": amount,
                "currency": "INR",
                "receipt": f"books-blooms-{order.id}",
                "notes": {"books_blooms_order_id": str(order.id)},
            },
        )
        razorpay_order_id = razorpay_order["id"]
        order.razorpay_order_id = razorpay_order_id
        order.save(update_fields=["razorpay_order_id"])

    return order, razorpay_order_id, amount


@transaction.atomic
def create_order_from_cart(user, address_id, payment_method, coupon_code=""):
    address = Address.objects.filter(pk=address_id, user=user).first()
    if address is None:
        raise OrderAddressNotFound

    cart = Cart.objects.filter(user=user).first()
    if cart is None:
        raise OrderCartEmpty

    cart_items = list(cart.items.select_related("variant", "variant__book"))
    if not cart_items:
        raise OrderCartEmpty

    for item in cart_items:
        if (
            not item.variant.is_available
            or item.quantity > item.variant.stock_quantity
        ):
            raise OrderStockUnavailable(item.variant.book.title)

    subtotal = sum(
        (item.variant.price * item.quantity for item in cart_items),
        Decimal("0.00"),
    )
    discount_percent = 0

    if coupon_code:
        discount_percent = get_valid_coupon(coupon_code).discount_percent

    totals = calculate_order_totals(subtotal, discount_percent)
    is_cod = payment_method == Order.PaymentMethod.COD

    Order.objects.filter(
        user=user,
        payment_method=Order.PaymentMethod.RAZORPAY,
        payment_status=Order.PaymentStatus.PENDING,
        order_status=Order.OrderStatus.PENDING,
    ).update(
        order_status=Order.OrderStatus.CANCELLED,
        cancelled_at=timezone.now(),
        cancellation_reason="Superseded by a new checkout attempt.",
    )

    order = Order.objects.create(
        user=user,
        shipping_full_name=address.full_name,
        shipping_phone_number=address.phone_number,
        shipping_address_line_1=address.address_line_1,
        shipping_address_line_2=address.address_line_2,
        shipping_city=address.city,
        shipping_state=address.state,
        shipping_postal_code=address.postal_code,
        shipping_country=address.country,
        subtotal=totals.subtotal,
        shipping_charge=totals.shipping_charge,
        tax_amount=totals.tax_amount,
        discount_amount=totals.discount_amount,
        total_amount=totals.total,
        payment_method=payment_method,
        order_status=(
            Order.OrderStatus.CONFIRMED if is_cod else Order.OrderStatus.PENDING
        ),
        payment_status=Order.PaymentStatus.PENDING,
    )

    OrderItem.objects.bulk_create(
        [
            OrderItem(
                order=order,
                variant=item.variant,
                book_title=item.variant.book.title,
                book_format=item.variant.format,
                unit_price=item.variant.price,
                quantity=item.quantity,
                item_total=item.variant.price * item.quantity,
            )
            for item in cart_items
        ]
    )

    if is_cod:
        for item in cart_items:
            updated = PhysicalVariant.objects.filter(
                id=item.variant_id,
                is_available=True,
                stock_quantity__gte=item.quantity,
            ).update(stock_quantity=F("stock_quantity") - item.quantity)
            if not updated:
                raise OrderStockUnavailable(item.variant.book.title)

        cart.items.all().delete()

    return (
        Order.objects.select_related("user")
        .prefetch_related("items")
        .get(pk=order.pk)
    )


@transaction.atomic
def cancel_order(order_id, user_id, reason=""):
    order = (
        Order.objects.select_for_update()
        .filter(id=order_id, user_id=user_id)
        .first()
    )
    if order is None:
        raise OrderNotFound

    cancellable_statuses = {
        Order.OrderStatus.PENDING,
        Order.OrderStatus.CONFIRMED,
        Order.OrderStatus.PROCESSING,
    }
    if order.order_status not in cancellable_statuses:
        raise OrderNotCancellable

    if (
        order.payment_method == Order.PaymentMethod.COD
        or order.payment_status == Order.PaymentStatus.PAID
    ):
        quantities_by_variant = {}
        for variant_id, quantity in order.items.values_list(
            "variant_id", "quantity"
        ):
            quantities_by_variant[variant_id] = (
                quantities_by_variant.get(variant_id, 0) + quantity
            )

        if quantities_by_variant:
            stock_quantity = Case(
                *(
                    When(pk=variant_id, then=F("stock_quantity") + quantity)
                    for variant_id, quantity in quantities_by_variant.items()
                ),
                output_field=PositiveIntegerField(),
            )
            PhysicalVariant.objects.filter(
                pk__in=quantities_by_variant
            ).update(stock_quantity=stock_quantity)

    order.order_status = Order.OrderStatus.CANCELLED
    order.cancellation_reason = reason
    order.cancelled_at = timezone.now()
    order.save(
        update_fields=[
            "order_status",
            "cancellation_reason",
            "cancelled_at",
            "updated_at",
        ]
    )
    return order


@transaction.atomic
def finalize_razorpay_order(order_id, user_id, razorpay_payment_id):
    order = get_object_or_404(
        Order.objects.select_for_update(),
        id=order_id,
        user_id=user_id,
    )

    if order.payment_status == Order.PaymentStatus.PAID:
        if order.razorpay_payment_id == razorpay_payment_id:
            return order, True
        raise OrderAlreadyPaidError

    if (
        order.payment_status != Order.PaymentStatus.PENDING
        or order.order_status != Order.OrderStatus.PENDING
    ):
        raise OrderNotAwaitingPaymentError

    order_items = list(order.items.all())

    for item in order_items:
        updated = PhysicalVariant.objects.filter(
            id=item.variant_id,
            is_available=True,
            stock_quantity__gte=item.quantity,
        ).update(stock_quantity=F("stock_quantity") - item.quantity)

        if updated == 0:
            raise InsufficientStockError

    order.razorpay_payment_id = razorpay_payment_id
    order.payment_status = Order.PaymentStatus.PAID
    order.order_status = Order.OrderStatus.CONFIRMED
    order.save(
        update_fields=[
            "razorpay_payment_id",
            "payment_status",
            "order_status",
            "updated_at",
        ]
    )

    cart = Cart.objects.select_for_update().filter(user_id=user_id).first()
    if cart:
        cart_quantities = {}
        for cart_item in cart.items.all():
            cart_quantities[cart_item.variant_id] = (
                cart_quantities.get(cart_item.variant_id, 0) + cart_item.quantity
            )

        order_quantities = {}
        for item in order_items:
            order_quantities[item.variant_id] = (
                order_quantities.get(item.variant_id, 0) + item.quantity
            )

        if cart_quantities == order_quantities:
            cart.items.all().delete()

    return order, False
