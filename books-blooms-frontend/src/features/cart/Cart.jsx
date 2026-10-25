
// Import React Hooks
import { useEffect, useState, useContext } from "react";

// Import the Header and Footer components
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Import API URLs used to communicate with Django
import { BASE_URL, CART_LIST_URL } from "../../constants";

// Import CartContext to share the cart count with the Header
import { CartContext } from "../../context/CartContext";

function Cart() {
    // Stores the cart data received from Django
    const [cart, setCart] = useState(null);

    // Tracks whether the cart is currently loading
    const [loading, setLoading] = useState(true);

    // Stores an error message if an API request fails
    const [error, setError] = useState("");

    // Stores the ID of the cart item currently being updated
    // This helps disable buttons while that item is updating
    const [updatingItemId, setUpdatingItemId] = useState(null);

    // Get refreshCart from CartContext.
    // It updates the shared cart count displayed in the Header.
    const { refreshCart } = useContext(CartContext);


    // Fetch the customer's cart when the Cart page first loads
    useEffect(() => {
        async function fetchCart() {
            // Get the authentication token saved after login
            const token = sessionStorage.getItem("authToken");

            // A customer must be logged in to view their cart
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

                // Convert Django's JSON response into JavaScript data
                const data = await response.json();

                // If the request failed, display an error
                if (!response.ok) {
                    throw new Error(
                        data.detail || "Failed to load your cart."
                    );
                }

                // Update the cart items displayed on this page
                setCart(data);

                // Synchronize the Header count with the loaded cart
                // This assumes data contains the cart's items array
                refreshCart(data);

            } catch (err) {
                // Save the error so it can be displayed to the customer
                setError(err.message);
            } finally {
                // Stop showing the loading message, whether successful or not
                setLoading(false);
            }
        }

        // Run the function when this component first loads
        fetchCart();
    }, []);


    // Update the quantity of an existing cart item
    async function updateQuantity(item, newQuantity) {
        // Do not allow a quantity smaller than 1
        if (newQuantity < 1) return;

        const token = sessionStorage.getItem("authToken");

        // Mark this item as being updated
        setUpdatingItemId(item.id);

        // Clear any previous error message
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

            // Update the cart page with the latest cart data
            setCart(data);

            // Update the shared Header count using the same response
            // No additional API request is needed if data has the full cart
            refreshCart(data);

        } catch (err) {
            // Display the error if the quantity could not be updated
            setError(err.message);
        } finally {
            // Re-enable the item's buttons after the request finishes
            setUpdatingItemId(null);
        }
    }


    // Remove an item from the cart
    async function removeItem(itemId) {
        const token = sessionStorage.getItem("authToken");

        // Mark the selected item as being updated
        setUpdatingItemId(itemId);

        // Clear any previous error message
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

            // Read the response returned by Django
            const data = await response.json();

            // Handle unsuccessful deletion
            if (!response.ok) {
                throw new Error(
                    data.detail || "Could not remove this book."
                );
            }

            // Update the items shown on the Cart page
            setCart(data);

            // Update the Header count using the updated cart response
            // This assumes Django returns the complete updated cart
            refreshCart(data);

        } catch (err) {
            // Display an error if the item could not be removed
            setError(err.message);
        } finally {
            // Re-enable the buttons after the request finishes
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
            {/* Display the website header, including the cart count */}
            <Header />

            <main className="min-h-screen bg-[#FBFAF7] px-4 py-10 sm:px-6">
                <div className="mx-auto max-w-6xl">

                    {/* Page heading */}
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

                                    {/* Left section: list of books in the cart */}
                                    <section className="space-y-4 lg:col-span-2">

                                        {/* Create one card for each cart item */}
                                        {cart.items.map((item) => (
                                            <article
                                                key={item.id}
                                                className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
                                            >
                                                <div className="flex gap-4">

                                                    {/* Book cover */}
                                                    <img
                                                        src={item.cover_url}
                                                        alt={item.book_title}
                                                        className="h-36 w-24 rounded-md object-cover"
                                                    />

                                                    <div className="min-w-0 flex-1">

                                                        {/* Book details */}
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

                                                        {/* Quantity controls and Remove button */}
                                                        <div className="mt-4 flex flex-wrap items-center gap-3">

                                                            <span className="text-sm text-gray-600">
                                                                Quantity
                                                            </span>

                                                            {/* Decrease quantity by one */}
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

                                                            {/* Current quantity */}
                                                            <span className="min-w-5 text-center">
                                                                {item.quantity}
                                                            </span>

                                                            {/* Increase quantity by one */}
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

                                                            {/* Remove this item from the cart */}
                                                            <button
                                                                type="button"
                                                                disabled={updatingItemId === item.id}
                                                                onClick={() => removeItem(item.id)}
                                                                className="ml-auto text-sm text-rose-700 hover:text-rose-900 disabled:opacity-50"
                                                            >
                                                                {/* Show a loading label while this item is updating */}
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

                                    {/* Right section: order totals */}
                                    <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6">

                                        <h2 className="text-xl font-semibold text-gray-800">
                                            Order Summary
                                        </h2>

                                        {/* Display the subtotal calculated above */}
                                        <div className="mt-5 flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal.toFixed(2)}</span>
                                        </div>

                                        {/* Total currently equals subtotal because no other charges are included */}
                                        <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 font-semibold text-gray-800">
                                            <span>Total</span>
                                            <span>₹{subtotal.toFixed(2)}</span>
                                        </div>

                                        {/* Checkout functionality will be added later */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Checkout will be implemented next.
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

            {/* Display the website footer */}
            <Footer />
        </>
    );
}

export default Cart;
