
import { createContext, useState, useEffect } from "react";
import { CART_LIST_URL } from "../constants";

// 1. Create the context
export const CartContext = createContext(null);

// 2. Create the provider component
export function CartProvider({ children }) {
    const [cartCount, setCartCount] = useState(0);

    // Update cart count using cart data
    function updateCartCount(cartData) {
        const items = cartData?.items ?? [];

        const total = items.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
        );

        setCartCount(total);
    }

    // Fetch cart from the backend
    async function refreshCart(cartData) {
        // If updated cart data is already available, use it
        if (cartData) {
            updateCartCount(cartData);
            return;
        }

        const token = sessionStorage.getItem("authToken");

        if (!token) {
            setCartCount(0);
            return;
        }

        try {
            const response = await fetch(CART_LIST_URL, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to load cart.");
            }

            const data = await response.json();
            updateCartCount(data);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    }

    // Fetch cart when the app starts
    useEffect(() => {
        refreshCart();
    }, []);

    // 3. Share cart data and functions with child components
    return (
        <CartContext.Provider value={{ cartCount, refreshCart }}>
            {children}
        </CartContext.Provider>
    );
}
