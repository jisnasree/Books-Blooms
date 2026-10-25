
import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { CATALOG_BOOKS_URL, CART_LIST_URL,ADD_TO_CART_URL} from "../../constants";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { CartContext } from "../../context/CartContext";
import { Link } from "react-router-dom";


function BookDetails() {
  const { id } = useParams();
  const { refreshCart } = useContext(CartContext);

  const [book, setBook] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartMessageType, setCartMessageType] = useState("");

  // Fetch book details from the backend
  useEffect(() => {
    async function fetchBook() {
      try {
        const response = await fetch(`${CATALOG_BOOKS_URL}${id}/`);

        if (!response.ok) {
          throw new Error("Book not found.");
        }

        const data = await response.json();
        setBook(data);
      } catch (error) {
        console.error("Error fetching book:", error);
      }
    }

    fetchBook();
  }, [id]);

  // Show loading while book details are being fetched
  if (!book) {
    return (
      <>
        <Header />
        <p className="p-8 text-center text-gray-600">
          Loading book details...
        </p>
        <Footer />
      </>
    );
  }

  // Get the first physical variant of the book
  const variant = book.physical_variants?.[0];

  // Add book to cart
  const handleAddToCart = async () => {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
      setCartMessage("Please log in to add items to your cart.");
      setCartMessageType("error");
      return;
    }

    if (!variant || !variant.is_available) {
      setCartMessage("This book format is currently unavailable.");
      setCartMessageType("error");
      return;
    }

    setAddingToCart(true);
    setCartMessage("");

    try {
      const response = await fetch(ADD_TO_CART_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          variant: variant.id,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.detail ||
          "Failed to add the book to your cart."
        );
      }


      // Update the cart icon in the header
      refreshCart(data);
      setCartMessage("");
    } catch (error) {
      setCartMessage(error.message);
      setCartMessageType("error");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <>
      <Header />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* Book cover */}
          <div className="flex justify-center rounded-xl bg-[#FBFAF7] p-8">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="max-h-[500px] w-full object-contain"
              />
            ) : (
              <div className="flex min-h-64 items-center text-gray-500">
                No cover image available
              </div>
            )}
          </div>

          {/* Book information */}
          <div className="pt-8 md:pt-16">
            <h1 className="text-3xl font-bold text-[#45332F]">
              {book.title}
            </h1>

            <p className="mt-3 text-gray-600">
              By {book.author_name}
            </p>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-amber-400">★★★★★</span>
              <span className="text-sm text-gray-500">
                {book.rating ?? "No rating yet"}
              </span>
            </div>

            {/* Price */}
            <p className="mt-6 text-2xl font-semibold text-green-800">
              {variant
                ? `${variant.currency} ${variant.price}`
                : "Price unavailable"}
            </p>

            {/* Book description */}
            <h2 className="mt-8 text-xl font-semibold text-[#45332F]">
              About this book
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              {book.description || "No description available."}
            </p>

            {/* Add to Cart button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                !variant || !variant.is_available || addingToCart
              }
              className="mt-8 w-full rounded-lg bg-[#285943] px-6 py-3 font-semibold text-white transition hover:bg-[#214834] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addingToCart ? "Adding..." : "Add to Cart"}
            </button>

            {/* Success or error message */}
            {cartMessage && (
              <p role="status" className="mt-3 text-sm text-red-600">
                {cartMessage}
              </p>
            )}

            <Link
              to="/cart"
              className="mt-4 inline-block text-sm font-semibold text-[#285943] hover:underline"
            >
              View Cart
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default BookDetails;
