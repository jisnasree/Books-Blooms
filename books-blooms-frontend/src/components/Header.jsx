import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { AUTH_LOGOUT_URL } from "../constants";

function Header() {
    const { user, setUser ,logout} = useContext(UserContext);

    const handleLogout = async () => {
        const token = sessionStorage.getItem("authToken");

        try {
            if (token) {
                const response = await fetch(
                    AUTH_LOGOUT_URL,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Token ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Logout failed");
                }
            }
        } catch (error) {
            console.error("Logout API error:", error);
            return;
        }

        logout();
    };
    return (
        <header className="border-b border-rose-100 bg-[#F6F1E8]">

            <nav className="mx-auto flex max-w-7xl items-center justify-between py-4">
                {/* Brand */}
                <a href="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-700 text-white">
                        <span className="text-xl">📚</span>
                    </div>

                    <div>
                        <span className="block text-2xl font-extrabold text-green-900">
                            Books <span className="text-rose-700">&</span> Blooms
                        </span>
                        <span className="block text-xs text-gray-500">
                            Stories that helps you bloom
                        </span>
                    </div>
                </a>

                {/* Navigation links */}
                <div className="hidden items-center gap-8 md:flex">
                    <a href="/" className="text-sm font-medium text-rose-800 hover:text-rose-600">
                        Home
                    </a>
                    <a href="/books" className="text-sm text-gray-600 hover:text-rose-700">
                        Books
                    </a>
                    <a href="/categories" className="text-sm text-gray-600 hover:text-rose-700">
                        Categories
                    </a>
                </div>


                <div className="w-72">
                    <input
                        type="text"
                        placeholder="Search title, author, or keyword"
                        className="w-full rounded-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 text-sm placeholder-gray-400 outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
                    />
                </div>


                {/* Actions */}

                {user.isAuthenticated ? (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-green-800">
                            Welcome {user.first_name}!
                        </span>
                        <button className="rounded-lg px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50" onClick={handleLogout}>
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <a
                        href="/login"
                        className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 sm:inline-block"
                    >
                        Sign In
                    </a>
                )}

            </nav>
        </header>
    );
}

export default Header;
