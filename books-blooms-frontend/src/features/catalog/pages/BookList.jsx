
import { useEffect, useState } from "react";

function BookList() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/books/")
      .then((response) => response.json())
      .then((data) => {
        setBooks(data);
      });
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12">
      <h2 className="text-3xl font-bold text-[#45332F]">
        Explore Our Books
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {books.map((book) => (
          <div key={book.id} className="rounded-xl border border-rose-100 p-4">
            {book.cover_url && (
              <img
                src={book.cover_url}
                alt={book.title}
                className="mb-4 h-64 w-full rounded-lg object-cover"
              />
            )}
            <h3 className="text-lg font-semibold text-[#45332F]">
              {book.title}
              {book.author_name}
              <p className="mt-3 font-semibold text-green-800">
                {book.physical_variants[0]?.currency}{" "}
                {book.physical_variants[0]?.price}
              </p>

            </h3>
          </div>
        ))}
      </div>

    </section>
  );
}

export default BookList;

