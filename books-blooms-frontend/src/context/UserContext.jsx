
import { createContext, useState, useEffect } from "react";

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
    
    // Pass both the state and the setter function down  
    // 6. Share user data and functions with child components
    return (
        <UserContext.Provider
            value={{ user, setUser, loading, setLoading }}
        >
            {children}
        </UserContext.Provider>
    );
}
