import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import { CART_LIST_URL, ADDRESS_BASE_URL, ORDERS_URL } from "../../constants";
import { CartContext } from "../../context/CartContext";

function Checkout() {
    const [cart, setCart] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [paymentMethod, setPaymentMethod] = useState("COD");

    const navigate = useNavigate();
    const { refreshCart } = useContext(CartContext);
    const [placingOrder, setPlacingOrder] = useState(false);


    // Fetch cart and saved addresses
    useEffect(() => {
        async function fetchCheckoutData() {
            try {
                const token = sessionStorage.getItem("authToken");

                if (!token) {
                    throw new Error(
                        "Please log in to continue to checkout."
                    );
                }

                const headers = {
                    Authorization: `Token ${token}`,
                };

                // Fetch customer's cart
                const cartResponse = await fetch(CART_LIST_URL, {
                    headers,
                });

                if (!cartResponse.ok) {
                    throw new Error("Unable to load your cart.");
                }

                const cartData = await cartResponse.json();
                setCart(cartData);

                // Fetch customer's saved addresses
                const addressResponse = await fetch(ADDRESS_BASE_URL, {
                    headers,
                });

                if (!addressResponse.ok) {
                    throw new Error("Unable to load your addresses.");
                }

                const addressData = await addressResponse.json();

                const savedAddresses = Array.isArray(addressData)
                    ? addressData
                    : addressData.results || [];

                setAddresses(savedAddresses);

                // Select default address initially
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


    // Place order
    async function handlePlaceOrder() {
        try {
            setPlacingOrder(true);

            const token = sessionStorage.getItem("authToken");

            const response = await fetch(ORDERS_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                    address_id: selectedAddressId,
                    payment_method: paymentMethod,
                }),
            });

            const orderData = await response.json();

            if (!response.ok) {
                throw new Error(
                    orderData.error || "Unable to place your order."
                );
            }

            await refreshCart();

            navigate("/order-success", {
                state: {
                    order: orderData,
                },
            });

        } catch (error) {
            setError(error.message);
        } finally {
            setPlacingOrder(false);
        }
    }
    // Calculate subtotal
    const subtotal =
        cart?.items?.reduce((total, item) => {
            return (
                total +
                Number(item.price) * Number(item.quantity)
            );
        }, 0) || 0;

    // Fixed delivery charge
    const deliveryCharge = subtotal > 2000 ? 0 : 100;

    // Example tax rate: 8.25%
    const taxRate = 0.0825;

    const taxAmount = subtotal * taxRate;

    // Final payable amount
    const totalAmount =
        subtotal + deliveryCharge + taxAmount;

    // Styling for address form inputs
    const inputClass =
        "w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-rose-700 focus:ring-1 focus:ring-rose-700";

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#FBFAF7] px-4 py-10">
                <div className="mx-auto max-w-6xl">

                    <h1 className="mb-2 text-3xl font-semibold text-gray-800">
                        Checkout
                    </h1>

                    <p className="mb-8 text-gray-600">
                        Review your order and choose a delivery address.
                    </p>

                    {/* Loading */}
                    {loading && (
                        <p className="py-10 text-center text-gray-600">
                            Loading checkout...
                        </p>
                    )}

                    {/* Error */}
                    {error && !loading && (
                        <div className="rounded-lg bg-red-50 p-4 text-red-700">
                            {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="grid gap-8 lg:grid-cols-3">

                            {/* LEFT SIDE - DELIVERY ADDRESS */}
                            <section className="space-y-6 lg:col-span-2">

                                <div>
                                    <h2 className="mb-4 text-xl font-semibold text-gray-800">
                                        1. Delivery Address
                                    </h2>

                                    {/* Saved addresses */}
                                    {addresses.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            {addresses.map((address) => (
                                                <label
                                                    key={address.id}
                                                    className={`block cursor-pointer rounded-xl border bg-white p-5 transition ${selectedAddressId === address.id
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
                                                                selectedAddressId ===
                                                                address.id
                                                            }
                                                            onChange={() =>
                                                                setSelectedAddressId(
                                                                    address.id
                                                                )
                                                            }
                                                            className="mt-1 h-4 w-4 accent-rose-700"
                                                        />

                                                        <div className="min-w-0 flex-1">

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

                                                            <p className="mt-2 break-words text-sm text-gray-600">
                                                                {address.address_line_1}
                                                                {address.address_line_2
                                                                    ? `, ${address.address_line_2}`
                                                                    : ""}
                                                            </p>

                                                            <p className="text-sm text-gray-600">
                                                                {address.city},{" "}
                                                                {address.state}{" "}
                                                                {address.postal_code}
                                                            </p>

                                                            <p className="text-sm text-gray-600">
                                                                {address.country}
                                                            </p>

                                                        </div>
                                                    </div>
                                                </label>
                                            ))}

                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-gray-200 bg-white p-5">
                                            <p className="text-gray-600">
                                                You haven't saved an address yet.
                                                Please add one below.
                                            </p>
                                        </div>
                                    )}

                                    {addresses.length > 0 && (
                                        <Link
                                            to="/account/addresses"
                                            className="mt-3 inline-block text-sm font-medium text-rose-700 hover:underline"
                                        >
                                            Manage saved addresses
                                        </Link>
                                    )}
                                </div>

                                {/* ADD NEW ADDRESS FORM */}
                                <div className="rounded-xl border border-gray-200 bg-white p-6">

                                    <h2 className="mb-5 text-xl font-semibold text-gray-800">
                                        Add a New Address
                                    </h2>

                                    <div className="space-y-4">

                                        {/* Address type */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Address Type
                                            </label>

                                            <select className={inputClass}>
                                                <option value="HOME">
                                                    Home
                                                </option>
                                                <option value="WORK">
                                                    Work
                                                </option>
                                                <option value="OTHER">
                                                    Other
                                                </option>
                                            </select>
                                        </div>

                                        {/* Full name */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Full Name
                                            </label>

                                            <input
                                                type="text"
                                                placeholder="Enter full name"
                                                className={inputClass}
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Phone Number
                                            </label>

                                            <input
                                                type="tel"
                                                placeholder="Enter phone number"
                                                className={inputClass}
                                            />
                                        </div>

                                        {/* Address line 1 */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Address Line 1
                                            </label>

                                            <input
                                                type="text"
                                                placeholder="House number, street name"
                                                className={inputClass}
                                            />
                                        </div>

                                        {/* Address line 2 */}
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Address Line 2 (Optional)
                                            </label>

                                            <input
                                                type="text"
                                                placeholder="Apartment, suite, landmark"
                                                className={inputClass}
                                            />
                                        </div>

                                        {/* City and State */}
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    City
                                                </label>

                                                <input
                                                    type="text"
                                                    placeholder="City"
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    State
                                                </label>

                                                <input
                                                    type="text"
                                                    placeholder="State"
                                                    className={inputClass}
                                                />
                                            </div>

                                        </div>

                                        {/* Postal code and country */}
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    ZIP / Postal Code
                                                </label>

                                                <input
                                                    type="text"
                                                    placeholder="Postal code"
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Country
                                                </label>

                                                <input
                                                    type="text"
                                                    defaultValue="USA"
                                                    className={inputClass}
                                                />
                                            </div>

                                        </div>

                                        {/* Default address */}
                                        <div className="flex items-center gap-2">

                                            <input
                                                type="checkbox"
                                                id="defaultAddress"
                                                className="h-4 w-4 accent-rose-700"
                                            />

                                            <label
                                                htmlFor="defaultAddress"
                                                className="text-sm text-gray-600"
                                            >
                                                Set as default address
                                            </label>

                                        </div>

                                        <button
                                            type="button"
                                            className="rounded-lg bg-rose-700 px-5 py-3 font-medium text-white transition hover:bg-rose-800"
                                        >
                                            Save Address
                                        </button>

                                    </div>
                                </div>
                            </section>

                            {/* RIGHT SIDE - ORDER SUMMARY */}
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

                                        {/* Cart items */}
                                        {cart.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex justify-between gap-4 text-sm"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {item.book_title}
                                                    </p>

                                                    <p className="mt-1 text-gray-500">
                                                        Format: {item.format}
                                                    </p>

                                                    <p className="mt-1 text-gray-500">
                                                        Qty: {item.quantity}
                                                    </p>
                                                </div>

                                                <p className="whitespace-nowrap text-gray-700">
                                                    ₹{(
                                                        Number(item.price) * Number(item.quantity)
                                                    ).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}

                                        {/* Price breakdown */}
                                        <div className="space-y-3 border-t border-gray-200 pt-4">

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Subtotal
                                                </span>

                                                <span className="font-medium text-gray-800">
                                                    ₹{subtotal.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Delivery Charge
                                                </span>

                                                <span className="font-medium text-gray-800">
                                                    ₹{deliveryCharge.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Tax (8.25%)
                                                </span>

                                                <span className="font-medium text-gray-800">
                                                    ₹{taxAmount.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between border-t border-gray-200 pt-4 text-lg font-semibold text-gray-800">
                                                <span>Total</span>

                                                <span>
                                                    ₹{totalAmount.toFixed(2)}
                                                </span>
                                            </div>

                                        </div>
                                    </div>
                                )}

                                {/* PAYMENT METHOD */}
                                <div className="mt-6 border-t border-gray-200 pt-5">

                                    <h3 className="mb-4 font-semibold text-gray-800">
                                        3. Payment Method
                                    </h3>

                                    <div className="space-y-3">

                                        {/* COD */}
                                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-rose-400">

                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="COD"
                                                checked={paymentMethod === "COD"}
                                                onChange={() =>
                                                    setPaymentMethod("COD")
                                                }
                                                className="h-4 w-4 accent-rose-700"
                                            />

                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    Cash on Delivery
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Pay when your order arrives
                                                </p>
                                            </div>

                                        </label>

                                        {/* Razorpay */}
                                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-rose-400">

                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="RAZORPAY"
                                                checked={
                                                    paymentMethod === "RAZORPAY"
                                                }
                                                onChange={() =>
                                                    setPaymentMethod("RAZORPAY")
                                                }
                                                className="h-4 w-4 accent-rose-700"
                                            />

                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    Razorpay
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Pay securely online
                                                </p>
                                            </div>

                                        </label>

                                    </div>
                                </div>

                                {/* PLACE ORDER */}
                                <button
                                    type="button"
                                    disabled={
                                        !cart?.items?.length ||
                                        !selectedAddressId ||
                                        placingOrder
                                    }
                                    onClick={handlePlaceOrder}
                                    className="mt-6 w-full rounded-lg bg-rose-700 px-4 py-3 font-medium text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                                >
                                    {placingOrder ? "Placing Order..." : "Place Order"}
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