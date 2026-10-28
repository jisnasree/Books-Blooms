
import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import {
  CATALOG_BOOKS_URL,
  CART_LIST_URL,
  ADD_TO_CART_URL,
} from "../../constants";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { CartContext } from "../../context/CartContext";
import { Link } from "react-router-dom";
import { WishlistContext } from "../../context/WishListContext";

function BookDetails() {
  const { id } = useParams();
  const { refreshCart } = useContext(CartContext);
  const { wishlist, addToWishlist, removeFromWishlist } = useContext(WishlistContext);
  const [book, setBook] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartMessageType, setCartMessageType] = useState("");
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [wishlistMessageType, setWishlistMessageType] = useState("");

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
        <main className="min-h-[60vh] bg-slate-50 px-6 py-24">
          <p className="mx-auto max-w-7xl text-center text-sm font-medium text-slate-500">
            Loading book details...
          </p>
        </main>
        <Footer />
      </>
    );
  }

  // Get the first physical variant of the book
  const variant = book.physical_variants?.[0];

  // Check whether this book is already in the wishlist
  const isWishlisted = wishlist.some(
    (item) => item.book === book.id
  );

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


  // Add book to wishlist

  const handleAddToWishlist = async () => {
    setWishlistMessage("");

    try {
      if (isWishlisted) {
        const wishlistItem = wishlist.find(
          (item) => item.book === book.id
        );

        if (wishlistItem) {
          await removeFromWishlist(wishlistItem.id);
        }

        setWishlistMessage("Book removed from your wishlist!");
      } else {
        await addToWishlist(book.id);
        setWishlistMessage("Book added to your wishlist!");
      }

      setWishlistMessageType("success");
    } catch (error) {
      setWishlistMessage(error.message);
      setWishlistMessageType("error");
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-[70vh] bg-slate-50">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Book cover */}
              <div className="bg-gradient-to-br from-orange-50 via-rose-50 to-slate-100 p-6 sm:p-10 lg:p-12">
                <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-white/80 bg-white/70 p-6 shadow-sm sm:min-h-[560px]">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="max-h-[500px] w-full object-contain drop-shadow-xl"
                    />
                  ) : (
                    <div className="flex min-h-64 items-center justify-center text-sm font-medium text-slate-500">
                      No cover image available
                    </div>
                  )}
                </div>
              </div>

              {/* Book information */}
              <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {variant?.format && (
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold tracking-wide text-orange-800 ring-1 ring-inset ring-orange-200">
                      {variant.format}
                    </span>
                  )}

                  {variant && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset ${variant.is_available
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                    >
                      {variant.is_available ? "In stock" : "Unavailable"}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {book.title}
                </h1>

                <p className="mt-3 text-base text-slate-600">
                  By{" "}
                  <span className="font-semibold text-slate-800">
                    {book.author_name}
                  </span>
                </p>

                {/* Rating */}
                <div className="mt-5 flex items-center gap-2">
                  <span
                    aria-label="5 stars"
                    className="text-xl tracking-widest text-amber-400"
                  >
                    ★★★★★
                  </span>
                  <span className="text-sm font-medium text-slate-600">
                    {book.rating ?? "No rating yet"}
                  </span>
                </div>

                {/* Price */}
                <div className="mt-7 border-y border-slate-100 py-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Price
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-orange-700">
                    {variant
                      ? `${variant.currency} ${variant.price}`
                      : "Price unavailable"}
                  </p>
                </div>

                {/* Book description */}
                <div className="mt-7">
                  <h2 className="text-lg font-bold text-slate-900">
                    About this book
                  </h2>
                  <p className="mt-3 leading-7 text-slate-600">
                    {book.description || "No description available."}
                  </p>
                </div>

                {/* Add to Cart button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                    !variant || !variant.is_available || addingToCart
                  }
                  className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
                >
                  {addingToCart ? "Adding..." : "Add to Cart"}
                </button>


                {/* Add to Wishlist button */}
                <button
                  type="button"
                  onClick={handleAddToWishlist}
                  className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-6 py-3 text-sm font-bold text-rose-700 shadow-sm transition hover:bg-rose-50"
                >
                  <span className="text-xl" aria-hidden="true">
                    {isWishlisted ? "♥" : "♡"}
                  </span>

                  {isWishlisted ? "Added to Wishlist" : "Add to Wishlist"}
                </button>

                {/* Success or error message */}
                {cartMessage && (
                  <p
                    role="status"
                    className={`mt-3 rounded-lg px-4 py-3 text-sm ${cartMessageType === "error"
                      ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                      }`}
                  >
                    {cartMessage}
                  </p>
                )}

                {/* Wishlist success or error message */}
                {wishlistMessage && (
                  <p
                    role="status"
                    className={`mt-3 rounded-lg px-4 py-3 text-sm ${wishlistMessageType === "error"
                      ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                      }`}
                  >
                    {wishlistMessage}
                  </p>
                )}
                <Link
                  to="/cart"
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                >
                  View Cart
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default BookDetails;