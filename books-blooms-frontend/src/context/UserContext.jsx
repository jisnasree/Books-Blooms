
import { createContext, useState, useEffect } from "react";
import { AUTH_PROFILE_URL } from "../constants";

// 1. Create the context
export const UserContext = createContext(null);

// 2. Create the provider component
export function UserProvider({ children }) {

    const [user, setUser] = useState({
        isAdmin: false,
        isAuthenticated: false,
        first_name: "",
        profile_image: null,
    });
    const [loading, setLoading] = useState(true);

    //fetch user profile
    async function fetchProfile() {
        const token = sessionStorage.getItem("authToken");

        if (!token) {
            setUser({
                isAdmin: false,
                isAuthenticated: false,
                first_name: "",
                last_name: "",
                email: "",
                phone_number: "",
                profile_image: null,
            });

            return;
        }

        try {
            const response = await fetch(AUTH_PROFILE_URL, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to load profile.");
            }

            const data = await response.json();

            setUser((previousUser) => ({
                ...previousUser,
                ...data,
                isAuthenticated: true,
            }));
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    }

    //call fetch profile when the app starts
    useEffect(() => {
        async function loadProfile() {
            await fetchProfile();
            setLoading(false);
        }

        loadProfile();
    }, []);

    // Pass both the state and the setter function down  
    // 6. Share user data and functions with child components
    return (
        <UserContext.Provider
            value={{ user, setUser, loading, setLoading,fetchProfile }}
        >
            {children}
        </UserContext.Provider>
    );
}
