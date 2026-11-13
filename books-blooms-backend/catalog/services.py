
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Q
from django.utils import timezone

from .models import Offer


def calculate_discount(offer, price):
    """
    Calculate the discount amount based on the offer type.
    """

    if offer.discount_type == "PERCENTAGE":
        discount = price * offer.discount_value / Decimal("100")
    else:
        discount = offer.discount_value

    # Discount cannot exceed the original price
    discount = min(discount, price)

    return discount.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


def get_best_offer(book, price):
    """
    Find the best active offer applicable to a book.

    Checks:
    1. Product offers for the specific book.
    2. Category offers for the book's categories.

    Returns the offer that provides the highest discount.
    """

    price = Decimal(str(price))
    now = timezone.now()

    # Get active offers within their valid date range
    offers = Offer.objects.filter(
        is_active=True,
        start_date__lte=now,
        end_date__gte=now
    ).filter(
        Q(offer_type="PRODUCT", book=book)
        |
        Q(
            offer_type="CATEGORY",
            category__in=book.categories.all()
        )
    ).distinct()

    best_offer = None
    best_discount = Decimal("0.00")

    for offer in offers:

        discount = calculate_discount(offer, price)

        # Select the offer providing the highest discount
        if discount > best_discount:
            best_offer = offer
            best_discount = discount

        # If discounts are equal, prefer the product offer
        elif discount == best_discount and best_offer:
            if offer.offer_type == "PRODUCT":
                best_offer = offer

    final_price = price - best_discount

    if price > 0:
        discount_percentage = (
            best_discount / price * Decimal("100")
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )
    else:
        discount_percentage = Decimal("0.00")

    return {
        "original_price": price,
        "discount_amount": best_discount,
        "discount_percentage": discount_percentage,
        "final_price": final_price,
        "applied_offer": best_offer,
    }
