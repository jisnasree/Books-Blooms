
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATALOG_BOOKS_URL } from "../../constants";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

function BookCatalog() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
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

    if (loading) {
        return <p className="py-12 text-center">Loading books...</p>;
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

                {books.length === 0 ? (
                    <p className="mt-8 text-gray-500">
                        No books available right now.
                    </p>
                ) : (
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {books.map((book) => (
                            <div
                                key={book.id}
                                onClick={() => navigate(`/books/${book.id}`)}
                                className="cursor-pointer rounded-xl border border-rose-100 p-4 text-center transition-shadow hover:shadow-lg"
                            >
                                {book.cover_url && (
                                    <img
                                        src={book.cover_url}
                                        alt={book.title}
                                        className="mx-auto mb-4 h-64 w-full rounded-lg object-contain"
                                    />
                                )}

                                <h2 className="text-lg font-semibold text-[#45332F]">
                                    {book.title}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    {book.author_name}
                                </p>

                                <p className="mt-3 font-semibold text-green-800">
                                    {book.physical_variants?.[0]
                                        ? `${book.physical_variants[0].currency} ${book.physical_variants[0].price}`
                                        : "Price unavailable"}
                                </p>

                                <div className="mt-2">
                                    <span className="text-amber-400">
                                        {"★".repeat(
                                            Math.max(
                                                0,
                                                Math.min(
                                                    5,
                                                    Math.round(Number(book.rating) || 0)
                                                )
                                            )
                                        )}
                                    </span>
                                    <span className="text-gray-300">
                                        {"★".repeat(
                                            5 -
                                            Math.max(
                                                0,
                                                Math.min(
                                                    5,
                                                    Math.round(Number(book.rating) || 0)
                                                )
                                            )
                                        )}
                                    </span>
                                    <span className="ml-1 text-sm text-gray-500">
                                        ({book.rating ?? "No rating"})
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
            <Footer />
        </>
    );
}

export default BookCatalog;
