
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { ADDRESS_BASE_URL } from "../../constants";
import AddressForm from "../../components/AddressForm";

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
        if (!/^\d{10}$/.test(formData.phone_number)) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }
        try {
            const token = sessionStorage.getItem("authToken");

            // Check whether we are editing or adding an address
            const isEditing = editingAddress !== null;

            const url = isEditing
                ? `${ADDRESS_BASE_URL}${editingAddress.id}/`
                : ADDRESS_BASE_URL;

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
                `${ADDRESS_BASE_URL}${addressId}/`,
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
                    ADDRESS_BASE_URL,
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

                        <AddressForm
                            formData={formData}
                            setFormData={setFormData}
                        />

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
