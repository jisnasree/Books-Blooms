
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CART_LIST_URL, ADDRESS_BASE_URL } from "../constants";

function Checkout() {
    const [cart, setCart] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchCheckoutData() {
            try {
                const token = sessionStorage.getItem("authToken");

                if (!token) {
                    throw new Error("Please log in to continue to checkout.");
                }

                const headers = {
                    Authorization: `Token ${token}`,
                };

                // Fetch the customer's cart
                const cartResponse = await fetch(
                    CART_LIST_URL,
                    { headers }
                );

                if (!cartResponse.ok) {
                    throw new Error("Unable to load your cart.");
                }

                const cartData = await cartResponse.json();
                setCart(cartData);

                // Fetch the customer's saved addresses
                const addressResponse = await fetch(
                    ADDRESS_BASE_URL,
                    { headers }
                );

                if (!addressResponse.ok) {
                    throw new Error("Unable to load your addresses.");
                }

                const addressData = await addressResponse.json();

                const savedAddresses = Array.isArray(addressData)
                    ? addressData
                    : addressData.results || [];

                setAddresses(savedAddresses);

                // Select the default address initially
                const defaultAddress = savedAddresses.find(
                    (address) => address.is_default
                );

                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                }
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        fetchCheckoutData();
    }, []);

    // Calculate the total price of all cart items
    const orderTotal = cart?.items?.reduce((total, item) => {
        return total + Number(item.price) * Number(item.quantity);
    }, 0) || 0;

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#FBFAF7] px-4 py-10">
                <div className="mx-auto max-w-5xl">

                    <h1 className="mb-2 text-3xl font-semibold text-gray-800">
                        Checkout
                    </h1>

                    <p className="mb-8 text-gray-600">
                        Review your order and choose a delivery address.
                    </p>

                    {loading && (
                        <p className="py-10 text-center text-gray-600">
                            Loading checkout...
                        </p>
                    )}

                    {error && !loading && (
                        <div className="rounded-lg bg-red-50 p-4 text-red-700">
                            {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="grid gap-8 lg:grid-cols-3">

                            {/* Delivery address section */}
                            <section className="space-y-4 lg:col-span-2">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    1. Delivery Address
                                </h2>

                                {addresses.length === 0 ? (
                                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                                        <p className="mb-4 text-gray-600">
                                            You haven't saved an address yet.
                                        </p>

                                        <Link
                                            to="/account/addresses"
                                            className="font-medium text-rose-700 hover:text-rose-800"
                                        >
                                            Add an address
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {addresses.map((address) => (
                                            <label
                                                key={address.id}
                                                className={`block cursor-pointer rounded-xl border bg-white p-5 transition ${
                                                    selectedAddressId === address.id
                                                        ? "border-rose-700 ring-1 ring-rose-700"
                                                        : "border-gray-200 hover:border-rose-300"
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="radio"
                                                        name="deliveryAddress"
                                                        value={address.id}
                                                        checked={
                                                            selectedAddressId === address.id
                                                        }
                                                        onChange={() =>
                                                            setSelectedAddressId(address.id)
                                                        }
                                                        className="mt-1 h-4 w-4 accent-rose-700"
                                                    />

                                                    <div className="flex-1">
                                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                                            <span className="font-semibold text-gray-800">
                                                                {address.label}
                                                            </span>

                                                            {address.is_default && (
                                                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="font-medium text-gray-800">
                                                            {address.full_name}
                                                        </p>

                                                        <p className="mt-1 text-sm text-gray-600">
                                                            {address.phone_number}
                                                        </p>

                                                        <p className="mt-2 text-sm text-gray-600">
                                                            {address.address_line_1}
                                                            {address.address_line_2
                                                                ? `, ${address.address_line_2}`
                                                                : ""}
                                                        </p>

                                                        <p className="text-sm text-gray-600">
                                                            {address.city}, {address.state}{" "}
                                                            {address.postal_code}
                                                        </p>

                                                        <p className="text-sm text-gray-600">
                                                            {address.country}
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}

                                        <Link
                                            to="/account/addresses"
                                            className="inline-block text-sm font-medium text-rose-700 hover:underline"
                                        >
                                            Manage saved addresses
                                        </Link>
                                    </div>
                                )}
                            </section>

                            {/* Order summary section */}
                            <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6">
                                <h2 className="mb-5 text-xl font-semibold text-gray-800">
                                    2. Order Summary
                                </h2>

                                {!cart?.items?.length ? (
                                    <p className="text-sm text-gray-600">
                                        Your cart is empty.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex justify-between gap-4 text-sm"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {item.title}
                                                    </p>

                                                    <p className="mt-1 text-gray-500">
                                                        Qty: {item.quantity}
                                                    </p>
                                                </div>

                                                <p className="whitespace-nowrap text-gray-700">
                                                    ₹
                                                    {(
                                                        Number(item.price) *
                                                        Number(item.quantity)
                                                    ).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}

                                        <div className="border-t border-gray-200 pt-4">
                                            <div className="flex justify-between font-semibold text-gray-800">
                                                <span>Total</span>
                                                <span>
                                                    ₹{orderTotal.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    disabled={
                                        !cart?.items?.length ||
                                        !selectedAddressId
                                    }
                                    onClick={() => {
                                        alert(
                                            "Address selected! Order placement will be connected in the next step."
                                        );
                                    }}
                                    className="mt-6 w-full rounded-lg bg-rose-700 px-4 py-3 font-medium text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                                >
                                    Place Order
                                </button>

                                <Link
                                    to="/cart"
                                    className="mt-4 block text-center text-sm text-gray-600 hover:text-rose-700"
                                >
                                    Return to Cart
                                </Link>
                            </aside>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}

export default Checkout;
