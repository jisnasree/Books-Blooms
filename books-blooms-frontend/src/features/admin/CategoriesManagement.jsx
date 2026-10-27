
import { useEffect, useState } from "react";
import { CATALOG_CATEGORIES_URL } from "../../constants";

function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);


  async function handleAddCategory(e) {
    e.preventDefault();

    try {
      const response = await fetch(CATALOG_CATEGORIES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${sessionStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          name: categoryName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add category");
      }

      const newCategory = await response.json();

      setCategories((previousCategories) =>
        [...previousCategories, newCategory].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setCategoryName("");
      setShowForm(false);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(CATALOG_CATEGORIES_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return <p>Loading categories...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">
        Category Management
      </h1>

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 rounded bg-green-700 px-4 py-2 text-white"
      >
        Add Category
      </button>

      {showForm && (
        <form
          onSubmit={handleAddCategory}
          className="mb-6 flex gap-3"
        >
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Enter category name"
            required
            className="rounded border p-2"
          />

          <button
            type="submit"
            className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-rose-800"
          >
            Save Category
          </button>
        </form>
      )}

      {categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-200">
          <thead className="bg-[#203746] text-white">
            <tr>
              <th className="border p-3 text-left">ID</th>
              <th className="border p-3 text-left">Category Name</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="border p-3">{category.id}</td>
                <td className="border p-3">{category.name}</td>
              </tr>
            ))}
          </tbody>
        </table>

      )}
    </div>
  );
}

export default CategoriesManagement;
