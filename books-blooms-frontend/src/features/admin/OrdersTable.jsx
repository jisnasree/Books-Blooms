
function OrdersTable({
  orders = [],
  onView = () => {},
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#203746] text-white">
          <tr>
            <th className="px-4 py-3 border">Order ID</th>
            <th className="px-4 py-3 border">Customer</th>
            <th className="px-4 py-3 border">Date</th>
            <th className="px-4 py-3 border">Total</th>
            <th className="px-4 py-3 border">Payment Status</th>
            <th className="px-4 py-3 border">Order Status</th>
            <th className="px-4 py-3 border">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center">
                No orders found.
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 border font-medium">
                  #{order.id}
                </td>

                <td className="px-4 py-4 border text-gray-600">
                  {order.customer_name || "—"}
                </td>

                <td className="px-4 py-4 border text-gray-600">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString()
                    : "—"}
                </td>

                <td className="px-4 py-4 border text-gray-600">
                  ₹{Number(order.total_amount || 0).toFixed(2)}
                </td>

                <td className="px-4 py-4 border">
                  {order.payment_status || "—"}
                </td>

                <td className="px-4 py-4 border">
                  {order.order_status || "—"}
                </td>

                <td className="px-4 py-4 border">
                  <button
                    type="button"
                    onClick={() => onView(order)}
                    className="text-blue-700 hover:underline cursor-pointer"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OrdersTable;
