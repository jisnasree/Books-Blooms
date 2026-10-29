
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

function Addresses() {
    // Stores the user's saved addresses
    const [addresses, setAddresses] = useState([]);

    // Tracks loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Controls whether the add-address popup is visible
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        label: "HOME",
        full_name: "",
        phone_number: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        is_default: false,
    });
    const [editingAddress, setEditingAddress] = useState(null);


    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    }


    function handleEdit(address) {
        setEditingAddress(address);

        setFormData({
            label: address.label,
            full_name: address.full_name,
            phone_number: address.phone_number,
            address_line_1: address.address_line_1,
            address_line_2: address.address_line_2 || "",
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
            is_default: address.is_default,
        });

        setShowForm(true);
    }



    async function handleSubmit(e) {
        e.preventDefault();

        try {
            const token = sessionStorage.getItem("authToken");

            // Check whether we are editing or adding an address
            const isEditing = editingAddress !== null;

            const url = isEditing
                ? `http://127.0.0.1:8000/api/addresses/${editingAddress.id}/`
                : "http://127.0.0.1:8000/api/addresses/";

            const response = await fetch(url, {
                method: isEditing ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.log(errorData);
                throw new Error("Failed to save address.");
            }

            const savedAddress = await response.json();

            // Update the existing address or add a new one
            setAddresses((previousAddresses) => {
                if (isEditing) {
                    return previousAddresses.map((address) =>
                        address.id === savedAddress.id
                            ? savedAddress
                            : address
                    );
                }

                return [...previousAddresses, savedAddress];
            });

            // Close the popup
            setShowForm(false);

            // Clear the selected address
            setEditingAddress(null);

            // Reset the form
            setFormData({
                label: "HOME",
                full_name: "",
                phone_number: "",
                address_line_1: "",
                address_line_2: "",
                city: "",
                state: "",
                postal_code: "",
                country: "India",
                is_default: false,
            });
        } catch (error) {
            console.error("Error saving address:", error);
        }
    }



    async function handleDelete(addressId) {
        // Ask for confirmation before deleting
        const confirmed = window.confirm(
            "Are you sure you want to delete this address?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const token = sessionStorage.getItem("authToken");

            const response = await fetch(
                `http://127.0.0.1:8000/api/addresses/${addressId}/`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete address.");
            }

            // Remove the deleted address from the page
            setAddresses((previousAddresses) =>
                previousAddresses.filter(
                    (address) => address.id !== addressId
                )
            );
        } catch (error) {
            console.error("Error deleting address:", error);
            alert("Unable to delete the address. Please try again.");
        }
    }



    // Fetch saved addresses from the backend
    useEffect(() => {
        async function fetchAddresses() {
            try {
                const token = sessionStorage.getItem("authToken");

                const response = await fetch(
                    "http://127.0.0.1:8000/api/addresses/",
                    {
                        headers: {
                            Authorization: `Token ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch addresses.");
                }

                const data = await response.json();

                // Supports both a regular array and paginated API response
                setAddresses(Array.isArray(data) ? data : data.results || []);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        fetchAddresses();
    }, []);

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#FBFAF7] px-4 py-10">
                <div className="mx-auto max-w-5xl">

                    {/* Page heading and Add Address button */}
                    <div className="mb-8 flex items-center justify-between gap-4">
                        <div>
                            <h1 className="mb-2 text-3xl font-semibold text-gray-800">
                                My Addresses
                            </h1>

                            <p className="text-gray-600">
                                Manage your delivery addresses.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowForm(true)}
                            className="shrink-0 rounded-lg bg-rose-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-800"
                        >
                            + Add New Address
                        </button>
                    </div>

                    {/* Loading message */}
                    {loading && (
                        <p className="py-10 text-center text-gray-600">
                            Loading addresses...
                        </p>
                    )}

                    {/* Error message */}
                    {!loading && error && (
                        <p className="rounded-lg bg-red-50 p-4 text-red-600">
                            {error}
                        </p>
                    )}

                    {/* Empty address list */}
                    {!loading && !error && addresses.length === 0 && (
                        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
                            <h2 className="mb-2 text-xl font-semibold text-gray-800">
                                No saved addresses yet
                            </h2>

                            <p className="text-gray-600">
                                Add an address to make checkout easier.
                            </p>
                        </div>
                    )}

                    {/* Display saved addresses */}
                    {!loading && !error && addresses.length > 0 && (
                        <div className="grid gap-5 sm:grid-cols-2">
                            {addresses.map((address) => (
                                <div
                                    key={address.id}
                                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                                >
                                    {/* Address label and default badge */}
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h2 className="font-semibold text-gray-800">
                                            {address.label}
                                        </h2>

                                        {address.is_default && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                                Default
                                            </span>
                                        )}
                                    </div>

                                    {/* Address details */}
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p className="font-medium text-gray-800">
                                            {address.full_name}
                                        </p>

                                        <p>{address.phone_number}</p>

                                        <p>{address.address_line_1}</p>

                                        {address.address_line_2 && (
                                            <p>{address.address_line_2}</p>
                                        )}

                                        <p>
                                            {address.city}, {address.state}{" "}
                                            {address.postal_code}
                                        </p>

                                        <p>{address.country}</p>
                                    </div>

                                    <div className="mt-5 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(address)}
                                            className="rounded-lg border border-rose-700 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(address.id)}
                                            className="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Add Address Popup */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowForm(false)}
                >
                    <form
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8"
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Popup heading and close button */}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {editingAddress ? "Edit Address" : "Add New Address"}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Enter your delivery address details.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                aria-label="Close popup"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Address form fields */}
                        <div className="grid gap-5 sm:grid-cols-2">

                            {/* Address label */}
                            <div>
                                <label
                                    htmlFor="label"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Address Type
                                </label>

                                <select
                                    id="label"
                                    name="label"
                                    value={formData.label}
                                    onChange={handleChange}
                                    required
                                    defaultValue="HOME"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-rose-600"
                                >
                                    <option value="HOME">Home</option>
                                    <option value="WORK">Work</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            {/* Full name */}
                            <div>
                                <label
                                    htmlFor="full_name"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Full Name
                                </label>

                                <input
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    placeholder="Enter full name"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-rose-600"
                                />
                            </div>

                            {/* Phone number */}
                            <div>
                                <label
                                    htmlFor="phone_number"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Phone Number
                                </label>

                                <input
                                    id="phone_number"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    type="tel"
                                    required
                                    placeholder="Enter phone number"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-rose-600"
                                />
                            </div>

                            {/* Address line 1 */}
                            <div>
                                <label
                                    htmlFor="address_line_1"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Address Line 1
                                </label>

                                <input
                                    id="address_line_1"
                                    name="address_line_1"
                                    value={formData.address_line_1}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    placeholder="Street address"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-rose-600"
                                />
                            </div>

                            {/* Address line 2 */}
                            <div>
                                <label
                                    htmlFor="address_line_2"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Address Line 2 (Optional)
                                </label>

                                <input
                                    id="address_line_2"
                                    name="address_line_2"
                                    value={formData.address_line_2}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Apartment, suite, etc."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-rose-600"
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label
                                    htmlFor="city"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    City
                                </label>

                                <input
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    placeholder="Enter city"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-rose-600"
                                />
                            </div>

                            {/* State */}
                            <div>
                                <label
                                    htmlFor="state"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    State
                                </label>

                                <input
                                    id="state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    placeholder="Enter state"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-rose-600"
                                />
                            </div>

                            {/* Postal code */}
                            <div>
                                <label
                                    htmlFor="postal_code"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    ZIP / Postal Code
                                </label>

                                <input
                                    id="postal_code"
                                    name="postal_code"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    placeholder="Enter postal code"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-rose-600"
                                />
                            </div>

                            {/* Country */}
                            <div>
                                <label
                                    htmlFor="country"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Country
                                </label>

                                <input
                                    id="country"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    defaultValue="India"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-rose-600"
                                />
                            </div>
                        </div>

                        {/* Default address checkbox */}
                        <div className="mt-5">
                            <label className="flex items-center gap-3 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    name="is_default"
                                    checked={formData.is_default}
                                    onChange={handleChange}
                                    className="h-4 w-4 accent-rose-700"
                                />

                                Set as default address
                            </label>
                        </div>

                        {/* Popup action buttons */}
                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="rounded-lg bg-rose-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-rose-800"
                            >
                                {editingAddress ? "Update Address" : "Save Address"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <Footer />
        </>
    );
}

export default Addresses;
