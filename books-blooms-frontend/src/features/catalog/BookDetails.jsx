
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CATALOG_BOOKS_URL } from "../../constants";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);

  useEffect(() => {
    fetch(`${CATALOG_BOOKS_URL}${id}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Book not found");
        }
        return response.json();
      })
      .then((data) => setBook(data))
      .catch((error) => console.error(error));
  }, [id]);

  if (!book) {
    return <p className="p-8 text-center">Loading book details...</p>;
  }

  const variant = book.physical_variants?.[0];

  return (
    <>
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="flex justify-center rounded-xl bg-[#FBFAF7] p-8">
            {book.cover_url && (
              <img
                src={book.cover_url}
                alt={book.title}
                className="max-h-[500px] w-full object-contain"
              />
            )}
          </div>

          <div className="pt-16">
            <h1 className="text-3xl font-bold text-[#45332F]">
              {book.title}
            </h1>

            <p className="mt-3 text-gray-600">
              By {book.author_name}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-amber-400">★★★★★</span>
              <span className="text-sm text-gray-500">
                {book.rating ?? "No rating yet"}
              </span>
            </div>

            <p className="mt-6 text-2xl font-semibold text-green-800">
              {variant
                ? `${variant.currency} ${variant.price}`
                : "Price unavailable"}
            </p>

            <h2 className="mt-8 text-xl font-semibold text-[#45332F]">
              About this book
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              {book.description || "No description available."}
            </p>

            <button
              type="button"
              disabled={!variant || !variant.is_available}
              className="mt-8 w-full rounded-lg bg-[#285943] px-6 py-3 font-semibold text-white hover:bg-[#214834] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default BookDetails;
