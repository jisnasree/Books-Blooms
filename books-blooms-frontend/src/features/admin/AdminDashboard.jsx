const summaryCards = [
  {
    title: "Total Books",
    value: "—",
    description: "Books in your catalog",
    icon: "📚",
  },
  {
    title: "Total Orders",
    value: "—",
    description: "Orders placed",
    icon: "📦",
  },
//   {
//     title: "Customers",
//     value: "—",
//     description: "Registered customers",
//     icon: "👥",
//   },
  {
    title: "Authors",
    value: "—",
    description: "Registered Authors",
    icon: "✍️",
  },
  {
    title: "Categories",
    value: "—",
    description: "Registered Categories",
    icon: "🗂️",
  },
];

function AdminDashboard() {
  return (
    <div className="space-y-8">

      {/* Page heading */}
      <section>
        <h1 className="text-2xl font-bold text-[#3F302D]">
          Dashboard Overview
        </h1>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
              {card.value}
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