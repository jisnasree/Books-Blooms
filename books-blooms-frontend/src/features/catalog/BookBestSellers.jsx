import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATALOG_BOOKS_URL } from "../../constants";

function BookBestSellers() {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    fetch(CATALOG_BOOKS_URL)
      .then((response) => response.json())
      .then((data) => {
        setBooks(data.results.filter((book) => book.featured));
      });
  }, []);

  const visibleBooks = books.slice(startIndex, startIndex + 4);

  return (
    <section className="mx-auto w-full max-w-7xl border-b border-slate-200 px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-br from-orange-50 via-white to-rose-50 p-5 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">
              Readers’ favorites
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Bestsellers
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
              Find your next favorite among the books readers love.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setStartIndex((prev) => Math.max(prev - 1, 0))
              }
              disabled={startIndex === 0}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">←</span>
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setStartIndex((prev) =>
                  Math.min(prev + 1, Math.max(books.length - 4, 0))
                )
              }
              disabled={startIndex >= Math.max(books.length - 4, 0)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visibleBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => navigate(`/books/${book.id}`)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
            >
              <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-4">
                {book.physical_variants?.[0] && (
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {/* {book.physical_variants[0].format && (
      <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
        {book.physical_variants[0].format}
      </span>
    )} */}

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${book.physical_variants[0].is_available
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {book.physical_variants[0].is_available ? "In stock" : "Unavailable"}
                    </span>
                  </div>
                )}

                {book.cover_url && (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                  />
                )}
              </div>

              <div className="pt-4 text-center">
                {book.physical_variants?.[0]?.format && (
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-orange-700">
                    {book.physical_variants[0].format}
                  </p>
                )}

                <h3 className="line-clamp-2 min-h-14 text-base font-bold leading-7 text-slate-900 transition group-hover:text-orange-800">
                  {book.title}
                </h3>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {book.author_name}
                </p>

                <p className="mt-4 text-lg font-bold text-orange-700">
                  {book.physical_variants?.[0]?.currency}{" "}
                  {book.physical_variants?.[0]?.price}
                </p>

                <div className="mt-2 flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= Math.round(Number(book.rating))
                          ? "text-amber-400"
                          : "text-slate-200"
                      }
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-1 text-sm text-slate-500">
                    ({book.rating})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BookBestSellers;