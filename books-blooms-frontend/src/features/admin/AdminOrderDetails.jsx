
import { useEffect, useState } from "react";
import {
    Link,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";

import { ORDERS_URL } from "../../constants";

const ORDER_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
];

function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Check whether the page is in edit mode.
    const isEditMode = searchParams.get("edit") === "true";

    const [order, setOrder] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch one order from the backend.
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const token = sessionStorage.getItem("authToken");

                const response = await fetch(
                   `${ADMIN_BASE_URL}orders/${id}/`,
                    {
                        headers: {
                            Authorization: `Token ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error("Failed to fetch order details.");
                }

                setOrder(data);
                setNewStatus(data.order_status);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    // Update order status using PATCH.
    const handleStatusUpdate = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const token = sessionStorage.getItem("authToken");

            const response = await fetch(
               `${ADMIN_BASE_URL}orders/${id}/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${token}`,
                    },
                    body: JSON.stringify({
                        order_status: newStatus,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.order_status?.[0] ||
                    data.detail ||
                    "Failed to update order status."
                );
            }

            // Update the order with the backend response.
            setOrder(data);
            setNewStatus(data.order_status);
            setSuccess("Order status updated successfully!");

            // Return to view mode.
            navigate(`/admin/orders/${id}`);

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                Loading order details...
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="p-8 text-center text-red-600">
                {error}
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="min-h-screen bg-[#FBFAF7] p-6 md:p-10">

            {/* Page Header */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

                <div>
                    <Link
                        to="/admin/orders"
                        className="text-sm text-gray-500 hover:text-rose-600"
                    >
                        ← Back to Orders
                    </Link>

                    <h1 className="mt-3 text-2xl font-bold text-gray-800">
                        Order #{order.id}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Order placed on{" "}
                        {new Date(order.created_at).toLocaleString()}
                    </p>
                </div>

                {!isEditMode && (
                    <button
                        onClick={() =>
                            navigate(`/admin/orders/${id}?edit=true`)
                        }
                        className="rounded-lg bg-rose-600 px-5 py-2.5
                        text-white hover:bg-rose-700"
                    >
                        Edit Order Status
                    </button>
                )}
            </div>

            {/* Messages */}
            {success && (
                <div className="mb-5 rounded-lg bg-green-100 p-3 text-green-700">
                    {success}
                </div>
            )}

            {error && (
                <div className="mb-5 rounded-lg bg-red-100 p-3 text-red-700">
                    {error}
                </div>
            )}

            {/* Order Status */}
            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">

                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    Order Status
                </h2>

                {isEditMode ? (
                    <div className="flex flex-wrap items-center gap-4">

                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="rounded-lg border border-gray-300
                            bg-white px-4 py-3 outline-none
                            focus:border-rose-500"
                        >
                            {ORDER_STATUSES.map((status) => (
                                <option
                                    key={status}
                                    value={status}
                                    disabled={status === "CANCELLED"}
                                >
                                    {status.replaceAll("_", " ")}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={handleStatusUpdate}
                            disabled={
                                saving ||
                                !newStatus ||
                                newStatus === order.order_status ||
                                newStatus === "CANCELLED"
                            }
                            className="rounded-lg bg-rose-600 px-5 py-3
                            text-white hover:bg-rose-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50"
                        >
                            {saving ? "Updating..." : "Update Status"}
                        </button>

                        <button
                            onClick={() => {
                                setNewStatus(order.order_status);
                                setError("");
                                navigate(`/admin/orders/${id}`);
                            }}
                            className="rounded-lg border border-gray-300
                            px-5 py-3 text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <span className="inline-block rounded-full bg-rose-100
                    px-4 py-2 text-sm font-semibold text-rose-700">
                        {order.order_status?.replaceAll("_", " ")}
                    </span>
                )}
            </div>

            {/* Customer Information */}
            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">

                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    Customer Information
                </h2>

                <div className="grid gap-4 md:grid-cols-2">

                    <div>
                        <p className="text-sm text-gray-500">
                            Customer Name
                        </p>
                        <p className="font-medium text-gray-800">
                            {order.customer_name || "N/A"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">
                            Email
                        </p>
                        <p className="font-medium text-gray-800">
                            {order.email || "N/A"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">
                            Phone
                        </p>
                        <p className="font-medium text-gray-800">
                            {order.shipping_phone_number  || "N/A"}
                        </p>
                    </div>

                </div>
            </div>

            {/* Ordered Books */}
            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">

                <h2 className="mb-5 text-lg font-semibold text-gray-800">
                    Ordered Books
                </h2>

                <div className="space-y-5">

                    {order.items?.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-wrap items-center gap-4
                            border-b border-gray-100 pb-5 last:border-0"
                        >
                            {item.cover_url && (
                                <img
                                    src={item.cover_url}
                                    alt={item.book_title}
                                    className="h-24 w-16 rounded object-cover"
                                />
                            )}

                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">
                                    {item.book_title}
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Format: {item.book_format}
                                </p>

                                <p className="text-sm text-gray-500">
                                    Quantity: {item.quantity}
                                </p>
                            </div>

                            <p className="font-semibold text-gray-800">
                                ₹{item.item_total}
                            </p>
                        </div>
                    ))}

                </div>
            </div>

            {/* Payment Information */}
            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">

                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    Payment Information
                </h2>

                <div className="grid gap-4 md:grid-cols-2">

                    <div>
                        <p className="text-sm text-gray-500">
                            Payment Method
                        </p>
                        <p className="font-medium text-gray-800">
                            {order.payment_method}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">
                            Payment Status
                        </p>
                        <p className="font-medium text-gray-800">
                            {order.payment_status}
                        </p>
                    </div>

                </div>
            </div>

            {/* Order Summary */}
            <div className="rounded-xl bg-white p-6 shadow-sm">

                <h2 className="mb-5 text-lg font-semibold text-gray-800">
                    Order Summary
                </h2>

                <div className="space-y-3">

                    <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>₹{order.subtotal}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Shipping Charge</span>
                        <span>₹{order.shipping_charge}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Tax</span>
                        <span>₹{order.tax_amount}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Discount</span>
                        <span>₹{order.discount_amount}</span>
                    </div>

                    <div className="flex justify-between border-t pt-4
                    text-lg font-bold text-gray-800">
                        <span>Total Amount</span>
                        <span>₹{order.total_amount}</span>
                    </div>

                </div>
            </div>

        </div>
    );
}

export default OrderDetails;
