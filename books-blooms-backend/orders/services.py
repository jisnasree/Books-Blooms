from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404

from cart.models import Cart
from catalog.models import PhysicalVariant

from .models import Order


class OrderAlreadyPaidError(Exception):
    pass


class OrderNotAwaitingPaymentError(Exception):
    pass


class InsufficientStockError(Exception):
    pass


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
