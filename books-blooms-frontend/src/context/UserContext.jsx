// UserContext.jsx
import { createContext, useState, useEffect, useContext } from "react";

// 1. Create the context
export const UserContext = createContext(null)

// 2. Create the provider component
export function UserProvider({ children }) {
    const [user, setUser] = useState({ isAdmin: false, isAuthenticated: false, first_name: "" })

    useEffect(() => {
        console.log(user, "user")
    }, [user])

    //Add logout function to the provider
    const logout = () => {
        sessionStorage.removeItem("authToken");
        setUser({
            isAdmin: false,
            isAuthenticated: false,
            first_name: "",
        });
    }
    // Pass both the state and the setter function down   
    // 4. Share user, setUser, and logout with child components
    return (
        <UserContext.Provider value={{ user, setUser, logout }}>
            {children}
        </UserContext.Provider>
    );

}