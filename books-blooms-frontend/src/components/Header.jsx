import { useContext, useState } from "react";
import { UserContext } from "../context/UserContext";
import { AUTH_LOGOUT_URL } from "../constants";
import { Link } from "react-router-dom";

function Header() {
    const { user, logout } = useContext(UserContext);
    const [showDropdown, setShowDropdown] = useState(false);
    console.log("Current user:", user);


    const handleLogout = async () => {
        await logout();
    };
    console.log("Header user:", user);
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
                        Shop
                    </a>
                    <a href="/categories" className="text-sm text-gray-600 hover:text-rose-700">
                        Contact Us
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

                {/* {user.isAuthenticated ? (
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
                )} */}

                {user.isAuthenticated ? (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-green-800">
                            {user.isAuthenticated && (
                                <span>Welcome, {user.first_name}</span>
                            )}
                        </span>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowDropdown((prev) => !prev)}
                                className="flex h-10 w-10 items-center justify-center overflow-hidden ounded-full border-2 border-rose-200 bg-rose-100 text-lg font-semibold text-rose-700 hover:bg-rose-200"
                                aria-label="Profile menu"
                                aria-expanded={showDropdown}
                            >
                                {user.profile_image ? (
                                    <img
                                        src={user.profile_image}
                                        alt="Profile"
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    (user.first_name || user.email || "U")
                                        .charAt(0)
                                        .toUpperCase()
                                )}
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-rose-100 bg-white py-2 shadow-lg">
                                    <Link
                                        to="/account"
                                        onClick={() => setShowDropdown(false)}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-rose-50"
                                    >
                                        My Account
                                    </Link>

                                    <Link
                                        type="button"
                                        to="/login"
                                        onClick={handleLogout}
                                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-rose-50"
                                    >
                                        Sign Out
                                    </Link>
                                </div>
                            )}
                        </div>
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
