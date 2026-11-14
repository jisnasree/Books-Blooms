from decimal import Decimal
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from cart.models import Cart, CartItem
from catalog.models import Author, Book, PhysicalVariant
from razorpay.errors import GatewayError
from razorpay.errors import SignatureVerificationError

from .models import Order, OrderItem
from .payments import amount_in_paise, get_razorpay_client


User = get_user_model()


@override_settings(RAZORPAY_KEY_ID="test_key", RAZORPAY_KEY_SECRET="test_secret")
class RazorpayPaymentTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="reader",
            email="reader@example.com",
            password="test-password",
        )
        self.other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="test-password",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        author = Author.objects.create(name="James Clear")
        self.book = Book.objects.create(
            title="Atomic Habits",
            author=author,
            description="A book about habits.",
        )
        self.variant = PhysicalVariant.objects.create(
            book=self.book,
            format="hardcover",
            price=Decimal("6.17"),
            stock_quantity=8,
        )
        self.order = self.create_order(self.user)
        self.order_item = OrderItem.objects.create(
            order=self.order,
            variant=self.variant,
            book_title=self.book.title,
            book_format=self.variant.format,
            unit_price=self.variant.price,
            quantity=2,
            item_total=Decimal("12.34"),
        )
        self.cart = Cart.objects.create(user=self.user)
        self.cart_item = CartItem.objects.create(
            cart=self.cart,
            variant=self.variant,
            quantity=2,
        )

    def create_order(self, user, payment_method=Order.PaymentMethod.RAZORPAY):
        return Order.objects.create(
            user=user,
            shipping_full_name="Reader",
            shipping_phone_number="1234567890",
            shipping_address_line_1="1 Book Street",
            shipping_address_line_2="",
            shipping_city="Booktown",
            shipping_state="CA",
            shipping_postal_code="12345",
            shipping_country="US",
            subtotal=Decimal("12.34"),
            shipping_charge=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("12.34"),
            order_status=Order.OrderStatus.PENDING,
            payment_method=payment_method,
            payment_status=Order.PaymentStatus.PENDING,
            razorpay_order_id="rzp_order_123",
        )

    def gateway(self, payment=None):
        client = Mock()
        client.payment.fetch.return_value = (
            payment
            if payment is not None
            else {
                "order_id": self.order.razorpay_order_id,
                "amount": 1234,
                "currency": "INR",
                "status": "captured",
            }
        )
        return client

    def verify(self, order=None, client=None, **data):
        order = order or self.order
        client = client or self.gateway()
        payload = {
            "razorpay_order_id": order.razorpay_order_id,
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "signature",
            **data,
        }
        with patch("orders.views.get_razorpay_client", return_value=client):
            response = self.client.post(
                f"/api/orders/{order.id}/verify-payment/",
                payload,
                format="json",
            )
        return response, client

    def test_amount_conversion_uses_shared_paise_helper(self):
        self.assertEqual(amount_in_paise(Decimal("12.34")), 1234)

    def test_gateway_factory_uses_configured_credentials(self):
        with patch("orders.payments.razorpay.Client") as razorpay_client:
            get_razorpay_client()

        razorpay_client.assert_called_once_with(auth=("test_key", "test_secret"))

    def test_missing_callback_fields_are_rejected_before_gateway_call(self):
        with patch("orders.views.get_razorpay_client") as get_client:
            response = self.client.post(
                f"/api/orders/{self.order.id}/verify-payment/",
                {},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"],
            "Missing payment verification details.",
        )
        get_client.assert_not_called()

    def test_wrong_owner_and_non_razorpay_orders_are_rejected(self):
        other_order = self.create_order(self.other_user)
        response = self.client.post(
            f"/api/orders/{other_order.id}/verify-payment/",
            {
                "razorpay_order_id": other_order.razorpay_order_id,
                "razorpay_payment_id": "pay_123",
                "razorpay_signature": "signature",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        cod_order = self.create_order(
            self.user,
            payment_method=Order.PaymentMethod.COD,
        )
        with patch("orders.views.get_razorpay_client") as get_client:
            response = self.client.post(
                f"/api/orders/{cod_order.id}/verify-payment/",
                {
                    "razorpay_order_id": cod_order.razorpay_order_id,
                    "razorpay_payment_id": "pay_123",
                    "razorpay_signature": "signature",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "This is not a Razorpay order.")
        get_client.assert_not_called()

    def test_stored_razorpay_order_id_must_match_callback(self):
        with patch("orders.views.get_razorpay_client") as get_client:
            response, _ = self.verify(razorpay_order_id="rzp_order_other")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Invalid Razorpay order ID.")
        get_client.assert_not_called()

    def test_invalid_signature_is_rejected(self):
        client = self.gateway()
        client.utility.verify_payment_signature.side_effect = (
            SignatureVerificationError("invalid signature")
        )

        response, _ = self.verify(client=client)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Payment verification failed.")
        client.payment.fetch.assert_not_called()

    def test_gateway_fetch_failure_uses_verification_failure_response(self):
        client = self.gateway()
        client.payment.fetch.side_effect = GatewayError("provider unavailable")

        response, _ = self.verify(client=client)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Payment verification failed.")

    def test_payment_for_another_provider_order_is_rejected(self):
        client = self.gateway(
            {
                "order_id": "rzp_order_other",
                "amount": 1234,
                "currency": "INR",
                "status": "captured",
            }
        )

        response, _ = self.verify(client=client)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"],
            "Payment does not belong to this order.",
        )

    def test_amount_and_currency_mismatches_are_rejected(self):
        for payment, expected_detail in (
            (
                {
                    "order_id": self.order.razorpay_order_id,
                    "amount": 1233,
                    "currency": "INR",
                    "status": "captured",
                },
                "Payment amount or currency mismatch.",
            ),
            (
                {
                    "order_id": self.order.razorpay_order_id,
                    "amount": 1234,
                    "currency": "USD",
                    "status": "captured",
                },
                "Payment amount or currency mismatch.",
            ),
        ):
            with self.subTest(payment=payment):
                response, _ = self.verify(client=self.gateway(payment))
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertEqual(response.data["detail"], expected_detail)

    def test_uncaptured_payment_is_rejected(self):
        client = self.gateway(
            {
                "order_id": self.order.razorpay_order_id,
                "amount": 1234,
                "currency": "INR",
                "status": "created",
            }
        )

        response, _ = self.verify(client=client)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Payment has not been captured.")
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 8)

    def test_authorized_payment_is_captured_and_refetched(self):
        client = self.gateway()
        client.payment.fetch.side_effect = [
            {
                "order_id": self.order.razorpay_order_id,
                "amount": 1234,
                "currency": "INR",
                "status": "authorized",
            },
            {
                "order_id": self.order.razorpay_order_id,
                "amount": 1234,
                "currency": "INR",
                "status": "captured",
            },
        ]

        response, _ = self.verify(client=client)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        client.payment.capture.assert_called_once_with("pay_123", 1234)
        self.assertEqual(client.payment.fetch.call_count, 2)

    def test_success_confirms_order_deducts_stock_and_clears_matching_cart(self):
        response, _ = self.verify()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["detail"], "Payment verified successfully.")
        self.order.refresh_from_db()
        self.variant.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.PAID)
        self.assertEqual(self.order.order_status, Order.OrderStatus.CONFIRMED)
        self.assertEqual(self.order.razorpay_payment_id, "pay_123")
        self.assertEqual(self.variant.stock_quantity, 6)
        self.assertFalse(CartItem.objects.filter(cart=self.cart).exists())

    def test_cart_is_preserved_when_it_changed_after_order_creation(self):
        self.cart_item.quantity = 3
        self.cart_item.save(update_fields=["quantity"])

        response, _ = self.verify()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cart_item.refresh_from_db()
        self.assertEqual(self.cart_item.quantity, 3)

    def test_same_payment_is_idempotent_and_different_payment_is_rejected(self):
        first_response, client = self.verify()
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 6)

        repeat_response, _ = self.verify(client=client)
        self.assertEqual(repeat_response.status_code, status.HTTP_200_OK)
        self.assertEqual(repeat_response.data["detail"], "Payment already verified.")
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 6)

        different_response, _ = self.verify(
            client=client,
            razorpay_payment_id="pay_other",
        )
        self.assertEqual(
            different_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            different_response.data["detail"],
            "This order has already been paid.",
        )

    def test_non_pending_order_is_rejected_after_gateway_verification(self):
        self.order.order_status = Order.OrderStatus.CANCELLED
        self.order.save(update_fields=["order_status"])

        response, _ = self.verify()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"],
            "This order is no longer awaiting payment.",
        )
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 8)

    def test_order_with_non_pending_payment_status_is_rejected(self):
        self.order.payment_status = Order.PaymentStatus.FAILED
        self.order.save(update_fields=["payment_status"])

        response, _ = self.verify()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"],
            "This order is no longer awaiting payment.",
        )

    def test_insufficient_stock_rolls_back_and_requests_refund(self):
        unavailable_variant = PhysicalVariant.objects.create(
            book=self.book,
            format="paperback",
            price=Decimal("3.00"),
            stock_quantity=0,
        )
        OrderItem.objects.create(
            order=self.order,
            variant=unavailable_variant,
            book_title=self.book.title,
            book_format=unavailable_variant.format,
            unit_price=unavailable_variant.price,
            quantity=1,
            item_total=Decimal("3.00"),
        )

        response, client = self.verify()

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            response.data["detail"],
            "Payment was received, but stock is unavailable. "
            "A refund has been requested.",
        )
        self.order.refresh_from_db()
        self.variant.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.PENDING)
        self.assertEqual(self.variant.stock_quantity, 8)
        unavailable_variant.refresh_from_db()
        self.assertEqual(unavailable_variant.stock_quantity, 0)
        self.assertTrue(CartItem.objects.filter(pk=self.cart_item.pk).exists())
        client.payment.refund.assert_called_once_with(
            "pay_123",
            {
                "notes": {
                    "reason": "Insufficient stock",
                    "books_blooms_order_id": str(self.order.id),
                }
            },
        )

    def test_refund_gateway_failure_returns_support_fallback(self):
        self.variant.stock_quantity = 1
        self.variant.save(update_fields=["stock_quantity"])
        client = self.gateway()
        client.payment.refund.side_effect = GatewayError("provider unavailable")

        response, _ = self.verify(client=client)

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            response.data["detail"],
            "Payment was received, but stock is unavailable. "
            "Please contact support regarding your refund.",
        )

    def test_create_payment_uses_shared_client_and_amount_helpers(self):
        self.order.razorpay_order_id = ""
        self.order.save(update_fields=["razorpay_order_id"])
        client = Mock()
        client.order.create.return_value = {"id": "rzp_order_new"}
        with patch("orders.views.get_razorpay_client", return_value=client):
            response = self.client.post(
                f"/api/orders/{self.order.id}/create-payment/",
                {},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["amount"], 1234)
        self.assertEqual(response.data["razorpay_order_id"], "rzp_order_new")
        client.order.create.assert_called_once_with(
            data={
                "amount": 1234,
                "currency": "INR",
                "receipt": f"books-blooms-{self.order.id}",
                "notes": {"books_blooms_order_id": str(self.order.id)},
            }
        )
        self.order.refresh_from_db()
        self.assertEqual(self.order.razorpay_order_id, "rzp_order_new")

    def test_create_payment_maps_gateway_failure_to_existing_response(self):
        self.order.razorpay_order_id = ""
        self.order.save(update_fields=["razorpay_order_id"])
        client = Mock()
        client.order.create.side_effect = GatewayError("provider unavailable")
        with patch("orders.views.get_razorpay_client", return_value=client):
            response = self.client.post(
                f"/api/orders/{self.order.id}/create-payment/",
                {},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(
            response.data["detail"],
            "Unable to create Razorpay payment order.",
        )
