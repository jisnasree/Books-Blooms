import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATALOG_BOOKS_URL, CATALOG_CATEGORIES_URL } from "../../constants";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

function BookCatalog() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPrice, setSelectedPrice] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedFormat, setSelectedFormat] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        fetch(CATALOG_BOOKS_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch books");
                }
                return response.json();
            })
            .then((data) => {
                setBooks(data);
            })
            .catch((error) => {
                console.error("Error fetching books:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetch(CATALOG_CATEGORIES_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch categories");
                }
                return response.json();
            })
            .then((data) => {
                setCategories(data);
            })
            .catch((error) => {
                console.error("Error fetching categories:", error);
            });

    }, []);

    // Search books by title or author
    const filteredBooks = books.filter((book) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            book.title.toLowerCase().includes(search) ||
            book.author_name.toLowerCase().includes(search);

        const matchesCategory =
            !selectedCategory ||
            (book.categories || []).some(
                (category) => String(category.id) === String(selectedCategory)
            );

        const price = Number(book.physical_variants?.[0]?.price);
        const matchesPrice =
            !selectedPrice ||
            (selectedPrice === "under1000" && price < 1000) ||
            (selectedPrice === "1000to3000" &&
                price >= 1000 &&
                price <= 3000) ||
            (selectedPrice === "over3000" && price > 3000);

        const matchesFormat =
            !selectedFormat ||
            (book.physical_variants || []).some(
                (variant) =>
                    variant.format?.toLowerCase() ===
                    selectedFormat.toLowerCase()
            );

        return matchesSearch && matchesCategory && matchesPrice && matchesFormat;
    });

    if (loading) {
        return (
            <>
                <Header />
                <p className="py-12 text-center">Loading books...</p>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <section className="mx-auto w-full max-w-7xl px-6 py-12">
                <h1 className="text-3xl font-bold text-[#45332F]">
                    Shop All Books
                </h1>

                <p className="mt-2 text-gray-600">
                    Discover your next favorite read.
                </p>

                {/* Search input */}
                <div className="mt-6">
                    <input
                        type="text"
                        placeholder="Search by book title or author..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-lg border border-gray-100 bg-white px-4 py-3 text-[#45332F] outline-none sm:max-w-md"
                    />
                </div>
                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-4">
                    <aside className="rounded-xl border border-gray-100 bg-white p-5 md:col-span-1">
                        <h2 className="text-xl font-semibold text-[#45332F]">
                            Filters
                        </h2>
                        {/* Category filter */}
                        <div className="mt-6">
                            <h3 className="mb-3 font-semibold text-[#45332F]">
                                Category
                            </h3>

                            <select
                                value={selectedCategory}
                                onChange={(event) => setSelectedCategory(event.target.value)}
                                className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-[#45332F] focus:border-green-800 focus:outline-none"
                            >
                                <option value="">All Categories</option>

                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-2 text-sm text-gray-500">
                                Selected category ID: {selectedCategory || "All"}
                            </p>

                        </div>

                        {/* Price filter */}
                        <div className="mt-6 border-t border-rose-100 pt-5">
                            <h3 className="mb-3 font-semibold text-[#45332F]">
                                Price
                            </h3>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="radio"
                                        name="price"
                                        value=""
                                        checked={selectedPrice === ""}
                                        onChange={(event) => setSelectedPrice(event.target.value)}
                                        className="accent-green-800"
                                    />
                                    All prices
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="radio"
                                        name="price"
                                        value="under1000"
                                        checked={selectedPrice === "under1000"}
                                        onChange={(event) => setSelectedPrice(event.target.value)}
                                        className="accent-green-800"
                                    />
                                    Under ₹1,000
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="radio"
                                        name="price"
                                        value="1000to3000"
                                        checked={selectedPrice === "1000to3000"}
                                        onChange={(event) => setSelectedPrice(event.target.value)}
                                        className="accent-green-800"
                                    />
                                    ₹1,000–₹3,000
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="radio"
                                        name="price"
                                        value="over3000"
                                        checked={selectedPrice === "over3000"}
                                        onChange={(event) => setSelectedPrice(event.target.value)}
                                        className="accent-green-800"
                                    />
                                    Over ₹3,000
                                </label>
                            </div>
                        </div>

                        {/* Format filter */}
                        <div className="mt-6 border-t border-rose-100 pt-5">
                            <h3 className="mb-3 font-semibold text-[#45332F]">
                                Format
                            </h3>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="radio"
                                        name="format"
                                        value=""
                                        checked={selectedFormat === ""}
                                        onChange={(event) => setSelectedFormat(event.target.value)}
                                        className="accent-green-800"
                                    />
                                    All formats
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="radio"
                                        name="format"
                                        value="Paperback"
                                        checked={selectedFormat === "Paperback"}
                                        onChange={(event) => setSelectedFormat(event.target.value)}
                                        className="accent-green-800"
                                    />
                                    Paperback
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="radio"
                                        name="format"
                                        value="Hardcover"
                                        checked={selectedFormat === "Hardcover"}
                                        onChange={(event) => setSelectedFormat(event.target.value)}
                                        className="accent-green-800"
                                    />
                                    Hardcover
                                </label>
                            </div>
                        </div>
                    </aside>

                    <div className="md:col-span-3">
                        {/* Book list and search messages */}
                        {books.length === 0 ? (
                            <p className="mt-8 text-gray-500">
                                No books available right now.
                            </p>
                        ) : filteredBooks.length === 0 ? (
                            <p className="mt-8 text-gray-500">
                                No books found. Try another title or author.
                            </p>
                        ) : (
                            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {filteredBooks.map((book) => {
                                    const rating = Math.max(
                                        0,
                                        Math.min(
                                            5,
                                            Math.round(Number(book.rating) || 0)
                                        )
                                    );

                                    return (
                                        <div
                                            key={book.id}
                                            onClick={() =>
                                                navigate(`/books/${book.id}`)
                                            }
                                            className="cursor-pointer rounded-xl border border-rose-100 p-4 text-center transition-shadow hover:shadow-lg"
                                        >
                                            {book.cover_url && (
                                                <img
                                                    src={book.cover_url}
                                                    alt={book.title}
                                                    className="mx-auto mb-4 h-64 w-full rounded-lg object-contain"
                                                />
                                            )}

                                            {/* Book title */}
                                            <h2 className="text-lg font-semibold text-[#45332F]">
                                                {book.title}
                                            </h2>

                                            {/* Author */}
                                            <p className="mt-1 text-sm text-gray-500">
                                                {book.author_name}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {book.physical_variants?.[0].format}
                                            </p>

                                            {/* Price */}
                                            <p className="mt-3 font-semibold text-green-800">
                                                {book.physical_variants?.[0]
                                                    ? `${book.physical_variants[0].currency} ${book.physical_variants[0].price}`
                                                    : "Price unavailable"}
                                            </p>

                                            {/* Rating */}
                                            <div className="mt-2">
                                                <span className="text-amber-400">
                                                    {"★".repeat(rating)}
                                                </span>

                                                <span className="text-gray-300">
                                                    {"★".repeat(5 - rating)}
                                                </span>

                                                <span className="ml-1 text-sm text-gray-500">
                                                    ({book.rating ?? "No rating"})
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </section>

            <Footer />
        </>
    );
}

export default BookCatalog;
