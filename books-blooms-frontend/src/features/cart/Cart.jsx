
import { useEffect, useState, useContext } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { BASE_URL, CART_LIST_URL } from "../../constants";
import { CartContext } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

function Cart() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingItemId, setUpdatingItemId] = useState(null);
    const { refreshCart } = useContext(CartContext);
    const navigate = useNavigate()


    // Fetch the customer's cart when the Cart page first loads
    useEffect(() => {
        async function fetchCart() {
            const token = sessionStorage.getItem("authToken");
            if (!token) {
                setError("Please log in to view your cart.");
                setLoading(false);
                return;
            }

            try {
                // Send a GET request to Django to retrieve the cart
                const response = await fetch(CART_LIST_URL, {
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
                refreshCart(data);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchCart();
    }, []);


    // Update the quantity of an existing cart item
    async function updateQuantity(item, newQuantity) {
        if (newQuantity < 1) return;

        const token = sessionStorage.getItem("authToken");
        setUpdatingItemId(item.id);
        setError("");

        try {
            // Send a PATCH request to update the item's quantity
            const response = await fetch(
                `${BASE_URL}cart/items/${item.id}/`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Token ${token}`,
                        "Content-Type": "application/json",
                    },

                    // Send the new quantity to Django
                    body: JSON.stringify({
                        quantity: newQuantity,
                    }),
                }
            );

            // Read Django's response
            const data = await response.json();

            // Handle unsuccessful requests
            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.quantity?.[0] ||
                    data.detail ||
                    "Could not update quantity."
                );
            }
            setCart(data);
            refreshCart(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingItemId(null);
        }
    }


    // Remove an item from the cart
    async function removeItem(itemId) {
        const token = sessionStorage.getItem("authToken");
        setUpdatingItemId(itemId);
        setError("");

        try {
            // Send a DELETE request to Django to remove this item
            const response = await fetch(
                `${BASE_URL}cart/items/${itemId}/delete/`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(
                    data.detail || "Could not remove this book."
                );
            }
            setCart(data);

            // Update the Header count using the updated cart response
            // This assumes Django returns the complete updated cart
            refreshCart(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingItemId(null);
        }
    }


    // Calculate the subtotal:
    // For each item, multiply its price by its quantity, then add the results
    // If the cart or items array is missing, use 0 as the subtotal
    const subtotal = cart?.items?.reduce(
        (total, item) =>
            total + Number(item.price) * Number(item.quantity),
        0
    ) ?? 0;


    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#FBFAF7] px-4 py-10 sm:px-6">
                <div className="mx-auto max-w-6xl">

                  
                    <h1 className="text-3xl font-semibold text-gray-800">
                        My Shopping Cart
                    </h1>

                    {/* Show a message while loading cart data */}
                    {loading && (
                        <p className="mt-6 text-gray-600">
                            Loading your cart...
                        </p>
                    )}

                    {/* Display an error if loading or updating fails */}
                    {error && (
                        <p role="alert" className="mt-6 text-red-600">
                            {error}
                        </p>
                    )}

                    {/* Show the cart after loading succeeds */}
                    {!loading && !error && cart && (
                        <>
                            {/* Display an empty-cart message when there are no items */}
                            {!cart.items || cart.items.length === 0 ? (
                                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-10 text-center">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Your cart is empty
                                    </h2>

                                    <p className="mt-2 text-gray-600">
                                        Find a book you love and add it to your cart.
                                    </p>
                                </div>
                            ) : (
                                // Display cart items and order summary
                                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">

                                    <section className="space-y-4 lg:col-span-2">
                                        {cart.items.map((item) => (
                                            <article
                                                key={item.id}
                                                className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
                                            >
                                                <div className="flex gap-4">

                                                    <img
                                                        src={item.cover_url}
                                                        alt={item.book_title}
                                                        className="h-36 w-24 rounded-md object-cover"
                                                    />

                                                    <div className="min-w-0 flex-1">

                                                        <h2 className="font-semibold text-gray-800">
                                                            {item.book_title}
                                                        </h2>

                                                        <p className="mt-1 text-sm text-gray-500">
                                                            by {item.author_name}
                                                        </p>

                                                        <p className="mt-1 text-sm text-gray-500">
                                                            Format: {item.format}
                                                        </p>

                                                        <p className="mt-2 font-medium text-gray-800">
                                                            ₹{Number(item.price).toFixed(2)}
                                                        </p>

                                                        <div className="mt-4 flex flex-wrap items-center gap-3">

                                                            <span className="text-sm text-gray-600">
                                                                Quantity
                                                            </span>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    updatingItemId === item.id ||
                                                                    Number(item.quantity) <= 1
                                                                }
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item,
                                                                        Number(item.quantity) - 1
                                                                    )
                                                                }
                                                                className="h-8 w-8 rounded border border-gray-300 disabled:opacity-40"
                                                                aria-label="Decrease quantity"
                                                            >
                                                                −
                                                            </button>
                                                            <span className="min-w-5 text-center">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                disabled={updatingItemId === item.id}
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item,
                                                                        Number(item.quantity) + 1
                                                                    )
                                                                }
                                                                className="h-8 w-8 rounded border border-gray-300 disabled:opacity-40"
                                                                aria-label="Increase quantity"
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={updatingItemId === item.id}
                                                                onClick={() => removeItem(item.id)}
                                                                className="ml-auto text-sm text-rose-700 hover:text-rose-900 disabled:opacity-50"
                                                            >
                                                                {updatingItemId === item.id
                                                                    ? "Updating..."
                                                                    : "Remove"}
                                                            </button>

                                                        </div>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </section>
                                    <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6">

                                        <h2 className="text-xl font-semibold text-gray-800">
                                            Order Summary
                                        </h2>
                                        <div className="mt-5 flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal.toFixed(2)}</span>
                                        </div>

                                        {/* Total currently equals subtotal because no other charges are included */}
                                        <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 font-semibold text-gray-800">
                                            <span>Total</span>
                                            <span>₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {navigate('/checkout')
                                            }}
                                            
                                            className="mt-6 w-full rounded-lg bg-rose-600 px-5 py-3 font-medium text-white hover:bg-rose-700"
                                        >
                                            Proceed to Checkout
                                        </button>

                                    </aside>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}

export default Cart;
