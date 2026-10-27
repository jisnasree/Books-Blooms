import { useContext, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { CartContext } from "../context/CartContext";
import { AUTH_LOGOUT_URL, CATALOG_BOOKS_URL } from "../constants";

function Header() {
  const { cartCount } = useContext(CartContext);
  const { user, setUser } = useContext(UserContext);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);


  function handleSearch(event) {
    event.preventDefault();

    const search = searchTerm.trim();

    if (!search) return;

    setShowSuggestions(false);

    navigate(`/books?search=${encodeURIComponent(search)}`);
  }


  useEffect(() => {
    const search = searchTerm.trim();

    if (search.length < 2) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const params = new URLSearchParams({
          search: search,
          page: 1,
        });

        const response = await fetch(
          `${CATALOG_BOOKS_URL}?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch book suggestions");
        }

        const data = await response.json();

        const books = Array.isArray(data)
          ? data
          : data.results || [];

        setSuggestions(books.slice(0, 5));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);


  async function handleLogout() {
    const token = sessionStorage.getItem("authToken");

    try {
      if (token) {
        const response = await fetch(AUTH_LOGOUT_URL, {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Logout API returned status:", response.status);
        }
      }
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      sessionStorage.removeItem("authToken");
      setUser({
        isAdmin: false,
        isAuthenticated: false,
        first_name: "",
        profile_image: null,
      });
      setShowAccountMenu(false);
    }
  }

  const navLinkClass = ({ isActive }) =>
    `whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] transition ${isActive
      ? "text-orange-700"
      : "text-slate-600 hover:text-orange-700"
    }`;

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-8">
        <Link to="/" aria-label="Books & Blooms home" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6"
            >
              <path
                d="M12 20.5V8.8M12 11.5C9.4 11.5 7.5 9.8 7.5 7.2c2.8 0 4.5 1.6 4.5 4.3ZM12 9.5c0-2.7 1.8-4.5 4.7-4.5 0 2.8-1.8 4.5-4.7 4.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 6.5c2.8 0 5 .8 7.5 2.5v11c-2.5-1.7-4.7-2.5-7.5-2.5v-11ZM19.5 6.5c-2.8 0-5 .8-7.5 2.5v11c2.5-1.7 4.7-2.5 7.5-2.5v-11Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Books <span className="text-orange-600">&amp;</span> Blooms
          </span>
        </Link>

        <div className="order-3 flex w-full items-center justify-center gap-x-4 pt-3 md:order-2 md:w-auto md:flex-nowrap md:gap-x-5 md:border-0 md:pt-0">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          <NavLink to="/books" className={navLinkClass}>
            Shop
          </NavLink>

          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>

          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>

          <form
            onSubmit={handleSearch}
            className="relative w-60 shrink-0"
          >
            <div className="flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search books or authors..."
                aria-label="Search books by title or author"
                aria-autocomplete="list"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                aria-label="Search"
                className="ml-2 text-slate-500 transition hover:text-orange-700"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                >
                  <circle
                    cx="10.8"
                    cy="10.8"
                    r="6.8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="m16 16 4.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {showSuggestions && searchTerm.trim().length >= 2 && (
              <div
                role="listbox"
                className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
              >
                {searchLoading ? (
                  <p className="px-4 py-3 text-sm text-slate-500">
                    Searching books...
                  </p>
                ) : suggestions.length > 0 ? (
                  suggestions.map((book) => (
                    <Link
                      key={book.id}
                      to={`/books/${book.id}`}
                      role="option"
                      onClick={() => {
                        setSearchTerm("");
                        setShowSuggestions(false);
                      }}
                      className="block border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-orange-50"
                    >
                      <p className="text-sm font-medium text-slate-800">
                        {book.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {book.author_name || "Unknown author"}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-slate-500">
                    No matching books found.
                  </p>
                )}
              </div>
            )}
          </form>

        </div>

        <div className="order-2 flex shrink-0 items-center gap-4 md:order-3">
          {user.isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountMenu((open) => !open)}
                aria-label="Open account menu"
                aria-expanded={showAccountMenu}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-orange-700"
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 font-semibold text-orange-700">
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user.first_name || user.email || "U")
                      .charAt(0)
                      .toUpperCase()
                  )}
                </span>
                <span className="hidden sm:inline">
                  {user.first_name || "Account"}
                </span>
                <span aria-hidden="true" className="text-slate-400">
                  ▾
                </span>
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <Link
                    to="/account"
                    onClick={() => setShowAccountMenu(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    My Account
                  </Link>
                  <Link
                    to="/login"
                    onClick={handleLogout}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Sign Out
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 transition hover:text-orange-700"
            >
              Sign In
            </Link>
          )}

          <Link
            to="/cart"
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
            className="relative flex h-9 w-9 items-center justify-center text-slate-700 transition hover:text-orange-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6"
            >
              <path
                d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="20" r="1" fill="currentColor" />
              <circle cx="18" cy="20" r="1" fill="currentColor" />
            </svg>

            {cartCount > 0 && (
              <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold leading-none text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;