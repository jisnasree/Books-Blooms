import { useEffect, useState } from "react";
import { ADMIN_COUPONS_URL } from "../../constants";

const emptyForm = {
  code: "",
  discount_percent: "",
  is_active: true,
  expires_at: "",
};

function CouponsManagement() {
  const [coupons, setCoupons] = useState([]);
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

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const response = await fetch(ADMIN_COUPONS_URL, { headers });
        if (!response.ok) throw new Error("Failed to load coupons.");
        const data = await response.json();
        setCoupons(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCoupons();
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
    setShowForm(true);
    setActionError("");
  }

  function openEdit(coupon) {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      is_active: coupon.is_active,
      // datetime-local needs "YYYY-MM-DDTHH:MM"
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "",
    });
    setShowForm(true);
    setActionError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setActionError("");

    const payload = {
      code: formData.code.trim().toUpperCase(),
      discount_percent: Number(formData.discount_percent),
      is_active: formData.is_active,
      expires_at: formData.expires_at || null,
    };

    if (!payload.code) {
      setActionError("Coupon code is required.");
      return;
    }
    if (!payload.discount_percent || payload.discount_percent < 1 || payload.discount_percent > 100) {
      setActionError("Discount must be between 1 and 100.");
      return;
    }

    const isEditing = Boolean(editingId);
    const url = isEditing ? `${ADMIN_COUPONS_URL}${editingId}/` : ADMIN_COUPONS_URL;

    try {
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Object.values(data).flat().join(" ") || "Failed to save coupon."
        );
      }

      if (isEditing) {
        setCoupons((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      } else {
        setCoupons((prev) => [...prev, data]);
      }

      setShowForm(false);
      setFormData(emptyForm);
      setEditingId(null);
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDelete(coupon) {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    setActionError("");

    try {
      const response = await fetch(`${ADMIN_COUPONS_URL}${coupon.id}/`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) throw new Error("Failed to delete coupon.");

      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
    } catch (err) {
      setActionError(err.message);
    }
  }

  if (loading) return <p className="p-6">Loading coupons...</p>;
  if (error) return <p className="p-6 text-red-600" role="alert">{error}</p>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Coupon Management</h1>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
        >
          + Add Coupon
        </button>
      </div>

      {actionError && (
        <p className="mb-3 text-sm text-red-600" role="alert">{actionError}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 flex max-w-2xl flex-wrap items-end gap-3 rounded-lg border bg-white p-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="SAVE10"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 uppercase"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Discount %</label>
            <input
              type="number"
              name="discount_percent"
              value={formData.discount_percent}
              onChange={handleChange}
              min="1"
              max="100"
              required
              className="w-28 rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Expires at (optional)</label>
            <input
              type="datetime-local"
              name="expires_at"
              value={formData.expires_at}
              onChange={handleChange}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 accent-green-700"
            />
            Active
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-green-800"
            >
              {editingId ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); setActionError(""); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {coupons.length === 0 ? (
        <p>No coupons yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 bg-white text-sm">
            <thead className="bg-[#203746] text-white">
              <tr>
                <th className="border p-3 text-left">Code</th>
                <th className="border p-3 text-left">Discount</th>
                <th className="border p-3 text-left">Status</th>
                <th className="border p-3 text-left">Expires</th>
                <th className="border p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t">
                  <td className="border p-3 font-medium">{coupon.code}</td>
                  <td className="border p-3">{coupon.discount_percent}%</td>
                  <td className="border p-3">
                    <span className={coupon.is_active ? "text-green-700" : "text-gray-500"}>
                      {coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="border p-3">
                    {coupon.expires_at
                      ? new Date(coupon.expires_at).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="border p-3">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => openEdit(coupon)}
                        className="font-medium text-green-700 hover:text-green-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon)}
                        className="font-medium text-red-700 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CouponsManagement;