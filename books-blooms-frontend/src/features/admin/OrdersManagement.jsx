import { useEffect, useState } from "react";
import OrdersTable from "./OrdersTable";
import { ADMIN_BASE_URL ,ADMIN_ORDERS_URL} from "../../constants";
import { useNavigate } from "react-router-dom";

function OrdersManagement() {
const [orders, setOrders] = useState([]);
const [searchTerm, setSearchTerm] = useState("");

const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [ordering, setOrdering] = useState("-created_at");
const [totalOrders, setTotalOrders] = useState(0);
const [nextPage, setNextPage] = useState(null);
const [previousPage, setPreviousPage] = useState(null);

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
  
  const navigate = useNavigate();

  // Open order details in View mode
  const handleView = (order) => {
    navigate(`${ADMIN_ORDERS_URL}${order.id}`);
  };

  // Open order details in Edit mode
  const handleEdit = (order) => {
    navigate(`${ADMIN_ORDERS_URL}${order.id}?edit=true`);
  };


  // Fetch orders whenever search, sorting, or pagination changes.
useEffect(() => {
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("authToken");

      // Build query parameters for the backend.
      const params = new URLSearchParams({
        page: page,
        page_size: pageSize,
        ordering: ordering,
      });

      // Add search only when the search box is not empty.
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await fetch(
        `${ADMIN_BASE_URL}orders/?${params.toString()}`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders.");
      }

      const data = await response.json();

      // Store paginated response data.
      setOrders(data.results);
      setTotalOrders(data.count);
      setNextPage(data.next);
      setPreviousPage(data.previous);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  fetchOrders();
}, [page, pageSize, ordering, searchTerm]);

  

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
            onChange={(event) => {
            setSearchTerm(event.target.value);
            setPage(1);
           }}
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

      {/* Sorting and page size */}
      <div className="mb-6 flex flex-wrap items-center gap-4">

        {/* Sort orders */}
        <div>
          <label className="mr-2 text-sm font-medium text-gray-700">
            Sort by:
          </label>

          <select
            value={ordering}
            onChange={(event) => {
              setOrdering(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="-total_amount">Amount: High to Low</option>
            <option value="total_amount">Amount: Low to High</option>
            <option value="order_status">Order Status</option>
            <option value="payment_status">Payment Status</option>
          </select>
        </div>

        {/* Orders per page */}
        <div>
          <label className="mr-2 text-sm font-medium text-gray-700">
            Show:
          </label>

          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <span className="ml-2 text-sm text-gray-500">
            per page
          </span>
        </div>

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
            orders={orders}
            onView={handleView}
            onEdit={handleEdit}
          />


          {/* Result count */}
         {/* Pagination controls */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* Result count */}
          <p className="text-sm text-gray-500">
            Showing{" "}
            {totalOrders === 0 ? 0 : (page - 1) * pageSize + 1}
            {" "}–{" "}
            {Math.min(page * pageSize, totalOrders)}
            {" "}of {totalOrders} orders
          </p>

          {/* Previous and Next buttons */}
          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => setPage((currentPage) => currentPage - 1)}
              disabled={!previousPage || loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {page} of {Math.max(1, Math.ceil(totalOrders / pageSize))}
            </span>

            <button
              type="button"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={!nextPage || loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>

          </div>
        </div>
        </>
      )}
    </div>
  );
}

export default OrdersManagement;