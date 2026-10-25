import { useState, useEffect } from "react";
import { ADMIN_DASHBOARD_URL } from "../../constants";

function AdminDashboard() {
  const [summary, setSummary] = useState({
    totalBooks: null,
    totalAuthors: null,
    totalCategories: null,
    totalCustomers: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardSummary() {
      try {

        // const token = sessionStorage.getItem("authToken");

        const response = await fetch(
          ADMIN_DASHBOARD_URL,
          {
            method: "GET",
            headers: {
              Authorization: `Token ${sessionStorage.getItem("authToken")}`,
            },
            // headers: {
            //   Authorization: `Token ${token}`,
            // },
          }
        );


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
      value: "—",
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
    <div className="space-y-8">

      {/* Page heading */}
      <section>
        <h1 className="text-2xl font-bold text-[#3F302D]">
          Dashboard Overview
        </h1>
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
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone-500">
                {card.title}
              </p>

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-xl">
                {card.icon}
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-[#3F302D]">
              {loading && card.value === null ? "…" : card.value}
            </p>

            <p className="mt-2 text-sm text-stone-500">
              {card.description}
            </p>
          </div>
        ))}
      </section>

      {/* Recent orders */}
      <section className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-[#FBFAF7] text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-stone-500"
                >
                  No order data loaded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

export default AdminDashboard;