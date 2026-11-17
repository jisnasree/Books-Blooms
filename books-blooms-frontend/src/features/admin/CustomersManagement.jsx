import { useEffect, useState } from "react";
import { ADMIN_CUSTOMERS_LIST_URL } from "../../constants";
import { ADMIN_CUSTOMER_BLOCK_URL } from "../../constants";

function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const token = sessionStorage.getItem("authToken");
        const params = new URLSearchParams();
        
        params.set("page", currentPage);
        params.set("page_size", pageSize);

        if (searchTerm.trim()) {
          params.set("search", searchTerm.trim());
        }

        const response = await fetch(
          `${ADMIN_CUSTOMERS_LIST_URL}?${params.toString()}`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch customers.");
        }

        const data = await response.json();
        
        // Handle both paginated and non-paginated responses
        if (data.results) {
          setCustomers(data.results);
          setTotalCount(data.count);
        } else {
          setCustomers(data);
          setTotalCount(data.length);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, [currentPage, searchTerm, pageSize]);

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  async function handleBlockToggle(customer) {
    const action = customer.is_blocked ? "unblock" : "block";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this customer?`
    );

    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem("authToken");

      const response = await fetch(
        `${ADMIN_CUSTOMER_BLOCK_URL}${customer.id}/block/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            is_blocked: !customer.is_blocked,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update customer status.");
      }

      setCustomers((previousCustomers) =>
        previousCustomers.map((item) =>
          item.id === customer.id
            ? { ...item, is_blocked: data.is_blocked }
            : item
        )
      );
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">
        Customer Management
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2"
        />

        <button
          type="button"
          onClick={() => {
            setSearchTerm("");
            setCurrentPage(1);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 cursor-pointer"
        >
          Clear
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-[#203746] text-white">
            <tr>
              <th className="border p-3 text-left">ID</th>
              <th className="border p-3 text-left">First Name</th>
              <th className="border p-3 text-left">Last Name</th>
              <th className="border p-3 text-left">Email</th>
              <th className="border p-3 text-left">Joined</th>
              <th className="border p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="border p-3">{customer.id}</td>
                <td className="border p-3">{customer.first_name}</td>
                <td className="border p-3">{customer.last_name}</td>
                <td className="border p-3">{customer.email}</td>
                <td className="border p-3">
                  {new Date(customer.date_joined).toLocaleDateString()}
                </td>
                <td className="border p-3">
                  <button
                    type="button"
                    onClick={() => handleBlockToggle(customer)}
                    className={`rounded-lg px-3 py-2 text-white ${
                      customer.is_blocked
                        ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                        : "bg-red-600 hover:bg-red-700 cursor-pointer"
                    }`}
                  >
                    {customer.is_blocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}

            {customers.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
            {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Result count */}
          <p className="text-sm text-gray-500">
            Showing{" "}
            {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {" "}–{" "}
            {Math.min(currentPage * pageSize, totalCount)}
            {" "}of {totalCount} customers
          </p>

          {/* Previous and Next buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page - 1)}
              disabled={currentPage === 1 || loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={currentPage === totalPages || loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersManagement;