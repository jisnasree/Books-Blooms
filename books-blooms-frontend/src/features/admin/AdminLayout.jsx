
import { NavLink, Outlet } from "react-router-dom";
import Header from "../../components/Header";

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
    <div className="min-h-screen bg-[#FBFAF7] text-[#3F302D]">

      {/* Top Header */}
      <Header />

      {/* Sidebar and Main Content below Header */}
      <div className="md:flex">

        {/* Left Sidebar */}
        <aside className="w-full shrink-0 border-b border-rose-100 bg-[#F6F1E8] p-5 md:min-h-[calc(100vh-80px)] md:w-64 md:border-b-0 md:border-r">

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

        {/* Right Main Content */}
        <div className="min-w-0 flex-1">
          <main className="p-5 md:p-8">
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}

export default AdminLayout;
