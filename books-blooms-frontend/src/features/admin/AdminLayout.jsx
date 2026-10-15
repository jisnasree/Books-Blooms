import { NavLink, Outlet } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "📊" },
  { label: "Books", path: "/admin/books", icon: "📚" },
  { label: "Orders", path: "/admin/orders", icon: "📦" },
  { label: "Customers", path: "/admin/customers", icon: "👥" },
  { label: "Authors", path: "/admin/authors", icon: "✍️" },
  { label: "Categories", path: "/admin/categories", icon: "🗂️" },
];

function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#3F302D] md:flex">

      {/* Sidebar */}
      <aside className="w-full border-b border-rose-100 bg-[#F6F1E8] p-5 md:min-h-screen md:w-80 md:border-b-0 md:border-r">

        <div className="mb-8 flex items-center gap-3">
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
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-green-800 text-white"
                    : "text-stone-700 hover:bg-rose-100"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">

        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-stone-200 bg-[#F6F1E8] px-5 py-4 md:px-8">
            <h1 className="font-semibold">Admin Dashboard</h1>
          <div className="rounded-full bg-rose-100 px-4 py-2 text-sm font-medium text-rose-900">
            Admin
          </div>
        </header>

        {/* Page content changes based on the route */}
        <main className="p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;