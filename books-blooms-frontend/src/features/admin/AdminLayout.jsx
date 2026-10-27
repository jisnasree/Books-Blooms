import { useContext, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { AUTH_LOGOUT_URL } from "../../constants";

const menuItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "▦" },
  { label: "Books", path: "/admin/books", icon: "▤" },
  { label: "Orders", path: "/admin/orders", icon: "▣" },
  { label: "Customers", path: "/admin/customers", icon: "♧" },
  { label: "Authors", path: "/admin/authors", icon: "✎" },
  { label: "Categories", path: "/admin/categories", icon: "▧" },
];

function AdminLayout() {
  const { user, setUser } = useContext(UserContext);
  const [sidebarOpen, setSidebarOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches
  );

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
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="relative z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={sidebarOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <Link
            to="/admin"
            aria-label="Books & Blooms admin dashboard"
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
              >
                <path
                  d="M4.5 6.5c2.8 0 5 .8 7.5 2.5v11c-2.5-1.7-4.7-2.5-7.5-2.5v-11ZM19.5 6.5c-2.8 0-5 .8-7.5 2.5v11c2.5-1.7 4.7-2.5 7.5-2.5v-11Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 9c0-2.2 1.5-3.5 3.8-3.5 0 2.2-1.5 3.5-3.8 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Books <span className="text-orange-600">&amp;</span> Blooms
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user?.isAuthenticated ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {user.first_name || "Admin"}
                </p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-blue-50 font-semibold text-blue-700">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (user.first_name || user.email || "A")
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

              <Link
                to="/login"
                onClick={handleLogout}
                className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
              >
                Sign out
              </Link>
            </>
          ) : (
            <span className="text-sm font-semibold text-slate-700">Admin</span>
          )}
        </div>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-950/40 md:hidden"
        />
      )}

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside
          className={`fixed bottom-0 left-0 top-16 z-40 w-64 overflow-y-auto bg-[#203746] px-3 py-5 transition-transform duration-200 md:static md:top-auto md:bottom-auto md:min-h-[calc(100vh-4rem)] md:translate-x-0 ${
            sidebarOpen
              ? "translate-x-0 md:block"
              : "-translate-x-full md:hidden"
          }`}
        >
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Administration
          </p>

          <nav aria-label="Admin navigation" className="space-y-1.5">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span
                  aria-hidden="true"
                  className="flex w-5 justify-center text-lg"
                >
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;