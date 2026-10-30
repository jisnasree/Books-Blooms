import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { ORDERS_URL } from "../../constants";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchOrders() {
            const token = sessionStorage.getItem("authToken");
            if (!token) {
                setError("Please log in to view your orders.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(ORDERS_URL, {
                    headers: { Authorization: `Token ${token}` },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || "Failed to load your orders.");
                }
                // DRF returns a bare array when pagination is off
                setOrders(Array.isArray(data) ? data : data.results || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, []);

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#FBFAF7] px-4 py-10 sm:px-6">
                <div className="mx-auto max-w-4xl">
                    <h1 className="text-3xl font-semibold text-gray-800">
                        My Orders
                    </h1>

                    {loading && (
                        <p className="mt-6 text-gray-600">Loading your orders...</p>
                    )}

                    {error && (
                        <p role="alert" className="mt-6 text-red-600">{error}</p>
                    )}

                    {!loading && !error && orders.length === 0 && (
                        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-10 text-center">
                            <h2 className="text-xl font-semibold text-gray-800">
                                No orders yet
                            </h2>
                            <p className="mt-2 text-gray-600">
                                When you place an order it will appear here.
                            </p>
                            <Link
                                to="/books"
                                className="mt-5 inline-block rounded-lg bg-rose-700 px-5 py-2 text-sm font-semibold text-white"
                            >
                                Continue shopping
                            </Link>
                        </div>
                    )}

                    {!loading && !error && orders.length > 0 && (
                        <section className="mt-8 space-y-4">
                            {orders.map((order) => {
                                const firstItem = order.items?.[0];
                                const itemCount = order.items?.reduce(
                                    (total, item) => total + item.quantity, 0
                                ) ?? 0;

                                return (
                                    <article
                                        key={order.id}
                                        className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    Order #{order.id}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Placed on{" "}
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                                <p className="mt-2 font-medium text-gray-800">
                                                    {firstItem?.book_title}
                                                    {itemCount > 1 &&
                                                        ` and ${itemCount - 1} more item${itemCount - 1 > 1 ? "s" : ""}`}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                                                    {order.order_status}
                                                </span>
                                                <p className="mt-2 font-semibold text-gray-800">
                                                    ₹{Number(order.total_amount).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            to={`/orders/${order.id}`}
                                            className="mt-4 inline-block text-sm font-semibold text-rose-700"
                                        >
                                            View details →
                                        </Link>
                                    </article>
                                );
                            })}
                        </section>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}

export default Orders;