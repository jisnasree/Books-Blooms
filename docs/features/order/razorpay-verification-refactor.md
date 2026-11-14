# Razorpay Payment Verification Refactor

## Goal

Improve the modularity and testability of `RazorpayVerifyPaymentView` without
changing the existing payment-verification endpoint or its observable behavior.
The implementation keeps the public endpoint unchanged:
`POST /api/orders/<order_id>/verify-payment/`.

## Order service boundaries

Order-specific state changes live in `orders/services.py`. The HTTP views are
responsible for validating request serializers and translating service outcomes
to the existing response bodies and status codes.

- `create_order_from_cart()` validates the address, cart, coupon, and inventory;
  calculates totals; creates the order and items; and handles COD stock/cart
  updates. It owns the transaction so order writes and stock reservations roll
  back together.
- `cancel_order()` locks and rechecks the order, restores inventory when it was
  previously deducted, and records the cancellation within one transaction.
- `finalize_razorpay_order()` handles paid-order idempotency, conditional stock
  reservation, status changes, and matching-cart clearing transactionally.
- `RazorpayVerifyPaymentView` retains ownership/provider-order prechecks, calls
  `orders/payments.py` to verify and capture the payment, then delegates order
  finalization to the service.
- The view requests refunds after the finalization transaction rolls back,
  keeping that external side effect outside the database transaction.

### Payment gateway helpers (`orders/payments.py`)

- `get_razorpay_client()` constructs the client with configured credentials
  when called; no provider client is created at import time.
- `amount_in_paise()` centralizes rupee-to-paise conversion for both payment
  creation and verification.
- `verify_razorpay_payment()` validates signature, provider order association,
  amount, currency, capture, and the captured-status re-fetch.
- Provider API errors and payment validation failures use distinct exceptions,
  allowing the view to map expected errors without broad catches.
- Payment creation and refunds use the same provider exception boundary.

### Refund boundary

If a captured payment cannot reserve stock, the view requests a refund after
the database transaction rolls back and returns the existing conflict response.
Refund-request failure is logged and returns the existing support fallback
message.

## Behavior to preserve

- Authentication, per-user ownership, and Razorpay order checks.
- Signature, provider order ID, paise amount, INR currency, and captured-status
  validation; authorized payments are captured before finalization.
- Idempotent success for the same payment ID and rejection of a different ID
  for an already-paid order.
- Pending-order validation and atomic, conditional inventory deduction.
- Cart clearing only when current aggregated quantities still match the order.
- Refund attempt, conflict response, and support fallback when stock is
  unavailable after capture.
- Existing response status codes, payload shapes, and endpoint path.

## Focused test coverage (`orders/tests.py`)

Tests exercise the order service boundaries through the API and mocked provider:

- Missing callback fields, wrong owner/order/payment method, and mismatched
  stored Razorpay order ID.
- Invalid signature, provider payment for another order, amount/currency
  mismatch, and payment that remains uncaptured.
- Authorized payment capture followed by a captured-status re-fetch.
- Successful confirmation, inventory deduction, and matching-cart clearing.
- Cart changes after order creation leave the current cart intact.
- Repeated verification with the same payment ID is idempotent; another payment
  ID or a non-pending order is rejected.
- Insufficient stock rolls back database changes, requests a refund, and
  returns the conflict response; refund failure follows the support fallback.
- Create-payment and verify-payment use the same client factory and amount
  conversion.
- COD checkout atomically creates the order/items, deducts inventory, and clears
  the cart; Razorpay checkout leaves inventory and cart unchanged.
- Cancellation restores aggregated inventory and commits the cancelled status.

Use mocked Razorpay client methods for unit/API tests; no test should require a
live provider request.
