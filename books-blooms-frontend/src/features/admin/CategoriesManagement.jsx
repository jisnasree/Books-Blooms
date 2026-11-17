import { useEffect, useState } from "react";
import { CATALOG_CATEGORIES_URL } from "../../constants";

function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [originalCategoryName, setOriginalCategoryName] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [pageSize] = useState(10);

  const totalPages = Math.ceil(totalCategories / pageSize);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const params = new URLSearchParams();
        params.set("page", currentPage);
        params.set("page_size", pageSize);

        const response = await fetch(
          `${CATALOG_CATEGORIES_URL}?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch categories (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        if (data.results) {
          setCategories(data.results);
          setTotalCategories(data.count);
        } else if (Array.isArray(data)) {
          setCategories(data);
          setTotalCategories(data.length);
        } else {
          throw new Error("The categories response was not valid.");
        }
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [currentPage, pageSize]);

  async function handleAddCategory(event) {
    event.preventDefault();
    setActionError("");

    const name = categoryName.trim();
    if (!name) {
      setActionError("Category name is required.");
      return;
    }

    try {
      const response = await fetch(CATALOG_CATEGORIES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${sessionStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        if (!response.ok) {
          const data = await response.json();

          throw new Error(
            data.name?.[0] ||
            data.detail ||
            "Failed to add category."
          );
        }
      }

      const newCategory = await response.json();

      setCategories((previousCategories) =>
        [...previousCategories, newCategory].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setCategoryName("");
      setShowForm(false);
    } catch (requestError) {
      setActionError(requestError.message);
    }
  }

  async function handleEditCategory(event) {
    event.preventDefault();
    setActionError("");

    const name = editedCategoryName.trim();
    if (!name) {
      setActionError("Category name is required.");
      return;
    }

    try {
      const response = await fetch(
        `${CATALOG_CATEGORIES_URL}${editingCategoryId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${sessionStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({ name }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update category (HTTP ${response.status}).`
        );
      }

      const updatedCategory = await response.json();

      setCategories((previousCategories) =>
        previousCategories
          .map((category) =>
            category.id === updatedCategory.id ? updatedCategory : category
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingCategoryId(null);
      setEditedCategoryName("");
    } catch (requestError) {
      setActionError(requestError.message);
    }
  }

  async function handleDeleteCategory(category) {
    if (!window.confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    setActionError("");
    setDeletingCategoryId(category.id);

    try {
      const response = await fetch(
        `${CATALOG_CATEGORIES_URL}${category.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${sessionStorage.getItem("authToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete category (HTTP ${response.status}).`
        );
      }

      setCategories((previousCategories) =>
        previousCategories.filter((item) => item.id !== category.id)
      );
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setDeletingCategoryId(null);
    }
  }

  if (loading) {
    return <p className="p-6">Loading categories...</p>;
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
      <h1 className="mb-6 text-2xl font-semibold">Category Management</h1>

      {showForm ? (
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setCategoryName("");
            setActionError("");
          }}
          className="mb-4 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setActionError("");
          }}
          className="mb-4 rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800 cursor-pointer"
        >
          Add Category
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleAddCategory}
          className="mb-6 flex max-w-lg flex-wrap items-start gap-3"
        >
          <input
            type="text"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Enter category name"
            aria-label="Category name"
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />

          <button
            type="submit"
            className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-green-800"
          >
            Save Category
          </button>
        </form>
      )}

      {actionError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      {categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 bg-white text-sm">
            <thead className="bg-[#203746] text-white">
              <tr>
                <th scope="col" className="border p-3 text-left">ID</th>
                <th scope="col" className="border p-3 text-left">Category Name</th>
                <th scope="col" className="border p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t">
                  <td className="border p-3">{category.id}</td>
                  <td className="border p-3">
                    {editingCategoryId === category.id ? (
                      <form
                        onSubmit={handleEditCategory}
                        className="flex flex-wrap gap-2"
                      >
                        <input
                          type="text"
                          value={editedCategoryName}
                          onChange={(event) =>
                            setEditedCategoryName(event.target.value)
                          }
                          aria-label="Edit category name"
                          required
                          className="min-w-0 rounded-lg border border-gray-300 px-3 py-2"
                        />
                        <button
                          type="submit"
                          disabled={editedCategoryName === originalCategoryName || !editedCategoryName.trim()}
                          className="rounded-lg bg-green-700 px-3 py-2 text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(null);
                            setEditedCategoryName("");
                            setActionError("");
                          }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      category.name
                    )}
                  </td>
                  <td className="border p-3">
                    {editingCategoryId !== category.id && (
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setEditedCategoryName(category.name);
                            setOriginalCategoryName(category.name);
                            setActionError("");
                          }}
                          className="font-medium text-green-700 hover:text-green-900 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category)}
                          disabled={deletingCategoryId === category.id}
                          className="font-medium text-red-700 hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                          {deletingCategoryId === category.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination Controls */}
      {totalCategories > 0 && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Result count */}
          <p className="text-sm text-gray-500">
            Showing{" "}
            {totalCategories === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {" "}–{" "}
            {Math.min(currentPage * pageSize, totalCategories)}
            {" "}of {totalCategories} categories
          </p>

          {/* Previous and Next buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page - 1)}
              disabled={currentPage === 1 || loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={currentPage === totalPages || loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesManagement;