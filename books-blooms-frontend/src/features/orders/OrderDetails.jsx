import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { ORDERS_URL } from "../../constants";

function OrderDetails() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                    headers: { Authorization: `Token ${token}` },
                });
                const data = await response.json();
                if (!response.ok) {
                    // Backend returns 404 for missing or other users' orders
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

                    {loading && (
                        <p className="mt-6 text-gray-600">Loading order...</p>
                    )}

                    {error && (
                        <p role="alert" className="mt-6 text-red-600">{error}</p>
                    )}

                    {!loading && !error && order && (
                        <>
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

                                <dl className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">Subtotal</dt>
                                        <dd className="font-medium text-gray-800">
                                            ₹{Number(order.subtotal).toFixed(2)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">Shipping</dt>
                                        <dd className="font-medium text-gray-800">
                                            {Number(order.shipping_charge) === 0
                                                ? "Free"
                                                : `₹${Number(order.shipping_charge).toFixed(2)}`}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
                                        <dt className="font-semibold text-gray-800">Total</dt>
                                        <dd className="font-semibold text-gray-800">
                                            ₹{Number(order.total_amount).toFixed(2)}
                                        </dd>
                                    </div>
                                </dl>
                            </section>

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