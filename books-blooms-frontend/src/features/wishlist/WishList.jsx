
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useState, useContext } from "react";
import { WishlistContext } from "../../context/WishListContext";

function Wishlist() {
    const { wishlist, removeFromWishlist } = useContext(WishlistContext);
    const [message, setMessage] = useState("");

    async function handleRemove(itemId) {
        try {
            setMessage("");
            await removeFromWishlist(itemId);
        } catch (error) {
            setMessage(error.message);
        }
    }
    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#FBFAF7] px-6 py-10">
                <div className="mx-auto max-w-6xl">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Wishlist
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Favorite books, all in one place.
                    </p>


                    {wishlist.length === 0 ? (
                        <p className="mt-8 text-gray-600">
                            Your wishlist is empty. Explore our collection and
                            save your favorite books!
                        </p>
                    ) : (
                        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {wishlist.map((item) => {
                                const book = item.book_details;

                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                                    >
                                        <img
                                            src={book.cover_url}
                                            alt={book.title}
                                            className="h-56 w-full rounded-lg object-contain"
                                        />

                                        <h2 className="mt-4 text-lg font-semibold text-gray-800">
                                            {book.title}
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-600">
                                            By {book.author_name}
                                        </p>

                                        <p className="mt-2 font-semibold text-rose-600">
                                            ₹{book.physical_variants?.[0]?.price ?? "Price unavailable"}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => handleRemove(item.id)}
                                            className="mt-4 w-full rounded-lg border border-rose-600 px-4 py-2 text-rose-600 transition hover:bg-rose-50"
                                        >
                                            Remove from Wishlist
                                        </button>

                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </main>

            <Footer />
        </>
    );
}

export default Wishlist;
