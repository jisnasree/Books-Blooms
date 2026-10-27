//Import React Hooks for managing state and running side effects.
import { useEffect, useState } from "react";

// Import API URLs used to fetch and save books and authors.
import { CATALOG_BOOKS_URL, CATALOG_AUTHORS_URL, CATALOG_CATEGORIES_URL } from "../../constants";
import BooksTable from "./BooksTable";
import BookForm from "./BookForm";

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
    category: "",
    format: "Paperback",
    price: "",
    currency: "INR",
    stock_quantity: "",
  });
  const [editingBook, setEditingBook] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);

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
          CATALOG_AUTHORS_URL,
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
        setError(err.message || "Failed to load authors.");
      }
    };

    fetchAuthors();
  }, []);



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

      // Choose POST for adding or PATCH for updating.
      const isEditing = Boolean(editingBook);

      const url = isEditing
        ? `${CATALOG_BOOKS_URL}${editingBook.id}/`
        : CATALOG_BOOKS_URL;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
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
          format: formData.format,
          price: Number(formData.price),
          currency: formData.currency,
          stock_quantity: Number(formData.stock_quantity),
          category_ids: formData.category ? [Number(formData.category)] : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Object.values(data).flat().join(" ") ||
          "Failed to save book."
        );
      }

      if (isEditing) {
        // Replace the old book with the updated book.
        setBooks((previousBooks) =>
          previousBooks.map((book) =>
            book.id === editingBook.id ? data : book
          )
        );
      } else {
        // Add the new book to the list.
        setBooks((previousBooks) => [...previousBooks, data]);
      }

      setEditingBook(null);
      handleCloseForm();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  };


  const handleDelete = async (book) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const token = sessionStorage.getItem("authToken");

      const response = await fetch(
        `${CATALOG_BOOKS_URL}${book.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          Object.values(data).flat().join(" ") ||
          "Failed to delete book."
        );
      }

      // Remove the deleted book from the table.
      setBooks((previousBooks) =>
        previousBooks.filter((item) => item.id !== book.id)
      );
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
      category: "",
      format: "Paperback",
      price: "",
      currency: "INR",
      stock_quantity: "",
    });
  };


  useEffect(() => {
    async function fetchCategories() {
      try {
        const token = sessionStorage.getItem("authToken");

        const response = await fetch(CATALOG_CATEGORIES_URL, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch categories.");
        }

        const data = await response.json();
        setCategories(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        setError(err.message || "Failed to load categories.");
      }
    }

    fetchCategories();
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
        <BookForm
          formData={formData}
          authors={authors}
          categories={categories}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          editingBook={editingBook}
        />
      )}


      {/* Search books */}
      <div className="mb-6 flex w-full max-w-3xl items-center gap-4">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by book title or author..."
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />

          <svg
            aria-hidden="true"
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

        <button
          type="button"
          onClick={() => setSearchTerm("")}
          disabled={!searchTerm}
          className="shrink-0 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>



      {/* Books table */}
      <BooksTable
        books={filteredBooks}
        onEdit={(book) => {
          setEditingBook(book);
          setFormData({
            title: book.title || "",
            author: String(book.author || book.author_id || ""),
            description: book.description || "",
            cover_url: book.cover_url || "",
            rating: book.rating ?? "",
            featured: book.featured ?? false,
            category: book.categories?.[0]?.id
              ? String(book.categories[0].id)
              : "",
            format: book.physical_variants?.[0]?.format || "Paperback",
            price: book.physical_variants?.[0]?.price || "",
            currency: book.physical_variants?.[0]?.currency || "INR",
            stock_quantity:
              book.physical_variants?.[0]?.stock_quantity ?? "",
          });
          setShowForm(true);
        }}
        onDelete={handleDelete}
      />
      {/* Result count */}
      <p className="mt-4 text-sm text-gray-500">
        Showing {filteredBooks.length} of {books.length} books
      </p>
    </div>
  );
}

export default BooksManagement;
