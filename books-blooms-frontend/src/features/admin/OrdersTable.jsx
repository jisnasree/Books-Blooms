function OrdersTable({
  orders = [],
  onView = () => {},
  onEdit = () => {},
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">

      <table className="w-full text-left text-sm">

        {/* Table Header */}
        <thead className="bg-[#203746] text-white">
          <tr>
            <th className="px-4 py-3 border">Order ID</th>
            <th className="px-4 py-3 border">Customer</th>
            <th className="px-4 py-3 border">Date</th>
            <th className="px-4 py-3 border">Total</th>
            <th className="px-4 py-3 border">Payment Status</th>
            <th className="px-4 py-3 border">Order Status</th>
            <th className="px-4 py-3 border text-center">Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y">

          {orders.length === 0 ? (

            <tr>
              <td
                colSpan={7}
                className="px-4 py-8 text-center text-gray-500"
              >
                No orders found.
              </td>
            </tr>

          ) : (

            orders.map((order) => (

              <tr
                key={order.id}
                className="hover:bg-gray-50"
              >

                {/* Order ID */}
                <td className="px-4 py-4 border font-medium">
                  #{order.id}
                </td>

                {/* Customer Name */}
                <td className="px-4 py-4 border text-gray-600">
                  {order.customer_name || "—"}
                </td>

                {/* Order Date */}
                <td className="px-4 py-4 border text-gray-600">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString()
                    : "—"}
                </td>

                {/* Total Amount */}
                <td className="px-4 py-4 border text-gray-600">
                  ₹{Number(order.total_amount || 0).toFixed(2)}
                </td>

                {/* Payment Status */}
                <td className="px-4 py-4 border">
                  <span className="text-xs font-medium">
                    {order.payment_status || "—"}
                  </span>
                </td>

                {/* Order Status */}
                <td className="px-4 py-4 border">
                  <span className="text-xs font-medium">
                    {order.order_status || "—"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4 border">
                  <div className="flex items-center justify-center gap-3">

                    <button
                      type="button"
                      onClick={() => onView(order)}
                      className="font-medium text-blue-700 hover:underline cursor-pointer"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(order)}
                      className="font-medium text-green-700 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>

                  </div>
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
