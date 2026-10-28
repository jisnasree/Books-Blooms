import { createContext, useState, useEffect } from "react";
import { WISHLIST_URL } from "../constants";

export const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
    const [wishlist, setWishlist] = useState([]);

    // Fetch wishlist data from Django
    async function refreshWishlist() {
        const token = sessionStorage.getItem("authToken");

        if (!token) {
            setWishlist([]);
            return;
        }

        try {
            const response = await fetch(WISHLIST_URL, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to load wishlist.");
            }

            const data = await response.json();
            setWishlist(data);
        } catch (error) {
            console.error("Error fetching wishlist:", error);
        }
    }

    //add a book to the wishlist
    async function addToWishlist(bookId) {
        const token = sessionStorage.getItem("authToken");

        if (!token) {
            throw new Error("Please log in to add books to your wishlist.");
        }

        const response = await fetch(WISHLIST_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify({
                book: bookId,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to add book to wishlist.");
        }

        const newItem = await response.json();

        setWishlist((previousWishlist) => {
            const alreadyExists = previousWishlist.some(
                (item) => item.book === newItem.book
            );

            if (alreadyExists) {
                return previousWishlist;
            }

            return [...previousWishlist, newItem];
        });
        return newItem;
    }

    // Fetch wishlist when the provider mounts
    useEffect(() => {
        refreshWishlist();
    }, []);


    async function removeFromWishlist(itemId) {
        const token = sessionStorage.getItem("authToken");

        const response = await fetch(`${WISHLIST_URL}${itemId}/`, {
            method: "DELETE",
            headers: {
                Authorization: `Token ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to remove book from wishlist.");
        }

        setWishlist((previousWishlist) =>
            previousWishlist.filter((item) => item.id !== itemId)
        );
    }

    return (
        <WishlistContext.Provider
            value={{ wishlist, setWishlist, refreshWishlist, addToWishlist, removeFromWishlist }}
        >
            {children}
        </WishlistContext.Provider>
    );
}