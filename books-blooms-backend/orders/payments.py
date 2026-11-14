from decimal import Decimal

import razorpay
from django.conf import settings
from razorpay.errors import BadRequestError, GatewayError, ServerError
from razorpay.errors import SignatureVerificationError

RAZORPAY_API_ERRORS = (BadRequestError, GatewayError, ServerError)


class PaymentVerificationError(Exception):
    def __init__(self, detail):
        self.detail = detail
        super().__init__(detail)


class PaymentGatewayError(Exception):
    pass


def get_razorpay_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


def amount_in_paise(amount):
    return int(Decimal(str(amount)) * 100)


def create_razorpay_order(client, payment_data):
    try:
        return client.order.create(data=payment_data)
    except RAZORPAY_API_ERRORS as error:
        raise PaymentGatewayError("Unable to create Razorpay order.") from error


def request_razorpay_refund(client, razorpay_payment_id, notes):
    try:
        return client.payment.refund(razorpay_payment_id, {"notes": notes})
    except RAZORPAY_API_ERRORS as error:
        raise PaymentGatewayError("Unable to request Razorpay refund.") from error


def verify_razorpay_payment(
    client,
    *,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    expected_amount,
):
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )
    except SignatureVerificationError as error:
        raise PaymentVerificationError(
            "Payment verification failed."
        ) from error
    except RAZORPAY_API_ERRORS as error:
        raise PaymentGatewayError("Unable to verify Razorpay payment.") from error

    try:
        payment = client.payment.fetch(razorpay_payment_id)
    except RAZORPAY_API_ERRORS as error:
        raise PaymentGatewayError("Unable to fetch Razorpay payment.") from error

    if payment.get("order_id") != razorpay_order_id:
        raise PaymentVerificationError("Payment does not belong to this order.")

    if payment.get("amount") != expected_amount or payment.get("currency") != "INR":
        raise PaymentVerificationError("Payment amount or currency mismatch.")

    if payment.get("status") == "authorized":
        try:
            client.payment.capture(razorpay_payment_id, expected_amount)
            payment = client.payment.fetch(razorpay_payment_id)
        except RAZORPAY_API_ERRORS as error:
            raise PaymentGatewayError("Unable to capture Razorpay payment.") from error

    if payment.get("status") != "captured":
        raise PaymentVerificationError("Payment has not been captured.")
