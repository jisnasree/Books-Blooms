import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    CATALOG_BOOKS_URL,
    CATALOG_CATEGORIES_URL,
} from "../../constants";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const PAGE_SIZE = 12;

function BookCatalog() {
    const location = useLocation();
    const navigate = useNavigate();

    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categoryError, setCategoryError] = useState("");

    const [totalBooks, setTotalBooks] = useState(0);
    const [page, setPage] = useState(1);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(
        new URLSearchParams(location.search).get("category") || ""
    );
    const [selectedPrice, setSelectedPrice] = useState("");
    const [selectedFormat, setSelectedFormat] = useState("");

    const totalPages = Math.ceil(totalBooks / PAGE_SIZE);

    // Update the category when the URL changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        setSelectedCategory(params.get("category") || "");
        setPage(1);
    }, [location.search]);

    // Fetch books using query parameters
    useEffect(() => {
        async function fetchBooks() {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams();

                params.set("page", page);
                params.set("page_size", PAGE_SIZE);

                if (searchTerm.trim()) {
                    params.set("search", searchTerm.trim());
                }

                if (selectedCategory) {
                    params.set("category", selectedCategory);
                }

                if (selectedPrice) {
                    params.set("price", selectedPrice);
                }

                if (selectedFormat) {
                    params.set("format", selectedFormat);
                }

                const response = await fetch(
                    `${CATALOG_BOOKS_URL}?${params.toString()}`
                );

                if (!response.ok) {
                    throw new Error("Failed to load books.");
                }

                const data = await response.json();

                setBooks(data.results);
                setTotalBooks(data.count);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        fetchBooks();
    }, [
        page,
        searchTerm,
        selectedCategory,
        selectedPrice,
        selectedFormat,
    ]);

    // Fetch categories
    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch(CATALOG_CATEGORIES_URL);

                if (!response.ok) {
                    throw new Error("Failed to load categories.");
                }

                const data = await response.json();

                setCategories(
                    Array.isArray(data) ? data : data.results
                );
            } catch (error) {
                setCategoryError(error.message);
            }
        }

        fetchCategories();
    }, []);

    return (
        <>
            <Header />

            <main className="min-h-screen bg-slate-50">
                <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
                    <div className="mb-9 rounded-3xl bg-gradient-to-br from-orange-50 via-white to-amber-50 px-6 py-8 shadow-sm ring-1 ring-orange-100 sm:px-10 sm:py-10">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700 sm:text-sm">
                            Find your next read
                        </p>

                        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                            <div>
                                <h3 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                                    Shop all books
                                </h3>
                                <p className="mt-3 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                                    Discover a story you will want to return to.
                                </p>
                            </div>

                            {/* <p className="rounded-full border border-orange-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600">
                                {totalBooks} {totalBooks === 1 ? "book" : "books"}
                            </p> */}
                        </div>

                        <div className="relative mt-7 max-w-2xl">
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                            >
                                <circle
                                    cx="11"
                                    cy="11"
                                    r="7"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                />
                                <path
                                    d="m16 16 4 4"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                />
                            </svg>

                            <input
                                type="search"
                                placeholder="Search by book title or author..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-4">
                        {/* Filters */}
                        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-1">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Filters
                                </h2>
                                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                                    Refine
                                </span>
                            </div>

                            {/* Category filter */}
                            <div className="mt-6">
                                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                                    Category
                                </h3>

                                <select
                                    value={selectedCategory}
                                    onChange={(event) => {
                                        setSelectedCategory(event.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                >
                                    <option value="">All Categories</option>

                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>

                                {categoryError && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {categoryError}
                                    </p>
                                )}
                            </div>

                            {/* Price filter */}
                            <div className="mt-6 border-t border-slate-100 pt-5">
                                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                                    Price
                                </h3>

                                {[
                                    { label: "All prices", value: "" },
                                    {
                                        label: "Under ₹1,000",
                                        value: "under1000",
                                    },
                                    {
                                        label: "₹1,000–₹3,000",
                                        value: "1000to3000",
                                    },
                                    {
                                        label: "Over ₹3,000",
                                        value: "over3000",
                                    },
                                ].map((price) => (
                                    <label
                                        key={price.value || "all-prices"}
                                        className="mb-3 flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 last:mb-0"
                                    >
                                        <input
                                            type="radio"
                                            name="price"
                                            value={price.value}
                                            checked={
                                                selectedPrice === price.value
                                            }
                                            onChange={(event) => {
                                                setSelectedPrice(
                                                    event.target.value
                                                );
                                                setPage(1);
                                            }}
                                            className="h-4 w-4 accent-orange-600"
                                        />
                                        {price.label}
                                    </label>
                                ))}
                            </div>

                            {/* Format filter */}
                            <div className="mt-6 border-t border-slate-100 pt-5">
                                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                                    Format
                                </h3>

                                {[
                                    { label: "All formats", value: "" },
                                    {
                                        label: "Paperback",
                                        value: "Paperback",
                                    },
                                    {
                                        label: "Hardcover",
                                        value: "Hardcover",
                                    },
                                ].map((format) => (
                                    <label
                                        key={format.value || "all-formats"}
                                        className="mb-3 flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 last:mb-0"
                                    >
                                        <input
                                            type="radio"
                                            name="format"
                                            value={format.value}
                                            checked={
                                                selectedFormat === format.value
                                            }
                                            onChange={(event) => {
                                                setSelectedFormat(
                                                    event.target.value
                                                );
                                                setPage(1);
                                            }}
                                            className="h-4 w-4 accent-orange-600"
                                        />
                                        {format.label}
                                    </label>
                                ))}
                            </div>
                        </aside>

                        {/* Books */}
                        <div className="md:col-span-3">
                            {loading ? (
                                <div
                                    className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm"
                                    role="status"
                                >
                                    Loading books...
                                </div>
                            ) : error ? (
                                <div
                                    className="rounded-2xl border border-red-100 bg-white px-6 py-12 text-center text-red-600 shadow-sm"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            ) : books.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                                    <p className="font-semibold text-slate-800">
                                        No books found
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Try another title or adjust your filters.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {books.map((book) => {
                                        const rating = Math.max(
                                            0,
                                            Math.min(
                                                5,
                                                Math.round(
                                                    Number(book.rating) || 0
                                                )
                                            )
                                        );

                                        const variant =
                                            book.physical_variants?.[0];

                                        return (
                                            <article
                                                key={book.id}
                                                onClick={() =>
                                                    navigate(`/books/${book.id}`)
                                                }
                                                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
                                            >
                                                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-4">
                                                    {book.cover_url ? (
                                                        <img
                                                            src={book.cover_url}
                                                            alt={book.title}
                                                            className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-slate-400">
                                                            Cover unavailable
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="px-1 pb-2 pt-4">
                                                    {variant?.format && (
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                                                            {variant.format}
                                                        </p>
                                                    )}

                                                    <h2 className="mt-1 line-clamp-2 min-h-12 text-left text-base font-semibold leading-6 text-slate-900">
                                                        {book.title}
                                                    </h2>

                                                    <p className="mt-1 truncate text-left text-sm text-slate-500">
                                                        {book.author_name}
                                                    </p>

                                                    <div className="mt-3 flex items-center justify-between gap-2">
                                                        <p className="font-bold text-slate-900">
                                                            {variant
                                                                ? `${variant.currency} ${variant.price}`
                                                                : "Price unavailable"}
                                                        </p>

                                                        <div className="flex shrink-0 items-center text-sm">
                                                            <span className="text-amber-400">
                                                                {"★".repeat(rating)}
                                                            </span>
                                                            <span className="text-slate-200">
                                                                {"★".repeat(5 - rating)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {!loading && !error && totalBooks > 0 && (
                                <div className="mt-7 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row">
                                    <p className="text-sm text-slate-500">
                                        Showing{" "}
                                        {(page - 1) * PAGE_SIZE + 1}–
                                        {Math.min(
                                            page * PAGE_SIZE,
                                            totalBooks
                                        )}{" "}
                                        of {totalBooks} books
                                    </p>

                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPage(page - 1)
                                                }
                                                disabled={page === 1}
                                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Previous
                                            </button>

                                            <span className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-800">
                                                Page {page} of {totalPages}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPage(page + 1)
                                                }
                                                disabled={page === totalPages}
                                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}

export default BookCatalog;