// UserContext.jsx
import { createContext, useState, useEffect, useContext} from "react";

// 1. Create the context
export const UserContext = createContext(null)

// 2. Create the provider component
export function UserProvider({ children }) {
    const [user, setUser] = useState({ isAdmin: false, isAuthenticated: false ,first_name: ""})

    useEffect(() => {
        console.log(user, "user")
    }, [user])

    // Pass both the state and the setter function down   
    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>

    );
}

// 3. Custom hook for easier consumption and safety checks
// export function useUser() {
//     const context = useContext(UserContext);
//     if (!context) {
//         throw new Error('useUser must be used within a UserProvider');
//     }
//     return context;
// }