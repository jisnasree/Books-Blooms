
import { useEffect, useState, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import {
    CART_LIST_URL,
    ADDRESS_BASE_URL,
    ORDERS_URL
} from "../../constants";

import { CartContext } from "../../context/CartContext";


// Load Razorpay Checkout script
function loadRazorpayScript() {
    return new Promise((resolve) => {

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


function Checkout() {

    const [cart, setCart] = useState(null);

    const [addresses, setAddresses] = useState([]);

    const [selectedAddressId, setSelectedAddressId] = useState(null);

    const [loading, setLoading] = useState(true);

    const [loadError, setLoadError] = useState("");

    const [error, setError] = useState("");

    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [pendingOrder, setPendingOrder] = useState(null);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [paymentReference, setPaymentReference] = useState(null);

    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const paymentHandledRef = useRef(false);

    // Stores the actual Razorpay payment failure message.
    // This allows us to display it even after the popup closes.
    const paymentFailureRef = useRef("");


    // New address form state
    const [addressForm, setAddressForm] = useState({
        label: "HOME",
        full_name: "",
        phone_number: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "USA",
        is_default: false,
    });

    const [savingAddress, setSavingAddress] = useState(false);

    const [addressError, setAddressError] = useState("");

    const [addressSuccess, setAddressSuccess] = useState("");


    const navigate = useNavigate();

    const { refreshCart } = useContext(CartContext);


    // Handle changes in address form inputs
    function handleAddressChange(e) {

        const { name, value, type, checked } = e.target;

        setAddressForm((previousForm) => ({
            ...previousForm,
            [name]: type === "checkbox" ? checked : value,
        }));
    }


    // Save new address
    async function handleSaveAddress() {

        try {

            setAddressError("");
            setAddressSuccess("");

            setSavingAddress(true);

            const token = sessionStorage.getItem("authToken");

            if (!token) {
                throw new Error("Please log in to save an address.");
            }

            const response = await fetch(ADDRESS_BASE_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },

                body: JSON.stringify(addressForm),

            });

            const data = await response.json();

            if (!response.ok) {

                const message = Object.entries(data)
                    .map(([field, messages]) => {

                        const fieldMessages = Array.isArray(messages)
                            ? messages.join(", ")
                            : String(messages);

                        return `${field}: ${fieldMessages}`;

                    })
                    .join(" | ");

                throw new Error(
                    message || "Unable to save address."
                );
            }


            // Fetch updated address list
            const addressResponse = await fetch(ADDRESS_BASE_URL, {

                headers: {
                    Authorization: `Token ${token}`,
                },

            });

            if (!addressResponse.ok) {
                throw new Error(
                    "Address saved, but unable to refresh the address list."
                );
            }

            const addressData = await addressResponse.json();

            const savedAddresses = Array.isArray(addressData)
                ? addressData
                : addressData.results || [];

            setAddresses(savedAddresses);

            // Select the newly saved address
            setSelectedAddressId(data.id);


            // Reset address form
            setAddressForm({
                label: "HOME",
                full_name: "",
                phone_number: "",
                address_line_1: "",
                address_line_2: "",
                city: "",
                state: "",
                postal_code: "",
                country: "USA",
                is_default: false,
            });

            setAddressSuccess("Address saved successfully!");

        } catch (error) {

            setAddressError(error.message);

        } finally {

            setSavingAddress(false);

        }
    }


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

                setLoadError(error.message);

            } finally {

                setLoading(false);

            }
        }

        fetchCheckoutData();

    }, []);


    // Apply coupon: validate with the backend and show the discount live
    async function handleApplyCoupon() {

        const code = couponCode.trim();

        if (!code) {
            setCouponError("Enter a coupon code.");
            return;
        }

        try {
            setCouponError("");
            setApplyingCoupon(true);

            const token = sessionStorage.getItem("authToken");

            const response = await fetch(`${ORDERS_URL}coupons/validate/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({ code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Invalid coupon code.");
            }

            setAppliedCoupon(data);
            setPendingOrder(null);   // price changed → create a fresh order

        } catch (error) {
            setCouponError(error.message);
            setAppliedCoupon(null);
        } finally {
            setApplyingCoupon(false);
        }
    }

    // Remove the applied coupon
    function handleRemoveCoupon() {
        setAppliedCoupon(null);
        setCouponCode("");
        setCouponError("");
        setPendingOrder(null);   // price changed → create a fresh order
    }
    // Place order
    async function handlePlaceOrder() {

        try {

            setError("");
            setPaymentReference(null);
            paymentFailureRef.current = "";
            paymentHandledRef.current = false;

            setPlacingOrder(true);

            const token = sessionStorage.getItem("authToken");

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            };


            // 1. Create Books & Blooms order.
            // On payment retry, reuse the pending order instead of
            // creating a duplicate.
            let orderData =
                pendingOrder && pendingOrder.payment_method === paymentMethod
                    ? pendingOrder
                    : null;

            if (!orderData) {

                const response = await fetch(ORDERS_URL, {

                    method: "POST",

                    headers,

                    body: JSON.stringify({
                        address_id: selectedAddressId,
                        payment_method: paymentMethod,
                        coupon_code: appliedCoupon ? appliedCoupon.code : "",
                    }),

                });

                orderData = await response.json();

                if (!response.ok) {

                    throw new Error(
                        orderData.detail ||
                        orderData.error ||
                        "Unable to place your order."
                    );
                }

                if (paymentMethod !== "COD") {
                    setPendingOrder(orderData);
                }
            }

            // 2. COD payment
            if (paymentMethod === "COD") {

                await refreshCart();

                navigate("/order-success", {
                    state: {
                        order: orderData,
                    },
                });

                return;
            }


            // 3. Load Razorpay Checkout script
            const scriptLoaded = await loadRazorpayScript();

            if (!scriptLoaded) {

                throw new Error(
                    "Unable to load Razorpay. Your order is saved as pending. Please try again."
                );
            }


            // 4. Create Razorpay payment order
            const paymentResponse = await fetch(
                `${ORDERS_URL}${orderData.id}/create-payment/`,
                {
                    method: "POST",
                    headers,
                }
            );

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok) {

                throw new Error(
                    paymentData.detail ||
                    "Unable to initialize Razorpay payment."
                );
            }


            // Allow customer to interact with Razorpay
            setPlacingOrder(false);


            // 5. Configure Razorpay Checkout
            const options = {

                key: paymentData.key_id,

                amount: paymentData.amount,

                currency: paymentData.currency,

                name: "Books & Blooms",

                description: `Order #${orderData.id}`,

                order_id: paymentData.razorpay_order_id,


                // 6. Handle successful payment
                handler: async function (razorpayResponse) {

                    try {

                        setPlacingOrder(true);

                        setError("");

                        paymentFailureRef.current = "";


                        // Verify payment with Django backend
                        const verifyResponse = await fetch(
                            `${ORDERS_URL}${orderData.id}/verify-payment/`,
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


                        // 7. Payment verified successfully
                        await refreshCart();


                        // Navigate to order success page
                        navigate("/order-success", {
                            state: {
                                order: verifyData.order,
                            },
                        });

                    } catch (error) {

                        setError(error.message);

                    } finally {

                        setPlacingOrder(false);

                    }
                },


                // 8. Handle Razorpay popup dismissal

                modal: {

                    ondismiss: function () {

                        // payment.failed already navigated to the failure page
                        if (paymentHandledRef.current) {
                            return;
                        }

                        setPlacingOrder(false);

                        // Customer closed popup without completing payment
                        navigate("/order-failure", {
                            state: {
                                order: orderData,
                                errorMessage:
                                    "Payment cancelled. You closed the payment window before completing the payment.",
                            },
                        });

                    },

                },


                // Checkout theme
                theme: {
                    color: "#BE123C",
                },

            };


            // 9. Create Razorpay Checkout instance
            const razorpay = new window.Razorpay(options);


            // 10. Handle actual payment failure
            razorpay.on("payment.failed", function (response) {

                paymentHandledRef.current = true;   // mark handled FIRST

                setPlacingOrder(false);

                const failureMessage =
                    response.error?.description &&
                        response.error.description !== "Payment failed"
                        ? response.error.description
                        : "Your payment could not be completed. Please try again.";

                const referenceDetails = {
                    paymentId: response.error?.metadata?.payment_id,
                    orderId: response.error?.metadata?.order_id,
                };

                setPaymentReference(referenceDetails);

                paymentFailureRef.current = failureMessage;

                navigate("/order-failure", {
                    state: {
                        order: orderData,
                        errorMessage: failureMessage,
                        paymentId: response.error?.metadata?.payment_id,
                    },
                });

            });

            // 11. Open Razorpay Checkout
            razorpay.open();


        } catch (error) {

            setError(error.message);

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

    // Coupon discount on the subtotal
    const discountAmount = appliedCoupon
        ? (subtotal * Number(appliedCoupon.discount_percent)) / 100
        : 0;

    const discountedSubtotal = subtotal - discountAmount;

    // Free delivery above ₹2,000 (after discount), otherwise ₹100
    const deliveryCharge = discountedSubtotal > 2000 ? 0 : 100;

    // Tax rate: 8.25% on the discounted subtotal
    const taxRate = 0.0825;
    const taxAmount = discountedSubtotal * taxRate;

    // Final payable amount
    const totalAmount = discountedSubtotal + deliveryCharge + taxAmount;


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


                    {/* Loading error */}
                    {loadError && !loading && (

                        <div className="rounded-lg bg-red-50 p-4 text-red-700">
                            {loadError}
                        </div>

                    )}


                    {!loading && !loadError && (

                        <>




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
                                                                    selectedAddressId === address.id
                                                                }
                                                                onChange={() =>
                                                                    setSelectedAddressId(address.id)
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

                                                <select
                                                    name="label"
                                                    value={addressForm.label}
                                                    onChange={handleAddressChange}
                                                    className={inputClass}
                                                >

                                                    <option value="HOME">Home</option>
                                                    <option value="WORK">Work</option>
                                                    <option value="OTHER">Other</option>

                                                </select>

                                            </div>



                                            {/* Full name */}
                                            <div>

                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Full Name
                                                </label>

                                                <input
                                                    type="text"
                                                    name="full_name"
                                                    placeholder="Enter full name"
                                                    className={inputClass}
                                                    value={addressForm.full_name}
                                                    onChange={handleAddressChange}
                                                    required
                                                />

                                            </div>



                                            {/* Phone */}
                                            <div>

                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Phone Number
                                                </label>

                                                <input
                                                    type="tel"
                                                    name="phone_number"
                                                    placeholder="Enter phone number"
                                                    className={inputClass}
                                                    value={addressForm.phone_number}
                                                    onChange={handleAddressChange}
                                                    required
                                                />

                                            </div>



                                            {/* Address line 1 */}
                                            <div>

                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Address Line 1
                                                </label>

                                                <input
                                                    type="text"
                                                    name="address_line_1"
                                                    placeholder="House number, street name"
                                                    className={inputClass}
                                                    value={addressForm.address_line_1}
                                                    onChange={handleAddressChange}
                                                    required
                                                />

                                            </div>



                                            {/* Address line 2 */}
                                            <div>

                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Address Line 2 (Optional)
                                                </label>

                                                <input
                                                    type="text"
                                                    name="address_line_2"
                                                    placeholder="Apartment, suite, landmark"
                                                    className={inputClass}
                                                    value={addressForm.address_line_2}
                                                    onChange={handleAddressChange}
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
                                                        name="city"
                                                        placeholder="City"
                                                        className={inputClass}
                                                        value={addressForm.city}
                                                        onChange={handleAddressChange}
                                                        required
                                                    />

                                                </div>


                                                <div>

                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        State
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="state"
                                                        placeholder="State"
                                                        className={inputClass}
                                                        value={addressForm.state}
                                                        onChange={handleAddressChange}
                                                        required
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
                                                        name="postal_code"
                                                        placeholder="Postal code"
                                                        className={inputClass}
                                                        value={addressForm.postal_code}
                                                        onChange={handleAddressChange}
                                                        required
                                                    />

                                                </div>


                                                <div>

                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        Country
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="country"
                                                        value={addressForm.country}
                                                        onChange={handleAddressChange}
                                                        className={inputClass}
                                                        required
                                                    />

                                                </div>

                                            </div>



                                            {/* Default address */}
                                            <div className="flex items-center gap-2">

                                                <input
                                                    type="checkbox"
                                                    id="defaultAddress"
                                                    name="is_default"
                                                    checked={addressForm.is_default}
                                                    onChange={handleAddressChange}
                                                    className="h-4 w-4 accent-rose-700"
                                                />

                                                <label
                                                    htmlFor="defaultAddress"
                                                    className="text-sm text-gray-600"
                                                >
                                                    Set as default address
                                                </label>

                                            </div>



                                            {/* Address error */}
                                            {addressError && (

                                                <p className="text-sm text-red-600">
                                                    {addressError}
                                                </p>

                                            )}


                                            {/* Address success */}
                                            {addressSuccess && (

                                                <p className="text-sm text-green-700">
                                                    {addressSuccess}
                                                </p>

                                            )}



                                            <button
                                                type="button"
                                                onClick={handleSaveAddress}
                                                disabled={savingAddress}
                                                className="rounded-lg bg-rose-700 px-5 py-3 font-medium text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                                            >

                                                {savingAddress
                                                    ? "Saving..."
                                                    : "Save Address"}

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
                                                            Number(item.price) *
                                                            Number(item.quantity)
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

                                                {appliedCoupon && (
                                                    <div className="flex justify-between text-sm">

                                                        <span className="text-green-700">
                                                            Discount ({appliedCoupon.code})
                                                        </span>

                                                        <span className="font-medium text-green-700">
                                                            −₹{discountAmount.toFixed(2)}
                                                        </span>

                                                    </div>
                                                )}
                                                {/* Coupon */}
                                                <div className="mt-4">

                                                    {appliedCoupon ? (

                                                        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-2">

                                                            <span className="text-sm font-medium text-green-700">
                                                                {appliedCoupon.code} applied — {appliedCoupon.discount_percent}% off
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={handleRemoveCoupon}
                                                                className="text-sm font-medium text-red-600 hover:underline"
                                                            >
                                                                Remove
                                                            </button>

                                                        </div>

                                                    ) : (

                                                        <div className="flex gap-2">

                                                            <input
                                                                type="text"
                                                                value={couponCode}
                                                                onChange={(e) => {
                                                                    setCouponCode(e.target.value);
                                                                    setCouponError("");
                                                                }}
                                                                placeholder="Coupon code"
                                                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm uppercase outline-none focus:border-rose-700"
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={handleApplyCoupon}
                                                                disabled={applyingCoupon || !couponCode.trim()}
                                                                className="shrink-0 rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                                                            >
                                                                {applyingCoupon ? "..." : "Apply"}
                                                            </button>

                                                        </div>

                                                    )}

                                                    {couponError && (
                                                        <p className="mt-2 text-sm text-red-600">
                                                            {couponError}
                                                        </p>
                                                    )}

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
                                                    onChange={() => {
                                                        setPaymentMethod("COD");
                                                        setError("");
                                                    }}
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
                                                    checked={paymentMethod === "RAZORPAY"}
                                                    onChange={() => {
                                                        setPaymentMethod("RAZORPAY");
                                                        setError("");
                                                    }}
                                                    className="h-4 w-4 accent-rose-700"
                                                />

                                                <div>

                                                    <p className="font-medium text-gray-800">
                                                        Pay online
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        (Razorpay)
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

                                        {placingOrder
                                            ? "Processing..."
                                            : paymentMethod === "RAZORPAY"
                                                ? "Pay Now"
                                                : "Place Order"}

                                    </button>



                                    <Link
                                        to="/cart"
                                        className="mt-4 block text-center text-sm text-gray-600 hover:text-rose-700"
                                    >
                                        Return to Cart
                                    </Link>

                                    {/* Payment Error Message */}
                                    {error && (
                                        <div
                                            role="alert"
                                            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
                                        >
                                            <p className="font-semibold">
                                                Payment Failed
                                            </p>

                                            <p className="mt-2 text-sm">
                                                {error}
                                            </p>

                                            {paymentReference?.paymentId && (
                                                <div className="mt-4 border-t border-red-200 pt-3">

                                                    <p className="text-xs font-semibold uppercase">
                                                        Payment Reference ID
                                                    </p>

                                                    <p className="mt-1 break-all font-mono text-sm">
                                                        {paymentReference.paymentId}
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigator.clipboard.writeText(
                                                                paymentReference.paymentId
                                                            )
                                                        }
                                                        className="mt-2 text-xs font-medium underline cursor-pointer"
                                                    >
                                                        Copy Payment ID
                                                    </button>

                                                </div>
                                            )}

                                            {paymentReference?.orderId && (
                                                <p className="mt-3 text-xs">
                                                    Razorpay Order ID: {paymentReference.orderId}
                                                </p>
                                            )}

                                            <p className="mt-3 text-xs text-red-600">
                                                If money was deducted, please contact Books & Blooms support with your payment reference ID.
                                            </p>
                                        </div>
                                    )}
                                </aside>

                            </div>

                        </>

                    )}

                </div>

            </main>


            <Footer />

        </>

    );

}


export default Checkout;
