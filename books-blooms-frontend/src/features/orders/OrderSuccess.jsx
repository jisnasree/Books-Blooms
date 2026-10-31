
import { Link, useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

function OrderSuccess() {
    const { state } = useLocation();

    // Order details passed from the checkout page
    const order = state?.order;
    const customerEmail = state?.customerEmail || "";

    // Format amounts in Indian Rupees
    const formatPrice = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(Number(amount || 0));

    // Format order date
    const orderDate = order?.created_at
        ? new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : "Just now";

    // Support either an items or order_items response field
    const orderItems = order?.items || order?.order_items || [];

    // Support either nested or flat shipping address fields
    const address = order?.shipping_address || order || {};

    const shippingName =
        address.full_name || address.shipping_full_name || "";

    const addressLine1 =
        address.address_line_1 || address.shipping_address_line_1 || "";

    const addressLine2 =
        address.address_line_2 || address.shipping_address_line_2 || "";

    const city = address.city || address.shipping_city || "";
    const stateName = address.state || address.shipping_state || "";
    const postalCode =
        address.postal_code || address.shipping_postal_code || "";
    const country = address.country || address.shipping_country || "";

    const shippingAddress = [
        addressLine1,
        addressLine2,
        city,
        stateName,
        postalCode,
        country,
    ]
        .filter(Boolean)
        .join(", ");

    // If no order information was passed, show a helpful message
    if (!order) {
        return (
            <>
                <Header />

                <main className="min-h-screen bg-[#FBFAF7] px-4 py-20">
                    <div className="mx-auto max-w-2xl rounded-xl border bg-white p-8 text-center">
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Order details unavailable
                        </h1>

                        <p className="mt-3 text-gray-600">
                            Please visit your orders page to view your order.
                        </p>

                        <Link
                            to="/orders"
                            className="mt-6 inline-block rounded-lg bg-rose-700 px-6 py-3 font-medium text-white hover:bg-rose-800"
                        >
                            View My Orders
                        </Link>
                    </div>
                </main>

                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#FBFAF7] px-4 py-10">
                <div className="mx-auto max-w-5xl">

                    {/* Success heading */}
                    <div className="mb-10">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-700 text-3xl font-bold text-white">
                                ✓
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 sm:text-5xl">
                                Order completed!
                            </h1>
                        </div>

                        <p className="mt-4 text-lg text-gray-500">
                            Your order has been placed successfully.
                        </p>
                    </div>

                    {/* Confirmation email */}
                    {customerEmail && (
                        <div className="mb-8 rounded-xl border border-[#d5e5df] bg-[#e6f2ed] p-6">
                            <p className="text-gray-800">
                                An order confirmation email will be sent to
                                your registered email address:
                            </p>

                            <p className="mt-3 font-semibold text-gray-900">
                                {customerEmail}
                            </p>
                        </div>
                    )}

                    {/* Order details card */}
                    <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-10">

                        <h2 className="mb-8 text-2xl font-bold text-gray-900">
                            Order details
                        </h2>

                        {/* Order number and date */}
                        <div className="mb-8 grid grid-cols-1 gap-4 border-b border-gray-200 pb-8 sm:grid-cols-2">

                            <div>
                                <p className="text-gray-500">
                                    Order number
                                </p>

                                <p className="mt-2 text-xl font-semibold text-gray-900">
                                    {order.order_number ||
                                        `#BB-${order.id}`}
                                </p>
                            </div>

                            <div className="sm:text-right">
                                <p className="text-gray-500">
                                    Placed on
                                </p>

                                <p className="mt-2 font-medium text-gray-900">
                                    {orderDate}
                                </p>
                            </div>
                        </div>

                        {/* Ordered items */}
                        <div className="border-b border-gray-200 pb-6">

                            <h3 className="mb-5 text-lg font-semibold text-gray-900">
                                Items
                            </h3>

                            <div className="space-y-5">

                                {orderItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between gap-4"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {item.book_title || item.title}
                                            </p>

                                            <p className="mt-1 text-sm text-gray-500">
                                                {item.book_format || item.format}
                                                {" · "}
                                                Qty {item.quantity}
                                            </p>
                                        </div>

                                        <p className="whitespace-nowrap font-semibold text-gray-900">
                                            {formatPrice(
                                                item.item_total ??
                                                Number(item.unit_price || item.price || 0) *
                                                Number(item.quantity || 1)
                                            )}
                                        </p>
                                    </div>
                                ))}

                            </div>
                        </div>

                        {/* Shipping address */}
                        <div className="border-b border-gray-200 py-6">

                            <h3 className="mb-3 font-semibold text-gray-900">
                                Shipping to
                            </h3>

                            <p className="font-medium text-gray-800">
                                {shippingName}
                            </p>

                            <p className="mt-1 text-gray-500">
                                {shippingAddress || "Shipping address unavailable"}
                            </p>
                        </div>

                        {/* Payment and price summary */}
                        <div className="grid grid-cols-1 gap-8 border-b border-gray-200 py-6 sm:grid-cols-2">

                            <div>
                                <h3 className="mb-3 font-semibold text-gray-900">
                                    Payment information
                                </h3>

                                <p className="text-sm text-gray-500">
                                    Payment method
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {order.payment_method === "COD"
                                        ? "Cash on Delivery"
                                        : order.payment_method === "RAZORPAY"
                                        ? "Razorpay"
                                        : order.payment_method || "Not available"}
                                </p>

                                <p className="mt-4 text-sm text-gray-500">
                                    Payment status
                                </p>

                                <p className="mt-1 font-medium text-gray-800">
                                    {order.payment_status || "Pending"}
                                </p>
                            </div>

                            <div className="space-y-3">

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">
                                        Subtotal
                                    </span>

                                    <span className="font-medium text-gray-900">
                                        {formatPrice(order.subtotal)}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">
                                        Delivery Charge
                                    </span>

                                    <span className="font-medium text-gray-900">
                                        {Number(order.shipping_charge || 0) === 0
                                            ? "Free (₹0)"
                                            : formatPrice(order.shipping_charge)}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">
                                        Tax
                                    </span>

                                    <span className="font-medium text-gray-900">
                                        {formatPrice(order.tax_amount)}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">
                                        Discount
                                    </span>

                                    <span className="font-medium text-gray-900">
                                        {formatPrice(order.discount_amount)}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4 border-t border-gray-200 pt-4 text-lg font-bold">
                                    <span className="text-gray-900">
                                        Total
                                    </span>

                                    <span className="text-gray-900">
                                        {formatPrice(order.total_amount)}
                                    </span>
                                </div>

                            </div>
                        </div>

                        {/* Order status */}
                        <div className="pt-6">
                            <p className="text-sm text-gray-500">
                                Order status
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {order.order_status || "Pending"}
                            </p>
                        </div>

                    </section>

                    {/* Continue shopping */}
                    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">

                        <Link
                            to="/shop"
                            className="w-full rounded-lg bg-rose-700 px-8 py-3 text-center font-medium text-white transition hover:bg-rose-800 sm:w-auto"
                        >
                            Continue Shopping
                        </Link>

                        <Link
                            to="/orders"
                            className="w-full rounded-lg border border-gray-300 px-8 py-3 text-center font-medium text-gray-700 transition hover:bg-gray-100 sm:w-auto"
                        >
                            View My Orders
                        </Link>

                    </div>

                </div>
            </main>

            <Footer />
        </>
    );
}

export default OrderSuccess;
