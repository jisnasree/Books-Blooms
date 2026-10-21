
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
    // 3. Fetch the user's profile from the backend
    async function fetchProfile() {
        const token = sessionStorage.getItem("authToken");

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(AUTH_PROFILE_URL, {
                method: "GET",
                headers: {
                    Authorization: `Token ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();

                setUser((previousUser) => ({
                    ...previousUser,
                    ...data,
                    isAuthenticated: true,
                }));
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
        finally {
            setLoading(false);
        }
    }

    // 4. Fetch the profile when the application loads
    useEffect(() => {
        fetchProfile();

    }, []);
    useEffect(() => {
        console.log(user, "user");
    }, [user]);

    // 5. Log out the user
    function logout() {
        sessionStorage.removeItem("authToken");

        setUser({
            isAdmin: false,
            isAuthenticated: false,
            first_name: "",
            profile_image: null,
        });
    }
    // Pass both the state and the setter function down  
    // 6. Share user data and functions with child components
    return (
        <UserContext.Provider
            value={{ user, setUser, logout, fetchProfile, loading }}
        >
            {children}
        </UserContext.Provider>
    );
}
