import { useState, useEffect } from "react";
import { ADMIN_DASHBOARD_URL } from "../../constants";

function AdminDashboard() {
  const [summary, setSummary] = useState({
    totalBooks: null,
    totalAuthors: null,
    totalCategories: null,
    totalOrders: null,
    totalCustomers: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardSummary() {
      try {
        const response = await fetch(ADMIN_DASHBOARD_URL, {
          method: "GET",
          headers: {
            Authorization: `Token ${sessionStorage.getItem("authToken")}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load dashboard data (${response.status})`
          );
        }

        const data = await response.json();
        setSummary(data);
      } catch (err) {
        setError(err.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardSummary();
  }, []);

  const summaryCards = [
    {
      title: "Total Books",
      value: summary.totalBooks,
      description: "Books in your catalog",
      icon: "📚",
    },
    {
      title: "Total Orders",
      value: summary.totalOrders,
      description: "Orders placed",
      icon: "📦",
    },
    {
      title: "Authors",
      value: summary.totalAuthors,
      description: "Registered Authors",
      icon: "✍️",
    },
    {
      title: "Customers",
      value: summary.totalCustomers,
      description: "Registered Customers",
      icon: "👥",
    },
    {
      title: "Categories",
      value: summary.totalCategories,
      description: "Registered Categories",
      icon: "🗂️",
    },
  ];

  return (
    <div className="space-y-10">

      {/* Page heading */}
      <section>
        <h1 className="text-2xl font-bold text-[#3F302D]">
          Dashboard Overview
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Welcome to your Books & Blooms administration dashboard.
        </p>
      </section>

      {/* Loading and error messages */}
      {loading && (
        <p className="text-sm text-stone-500">
          Loading dashboard summary...
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-rose-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-stone-500">
                {card.title}
              </p>

              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-50 text-2xl">
                {card.icon}
              </span>
            </div>

            <p className="mt-7 text-4xl font-bold text-[#3F302D]">
              {loading && card.value === null
                ? "..."
                : card.value ?? 0}
            </p>

            <p className="mt-3 text-base text-stone-500">
              {card.description}
            </p>
          </div>
        ))}
      </section>

    </div>
  );
}

export default AdminDashboard;