import { useEffect, useState } from "react";
import OrdersTable from "./OrdersTable";
import { ORDERS_URL } from "../../constants";

function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all orders when the component loads.
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = sessionStorage.getItem("authToken");

        const response = await fetch(`${ORDERS_URL}admin/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch orders.");
        }

        const data = await response.json();

        // Support both paginated and non-paginated responses.
        setOrders(data.results || data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders by order ID or customer name.
  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.trim().toLowerCase();

    return (
      String(order.id).includes(search) ||
      order.customer_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Order Management
        </h1>
      </div>

      {/* Search orders */}
      <div className="mb-6 flex w-full max-w-3xl items-center gap-4">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by order ID or customer name..."
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
        </div>

        <button
          type="button"
          onClick={() => setSearchTerm("")}
          disabled={!searchTerm}
          className="shrink-0 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          Clear
        </button>
      </div>

      {/* Loading message */}
      {loading && (
        <p className="py-6 text-center text-gray-500">
          Loading orders...
        </p>
      )}

      {/* Error message */}
      {!loading && error && (
        <p className="py-6 text-center text-red-600">
          {error}
        </p>
      )}

      {/* Orders table */}
      {!loading && !error && (
        <>
          <OrdersTable
            orders={filteredOrders}
            onView={(order) => console.log("Selected order:", order)}
          />

          {/* Result count */}
          <p className="mt-4 text-sm text-gray-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </>
      )}
    </div>
  );
}

export default OrdersManagement;