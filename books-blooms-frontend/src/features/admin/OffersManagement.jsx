
import { useEffect, useState } from "react";
import {
  ADMIN_OFFERS_URL,
  CATALOG_BOOKS_URL,
  CATALOG_CATEGORIES_URL,
} from "../../constants";

const emptyForm = {
  name: "",
  offer_type: "CATEGORY",
  category: "",
  book: "",
  discount_type: "PERCENTAGE",
  discount_value: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

// Convert API datetime into datetime-local input format.
function formatDateForInput(date) {
  if (!date) return "";

  const localDate = new Date(date);
  const offset = localDate.getTimezoneOffset();

  return new Date(localDate.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

function OffersManagement() {
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Token ${sessionStorage.getItem("authToken")}`,
  };

  // Fetch offers, categories and books.
  useEffect(() => {
    async function fetchData() {
      try {
        const [offerResponse, categoryResponse, bookResponse] =
          await Promise.all([
            fetch(ADMIN_OFFERS_URL, { headers }),
            fetch(CATALOG_CATEGORIES_URL, { headers }),
            fetch(CATALOG_BOOKS_URL, { headers }),
          ]);

        if (!offerResponse.ok) {
          throw new Error("Failed to load offers.");
        }

        if (!categoryResponse.ok || !bookResponse.ok) {
          throw new Error("Failed to load categories or books.");
        }

        const offerData = await offerResponse.json();
        const categoryData = await categoryResponse.json();
        const bookData = await bookResponse.json();

        setOffers(
          Array.isArray(offerData) ? offerData : offerData.results || []
        );

        setCategories(
          Array.isArray(categoryData)
            ? categoryData
            : categoryData.results || []
        );

        setBooks(
          Array.isArray(bookData) ? bookData : bookData.results || []
        );
      } catch (err) {
        setError(err.message || "Unable to load offer management data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function openAdd() {
    setEditingId(null);
    setFormData(emptyForm);
    setActionError("");
    setShowForm(true);
  }

  function openEdit(offer) {
    setEditingId(offer.id);

    setFormData({
      name: offer.name || "",
      offer_type: offer.offer_type,
      category: offer.category ? String(offer.category) : "",
      book: offer.book ? String(offer.book) : "",
      discount_type: offer.discount_type,
      discount_value: offer.discount_value,
      start_date: formatDateForInput(offer.start_date),
      end_date: formatDateForInput(offer.end_date),
      is_active: offer.is_active,
    });

    setActionError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setActionError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setActionError("");

    const discountValue = Number(formData.discount_value);

    if (!formData.name.trim()) {
      setActionError("Offer name is required.");
      return;
    }

    if (!discountValue || discountValue <= 0) {
      setActionError("Discount must be greater than zero.");
      return;
    }

    if (
      formData.discount_type === "PERCENTAGE" &&
      discountValue > 100
    ) {
      setActionError("Percentage discount cannot exceed 100%.");
      return;
    }

    if (
      !formData.start_date ||
      !formData.end_date ||
      new Date(formData.end_date) <= new Date(formData.start_date)
    ) {
      setActionError("Please provide valid offer dates.");
      return;
    }

    if (
      formData.offer_type === "CATEGORY" &&
      !formData.category
    ) {
      setActionError("Please select a category.");
      return;
    }

    if (
      formData.offer_type === "PRODUCT" &&
      !formData.book
    ) {
      setActionError("Please select a book.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      offer_type: formData.offer_type,
      category:
        formData.offer_type === "CATEGORY"
          ? Number(formData.category)
          : null,
      book:
        formData.offer_type === "PRODUCT"
          ? Number(formData.book)
          : null,
      discount_type: formData.discount_type,
      discount_value: discountValue,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      is_active: formData.is_active,
    };

    const isEditing = Boolean(editingId);

    const url = isEditing
      ? `${ADMIN_OFFERS_URL}${editingId}/`
      : ADMIN_OFFERS_URL;

    try {
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Object.values(data).flat().join(" ") ||
            "Failed to save offer."
        );
      }

      if (isEditing) {
        setOffers((prev) =>
          prev.map((offer) =>
            offer.id === data.id ? data : offer
          )
        );
      } else {
        setOffers((prev) => [...prev, data]);
      }

      closeForm();
    } catch (err) {
      setActionError(err.message || "Unable to save offer.");
    }
  }

  // Activate or deactivate an offer.
  async function toggleStatus(offer) {
    setActionError("");

    try {
      const response = await fetch(
        `${ADMIN_OFFERS_URL}${offer.id}/`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            is_active: !offer.is_active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to update offer status.");
      }

      setOffers((prev) =>
        prev.map((item) =>
          item.id === data.id ? data : item
        )
      );
    } catch (err) {
      setActionError(err.message);
    }
  }

  // Delete an offer.
  async function handleDelete(offer) {
    if (!window.confirm(`Delete offer "${offer.name}"?`)) {
      return;
    }

    setActionError("");

    try {
      const response = await fetch(
        `${ADMIN_OFFERS_URL}${offer.id}/`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete offer.");
      }

      setOffers((prev) =>
        prev.filter((item) => item.id !== offer.id)
      );
    } catch (err) {
      setActionError(err.message);
    }
  }

  if (loading) {
    return <p className="p-6">Loading offers...</p>;
  }

  if (error) {
    return (
      <p className="p-6 text-red-600" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="p-6">
      {/* Page heading */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold">
          Offer Management
        </h1>

        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
        >
          + Add Offer
        </button>
      </div>

      {actionError && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      {/* Add / Edit Offer Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid max-w-3xl grid-cols-1 gap-4 rounded-lg border bg-white p-5 sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              Offer Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Summer Sale"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Offer Type
            </label>

            <select
              name="offer_type"
              value={formData.offer_type}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  offer_type: e.target.value,
                  category: "",
                  book: "",
                }));
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="CATEGORY">Category Offer</option>
              <option value="PRODUCT">Product Offer</option>
            </select>
          </div>

          {/* Category selection */}
          {formData.offer_type === "CATEGORY" && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Select Category
              </label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Choose Category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Book selection */}
          {formData.offer_type === "PRODUCT" && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Select Book
              </label>

              <select
                name="book"
                value={formData.book}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Choose Book</option>

                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Discount Type
            </label>

            <select
              name="discount_type"
              value={formData.discount_type}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Discount Value
            </label>

            <input
              type="number"
              name="discount_value"
              value={formData.discount_value}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              max={
                formData.discount_type === "PERCENTAGE"
                  ? "100"
                  : undefined
              }
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder={
                formData.discount_type === "PERCENTAGE"
                  ? "10"
                  : "100"
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Start Date
            </label>

            <input
              type="datetime-local"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              End Date
            </label>

            <input
              type="datetime-local"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 accent-green-700"
            />
            Active
          </label>

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-green-800"
            >
              {editingId ? "Update Offer" : "Save Offer"}
            </button>

            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Offers Table */}
      {offers.length === 0 ? (
        <p>No offers available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 bg-white text-sm">
            <thead className="bg-[#203746] text-white">
              <tr>
                <th className="border p-3 text-left">Offer Name</th>
                <th className="border p-3 text-left">Type</th>
                <th className="border p-3 text-left">Category / Book</th>
                <th className="border p-3 text-left">Discount</th>
                <th className="border p-3 text-left">Start Date</th>
                <th className="border p-3 text-left">End Date</th>
                <th className="border p-3 text-left">Status</th>
                <th className="border p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {offers.map((offer) => {
                const target =
                  offer.offer_type === "CATEGORY"
                    ? offer.category_name ||
                      categories.find(
                        (c) => c.id === offer.category
                      )?.name
                    : offer.book_title ||
                      books.find(
                        (b) => b.id === offer.book
                      )?.title;

                return (
                  <tr key={offer.id} className="border-t">
                    <td className="border p-3 font-medium">
                      {offer.name}
                    </td>

                    <td className="border p-3">
                      {offer.offer_type === "CATEGORY"
                        ? "Category"
                        : "Product"}
                    </td>

                    <td className="border p-3">
                      {target || "-"}
                    </td>

                    <td className="border p-3">
                      {offer.discount_type === "PERCENTAGE"
                        ? `${offer.discount_value}%`
                        : `₹${offer.discount_value}`}
                    </td>

                    <td className="border p-3">
                      {new Date(offer.start_date).toLocaleString()}
                    </td>

                    <td className="border p-3">
                      {new Date(offer.end_date).toLocaleString()}
                    </td>

                    <td className="border p-3">
                      <span
                        className={
                          offer.is_active
                            ? "font-medium text-green-700"
                            : "text-gray-500"
                        }
                      >
                        {offer.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="border p-3">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(offer)}
                          className="font-medium text-green-700 hover:text-green-900"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStatus(offer)}
                          className="font-medium text-blue-700 hover:text-blue-900"
                        >
                          {offer.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(offer)}
                          className="font-medium text-red-700 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-sm text-gray-500">
        Showing {offers.length} offers
      </p>
    </div>
  );
}

export default OffersManagement;
