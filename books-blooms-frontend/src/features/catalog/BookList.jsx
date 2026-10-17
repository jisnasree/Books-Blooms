
import { useEffect, useState } from "react";
import { CATALOG_BOOKS_URL } from "../../../constants";

function BookList() {
  const [books, setBooks] = useState([]);
  useEffect(() => {
    fetch(CATALOG_BOOKS_URL)
      .then((response) => response.json())
      .then((data) => {
        setBooks(data);
      });
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 border-b border-gray-200">
      <h2 className="text-3xl font-bold text-[#45332F]">
        Featured Books
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6 text-center">
        {books.map((book) => (
          <div
            key={book.id}
            className="rounded-xl border border-rose-100 p-4"
          >
            {book.cover_url && (
              <img
                src={book.cover_url}
                alt={book.title}
                className="mb-4 h-64 w-full rounded-lg object-contain mx-auto"
              />
            )}

            {/* Book name */}
            <h3 className="text-lg font-semibold text-[#45332F]">
              {book.title}
            </h3>

            {/* Author name */}
            <p className="mt-1 text-sm text-gray-500">
              {book.author_name}
            </p>

            {/* Price */}
            <p className="mt-3 font-semibold text-green-800">
              {book.physical_variants?.[0]?.currency}{" "}
              {book.physical_variants?.[0]?.price}
            </p>

            {/* Rating */}
            {/* Rating */}
            <div className="mt-2 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={
                    star <= Math.round(Number(book.rating))
                      ? "text-amber-400"
                      : "text-gray-300"
                  }
                >
                  ★
                </span>
              ))}
              <span className="ml-1 text-sm text-gray-500">
                ({book.rating})
              </span>
            </div>
          </div>
        ))}
      </div>


    </section>
  );
}
export default BookList




