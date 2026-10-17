//Import React Hooks for managing state and running side effects.
import { useEffect, useState } from "react";

// Import API URLs used to fetch and save books and authors.
import { CATALOG_BOOKS_URL } from "../../constants";
import { CATALOG_AUTHORS_LIST_URL } from "../../constants";

function BooksManagement() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    cover_url: "",
    rating: "",
    featured: false,
  });
  const [authors, setAuthors] = useState([]);

  // Fetch all books from the Django API
  useEffect(() => {
    async function fetchBooks() {
      const token = sessionStorage.getItem("authToken");

      if (!token) {
        setError("Please log in to access books.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(CATALOG_BOOKS_URL, {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load books (${response.status})`
          );
        }

        const data = await response.json();

        // Supports either a plain array or DRF paginated results.
        setBooks(Array.isArray(data) ? data : data.results ?? []);
      } catch (err) {
        setError(err.message || "Unable to load books.");
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  // Filter books by title or author
  const filteredBooks = books.filter((book) => {
    const search = searchTerm.trim().toLowerCase();
    return (
      book.title?.toLowerCase().includes(search) ||
      book.author_name?.toLowerCase().includes(search)
    );
  });

  // Get Authors list
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const token = sessionStorage.getItem("authToken");

        const response = await fetch(
          CATALOG_AUTHORS_LIST_URL,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch authors.");
        }

        const data = await response.json();

        setAuthors(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        ``
        setError(err.message || "Failed to load authors.");
      }
    };

    fetchAuthors();
  }, []);

  if (loading) {
    return <p className="p-6">Loading books...</p>;
  }

  if (error) {
    return (
      <p className="p-6 text-red-600" role="alert">
        {error}
      </p>
    );
  }

  //Authors dropdown 
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  //send bookdetails to Django and save in the database
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const token = sessionStorage.getItem("authToken");

      const response = await fetch(CATALOG_BOOKS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          author: Number(formData.author),
          description: formData.description,
          cover_url: formData.cover_url,
          rating: formData.rating === "" ? null : Number(formData.rating),
          featured: formData.featured,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Object.values(data).flat().join(" ") ||
          "Failed to add book."
        );
      }

      // Add the newly created book to the existing list
      const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((previousData) => ({
          ...previousData,
          [name]: type === "checkbox" ? checked : value,
        }));
      };

      // Close the popup and reset the form
      handleCloseForm();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);

    setFormData({
      title: "",
      author: "",
      description: "",
      cover_url: "",
      rating: "",
      featured: false,
    });
  };
  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Book Management
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-green-800 px-5 py-3 text-sm font-medium text-white hover:bg-green-900"
        >
          + Add Book
        </button>
      </div>


      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
            {/* Popup Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Add New Book
              </h2>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-2xl text-gray-500 hover:text-gray-800"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            {/* Popup Form */}
            <form
              onSubmit={handleSubmit}
              className="max-h-[75vh] space-y-4 overflow-y-auto p-6"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Book Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Enter book title"
                />
              </div>

              <div>
                <label
                  htmlFor="author"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Author *
                </label>

                <select
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                >
                  <option value="">Select an author</option>

                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Enter book description"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  name="cover_url"
                  value={formData.cover_url}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Enter cover image URL"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Rating
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="For example, 4.5"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} />
                Featured book
              </label>

              {/* Popup Footer */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-900"
                >
                  Save Book
                </button>


              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search books */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by book title or author..."
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />

          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="7" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m16 16 4 4"
            />
          </svg>
        </div>
      </div>

      {/* Books table */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  No books match your search.
                </td>
              </tr>
            ) : (
              filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium text-gray-800">
                    {book.title}
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    {book.author_name || "—"}
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    {book.physical_variants
                      ?.map((variant) => variant.format)
                      .join(", ") || "—"}
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    {book.physical_variants
                      ?.map(
                        (variant) =>
                          `${variant.currency} ${Number(variant.price).toFixed(2)}`
                      )
                      .join(", ") || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className="mr-3 text-blue-700 hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>


        </table>
      </div>
      {/* Result count */}
      <p className="mt-4 text-sm text-gray-500">
        Showing {filteredBooks.length} of {books.length} books
      </p>
    </div>
  );
}

export default BooksManagement;
