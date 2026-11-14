# Razorpay Payment Verification Refactor

## Goal

Improve the modularity and testability of `RazorpayVerifyPaymentView` without
changing the existing payment-verification endpoint or its observable behavior.
The implementation keeps the public endpoint unchanged:
`POST /api/orders/<order_id>/verify-payment/`.

## Refactored boundaries

`RazorpayVerifyPaymentView` orchestrates:

1. Validates the checkout callback fields and checks order ownership, payment
   method, and Razorpay order ID.
2. Calls `orders/payments.py` to verify provider data and capture authorized
   payments.
3. Calls `orders/services.py` to finalize payment and reserve inventory in one
   database transaction.
4. Requests a refund outside that transaction if inventory cannot be reserved,
   then maps known results to the existing HTTP responses.

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

### Order payment finalization (`orders/services.py`)

`finalize_razorpay_order()` owns one atomic transaction that:

- Locks the customer-owned order and rechecks its state.
- Returns the existing idempotent result when the same payment was already
  applied, and rejects a different payment or an order no longer awaiting
  payment.
- Deducts inventory conditionally and raises a specific insufficient-stock
  exception if any item cannot be reserved.
- Saves the payment ID and paid/confirmed statuses.
- Clears the cart only when its aggregated variant quantities still match the
  order quantities.

The view retains the initial ownership and provider-order checks before calling
Razorpay. The locked database recheck remains after provider verification as a
concurrency safeguard.

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

Tests exercise the extracted boundaries and endpoint behavior:

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

Use mocked Razorpay client methods for unit/API tests; no test should require a
live provider request.
