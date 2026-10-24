
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { BASE_URL } from "../../constants";

function Cart() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchCart() {
            const token = sessionStorage.getItem("authToken");

            if (!token) {
                setError("Please log in to view your cart.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}cart/`, {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.detail || "Failed to load your cart."
                    );
                }

                setCart(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchCart();
    }, []);

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#FBFAF7] px-6 py-12">
                <div className="mx-auto max-w-6xl">
                    <h1 className="text-3xl font-semibold text-gray-800">
                        My Shopping Cart
                    </h1>

                    {loading && (
                        <p className="mt-6 text-gray-600">
                            Loading your cart...
                        </p>
                    )}

                    {error && (
                        <p className="mt-6 text-red-600">{error}</p>
                    )}

                    {!loading && !error && cart && (
                        <div className="mt-6">
                            <p className="text-gray-600">
                                Cart ID: {cart.id}
                            </p>

                            {cart.items.length === 0 ? (
                                <p className="mt-4 text-gray-600">
                                    Your cart is empty.
                                </p>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    {cart.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-lg border border-gray-200 bg-white p-4"
                                        >

                                            <div className="flex gap-4">
                                                <img
                                                    src={item.cover_url}
                                                    alt={item.book_title}
                                                    className="h-32 w-24 rounded object-cover"
                                                />

                                                <div>
                                                    <h2 className="text-lg font-semibold text-gray-800">
                                                        {item.book_title}
                                                    </h2>

                                                    <p className="mt-1 text-sm text-gray-600">
                                                        by {item.author_name}
                                                    </p>

                                                    <p className="mt-1 text-sm text-gray-600">
                                                        Format: {item.format}
                                                    </p>

                                                    <p className="mt-2 font-medium text-gray-800">
                                                        Price: ₹{Number(item.price).toFixed(2)}
                                                    </p>

                                                    <p className="mt-1 text-sm text-gray-600">
                                                        Quantity: {item.quantity}
                                                    </p>
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}

export default Cart;
