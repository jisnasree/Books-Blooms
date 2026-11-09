
import { useEffect, useState, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import { ORDERS_URL } from "../../constants";
import { CartContext } from "../../context/CartContext";


// Load Razorpay Checkout script
function loadRazorpayScript() {
    return new Promise((resolve) => {

        // Check whether Razorpay is already loaded
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");

        script.src = "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);

        document.body.appendChild(script);
    });
}



function OrderDetails() {

    const { id } = useParams();

    const navigate = useNavigate();

    const { refreshCart } = useContext(CartContext);


    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    // Payment states
    const [paying, setPaying] = useState(false);

    const [paymentError, setPaymentError] = useState("");


    // Cancellation states
    const [cancellationReason, setCancellationReason] = useState("");

    const [cancelling, setCancelling] = useState(false);

    const [cancellationError, setCancellationError] = useState("");

    const [cancellationMessage, setCancellationMessage] = useState("");


    // Fetch order details
    useEffect(() => {

        async function fetchOrder() {

            const token = sessionStorage.getItem("authToken");

            if (!token) {
                setError("Please log in to view this order.");
                setLoading(false);
                return;
            }

            try {

                const response = await fetch(`${ORDERS_URL}${id}/`, {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {

                    throw new Error(
                        response.status === 404
                            ? "Order not found."
                            : data.detail || "Failed to load this order."
                    );

                }

                setOrder(data);

            } catch (err) {

                setError(err.message);

            } finally {

                setLoading(false);

            }
        }

        fetchOrder();

    }, [id]);


    // Retry payment for an existing pending order
    async function handlePayNow() {

        try {

            setPaymentError("");

            setPaying(true);

            const token = sessionStorage.getItem("authToken");

            if (!token) {
                throw new Error("Please log in to continue.");
            }

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            };


            // 1. Load Razorpay Checkout
            const scriptLoaded = await loadRazorpayScript();

            if (!scriptLoaded) {

                throw new Error(
                    "Unable to load Razorpay. Please try again."
                );

            }


            // 2. Request payment details for the existing order
            const paymentResponse = await fetch(
                `${ORDERS_URL}${id}/create-payment/`,
                {
                    method: "POST",
                    headers,
                }
            );

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok) {

                throw new Error(
                    paymentData.detail ||
                    "Unable to initialize payment."
                );

            }


            // Allow customer to interact with Razorpay
            setPaying(false);


            // 3. Configure Razorpay Checkout
            const options = {

                key: paymentData.key_id,

                amount: paymentData.amount,

                currency: paymentData.currency,

                name: "Books & Blooms",

                description: `Order #${order.id}`,

                // Reuse the existing Razorpay order ID
                order_id: paymentData.razorpay_order_id,


                // 4. Handle successful payment
                handler: async function (razorpayResponse) {

                    try {

                        setPaying(true);

                        setPaymentError("");


                        // Verify payment with Django backend
                        const verifyResponse = await fetch(
                            `${ORDERS_URL}${id}/verify-payment/`,
                            {
                                method: "POST",

                                headers,

                                body: JSON.stringify({

                                    razorpay_order_id:
                                        razorpayResponse.razorpay_order_id,

                                    razorpay_payment_id:
                                        razorpayResponse.razorpay_payment_id,

                                    razorpay_signature:
                                        razorpayResponse.razorpay_signature,

                                }),
                            }
                        );

                        const verifyData = await verifyResponse.json();

                        if (!verifyResponse.ok) {

                            throw new Error(
                                verifyData.detail ||
                                "Payment verification failed. Please contact support if money was deducted."
                            );

                        }


                        // 5. Payment verified successfully
                        await refreshCart();


                        // Navigate to Order Success page
                        navigate("/order-success", {
                            state: {
                                order: verifyData.order,
                            },
                        });

                    } catch (err) {

                        setPaymentError(err.message);

                    } finally {

                        setPaying(false);

                    }

                },


                // Handle payment window dismissal
                modal: {

                    ondismiss: function () {
                        setPaying(false);
                        navigate("/order-failure", {
                            state: {
                                order: order,
                                errorMessage: "Payment cancelled. You closed the payment window before completing the payment.",
                            },
                        });
                    },

                },


                theme: {
                    color: "#BE123C",
                },

            };


            // 6. Open Razorpay Checkout
            const razorpay = new window.Razorpay(options);

            // Handle payment failure — send user to the failure page
            razorpay.on("payment.failed", function (response) {
                setPaying(false);

                const failureMessage =
                    response.error?.description &&
                        response.error.description !== "Payment failed"
                        ? response.error.description
                        : "Your payment could not be completed. Please try again.";

                navigate("/order-failure", {
                    state: {
                        order: order,
                        errorMessage: failureMessage,
                        paymentId: response.error?.metadata?.payment_id,
                    },
                });
            });

            razorpay.open();

        } catch (err) {

            setPaymentError(err.message);

            setPaying(false);

        }

    }


    // Cancel order
    async function handleCancelOrder() {

        const token = sessionStorage.getItem("authToken");

        setCancelling(true);

        setCancellationError("");

        setCancellationMessage("");

        try {

            const response = await fetch(`${ORDERS_URL}${id}/cancel/`, {

                method: "POST",

                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    reason: cancellationReason,
                }),

            });

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.detail || "Failed to cancel the order."
                );

            }


            // Update order status immediately
            setOrder((previousOrder) => ({
                ...previousOrder,
                order_status: "CANCELLED",
            }));

            setCancellationMessage(data.detail);

            setCancellationReason("");

        } catch (err) {

            setCancellationError(err.message);

        } finally {

            setCancelling(false);

        }

    }


    // Check whether payment can be retried
    const canRetryPayment =
        order?.payment_method === "RAZORPAY" &&
        order?.payment_status === "PENDING" &&
        order?.order_status === "PENDING";


    return (

        <>

            <Header />


            <main className="min-h-screen bg-[#FBFAF7] px-4 py-10 sm:px-6">

                <div className="mx-auto max-w-4xl">


                    <Link
                        to="/orders"
                        className="text-sm font-semibold text-rose-700"
                    >
                        ← Back to My Orders
                    </Link>


                    {/* Loading */}
                    {loading && (

                        <p className="mt-6 text-gray-600">
                            Loading order...
                        </p>

                    )}


                    {/* Error */}
                    {error && (

                        <p role="alert" className="mt-6 text-red-600">
                            {error}
                        </p>

                    )}


                    {!loading && !error && order && (

                        <>


                            {/* Order heading and status */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">

                                <div>

                                    <h1 className="text-3xl font-semibold text-gray-800">
                                        Order #{order.id}
                                    </h1>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Placed on{" "}
                                        {new Date(order.created_at).toLocaleString()}
                                    </p>

                                </div>


                                <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                                    {order.order_status}
                                </span>

                            </div>



                            {/* Cancellation success message */}
                            {cancellationMessage && (

                                <p
                                    role="status"
                                    className="mt-4 text-sm text-green-700"
                                >
                                    {cancellationMessage}
                                </p>

                            )}



                            {/* Ordered items */}
                            <section className="mt-8 space-y-4">

                                {order.items.map((item) => (

                                    <article
                                        key={item.id}
                                        className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
                                    >

                                        {item.cover_url && (

                                            <img
                                                src={item.cover_url}
                                                alt={item.book_title}
                                                className="h-36 w-24 rounded-md object-cover"
                                            />

                                        )}


                                        <div className="min-w-0 flex-1">

                                            <h2 className="font-semibold text-gray-800">
                                                {item.book_title}
                                            </h2>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Format: {item.book_format}
                                            </p>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Quantity: {item.quantity}
                                            </p>

                                            <p className="mt-2 font-medium text-gray-800">
                                                ₹{Number(item.item_total).toFixed(2)}
                                            </p>

                                        </div>

                                    </article>

                                ))}

                            </section>



                            {/* Delivery address snapshot */}
                            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">

                                <h2 className="font-semibold text-gray-800">
                                    Delivery address
                                </h2>

                                <p className="mt-2 text-sm text-gray-600">

                                    {order.shipping_full_name}

                                    <br />

                                    {order.shipping_address_line_1}

                                    {order.shipping_address_line_2 && (
                                        <>, {order.shipping_address_line_2}</>
                                    )}

                                    <br />

                                    {order.shipping_city}, {order.shipping_state}{" "}
                                    {order.shipping_postal_code}

                                    <br />

                                    {order.shipping_country}

                                    <br />

                                    Phone: {order.shipping_phone_number}

                                </p>

                            </section>



                            {/* Payment + totals */}
                            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">

                                <h2 className="font-semibold text-gray-800">
                                    Payment
                                </h2>


                                <p className="mt-2 text-sm text-gray-600">
                                    Method: {order.payment_method} · Status:{" "}
                                    {order.payment_status}
                                </p>


                                {/* Payment error */}
                                {paymentError && (

                                    <p
                                        role="alert"
                                        className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                                    >
                                        {paymentError}
                                    </p>

                                )}


                                {/* Pay Now button */}
                                {canRetryPayment && (

                                    <div className="mt-4">

                                        <p className="text-sm text-gray-600">
                                            Your payment is still pending. You can continue payment using the button below.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={handlePayNow}
                                            disabled={paying}
                                            className="mt-3 rounded-lg bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                                        >

                                            {paying
                                                ? "Processing..."
                                                : "Pay Now"}

                                        </button>

                                    </div>

                                )}



                                {/* Order totals */}
                                <dl className="mt-6 space-y-2 text-sm">


                                    <div className="flex justify-between">

                                        <dt className="text-gray-600">
                                            Subtotal
                                        </dt>

                                        <dd className="font-medium text-gray-800">
                                            ₹{Number(order.subtotal).toFixed(2)}
                                        </dd>

                                    </div>



                                    <div className="flex justify-between">

                                        <dt className="text-gray-600">
                                            Shipping
                                        </dt>

                                        <dd className="font-medium text-gray-800">

                                            {Number(order.shipping_charge) === 0
                                                ? "Free"
                                                : `₹${Number(order.shipping_charge).toFixed(2)}`}

                                        </dd>

                                    </div>



                                    <div className="flex justify-between border-t border-gray-200 pt-2 text-base">

                                        <dt className="font-semibold text-gray-800">
                                            Total
                                        </dt>

                                        <dd className="font-semibold text-gray-800">
                                            ₹{Number(order.total_amount).toFixed(2)}
                                        </dd>

                                    </div>


                                </dl>

                            </section>



                            {/* Cancel Order */}
                            {["PENDING", "CONFIRMED", "PROCESSING"].includes(
                                order.order_status
                            ) && (

                                    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">

                                        <h2 className="font-semibold text-gray-800">
                                            Cancel Order
                                        </h2>

                                        <p className="mt-2 text-sm text-gray-600">
                                            If you no longer need this order, you can cancel it.
                                        </p>


                                        <label
                                            htmlFor="cancellationReason"
                                            className="mt-4 block text-sm font-medium text-gray-700"
                                        >
                                            Reason for cancellation (optional)
                                        </label>


                                        <textarea
                                            id="cancellationReason"
                                            value={cancellationReason}
                                            onChange={(e) =>
                                                setCancellationReason(e.target.value)
                                            }
                                            placeholder="Tell us why you want to cancel..."
                                            rows={3}
                                            className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-rose-500 focus:outline-none"
                                        />


                                        {cancellationError && (

                                            <p
                                                role="alert"
                                                className="mt-3 text-sm text-red-600"
                                            >
                                                {cancellationError}
                                            </p>

                                        )}


                                        <button
                                            type="button"
                                            onClick={handleCancelOrder}
                                            disabled={cancelling}
                                            className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >

                                            {cancelling
                                                ? "Cancelling..."
                                                : "Cancel Order"}

                                        </button>

                                    </section>

                                )}



                            {/* Continue shopping */}
                            <Link
                                to="/books"
                                className="mt-8 inline-block rounded-lg bg-rose-700 px-5 py-2 text-sm font-semibold text-white"
                            >
                                Continue shopping
                            </Link>


                        </>

                    )}

                </div>

            </main>


            <Footer />

        </>

    );

}


export default OrderDetails;
