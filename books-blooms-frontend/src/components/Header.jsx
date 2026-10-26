import { useContext, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { CartContext } from "../context/CartContext";
import { AUTH_LOGOUT_URL, CATALOG_CATEGORIES_URL } from "../constants";

function Header() {
  const { cartCount } = useContext(CartContext);
  const { user, setUser } = useContext(UserContext);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        const response = await fetch(CATALOG_CATEGORIES_URL);

        if (!response.ok) {
          throw new Error(`Failed to load categories (${response.status})`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The categories response was not a list.");
        }

        if (isMounted) {
          setCategories(data);
          setCategoryError("");
        }
      } catch (error) {
        console.error("Error loading categories:", error);

        if (isMounted) {
          setCategoryError("Categories could not be loaded.");
        }
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

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
    `whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] transition ${
      isActive
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

        <div className="order-3 flex w-full items-center justify-center gap-x-5 gap-y-3 border-t border-slate-100 pt-3 sm:gap-x-7 md:order-2 md:w-auto md:flex-wrap md:border-0 md:pt-0">
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

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategories((open) => !open)}
              aria-expanded={showCategories}
              aria-haspopup="menu"
              className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 transition hover:text-orange-700"
            >
              Categories
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className={`h-4 w-4 transition-transform ${
                  showCategories ? "rotate-180" : ""
                }`}
              >
                <path
                  d="m5 7.5 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showCategories && (
              <div
                role="menu"
                className="absolute left-1/2 z-50 mt-3 max-h-72 w-56 -translate-x-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
              >
                <Link
                  to="/books"
                  role="menuitem"
                  onClick={() => setShowCategories(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                >
                  All books
                </Link>

                {categoryError ? (
                  <p role="status" className="px-3 py-2 text-sm text-orange-600">
                    {categoryError}
                  </p>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/books?category=${encodeURIComponent(category.id)}`}
                      role="menuitem"
                      onClick={() => setShowCategories(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                    >
                      {category.name}
                    </Link>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">
                    No categories available.
                  </p>
                )}
              </div>
            )}
          </div>
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