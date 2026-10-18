
import { useEffect, useState } from "react";
import { AUTH_CUSTOMERS_LIST_URL } from "../../constants";

function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const token = sessionStorage.getItem("authToken");

        const response = await fetch(
          AUTH_CUSTOMERS_LIST_URL,
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
        setCustomers(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);


  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase().trim();

    return (
      customer.first_name.toLowerCase().includes(search) ||
      customer.last_name.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search)
    );
  });

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

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
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2"
        />

        <button
          type="button"
          onClick={() => setSearchTerm("")}
          className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
        >
          Clear
        </button>
      </div>

      <p className="mb-4">
        Total customers: {customers.length}
      </p>


      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3 text-left">ID</th>
              <th className="border p-3 text-left">First Name</th>
              <th className="border p-3 text-left">Last Name</th>
              <th className="border p-3 text-left">Email</th>
              <th className="border p-3 text-left">Joined</th>
              <th className="border p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td className="border p-3">{customer.id}</td>
                <td className="border p-3">{customer.first_name}</td>
                <td className="border p-3">{customer.last_name}</td>
                <td className="border p-3">{customer.email}</td>
                <td className="border p-3">
                  {new Date(customer.date_joined).toLocaleDateString()}
                </td>
                <td className="border p-3">
                  {customer.is_active ? "Active" : "Inactive"}
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
    </div>
  );
}

export default CustomersManagement;
