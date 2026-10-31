
function BooksTable({
  books = [],
  onEdit = () => {},
  onDelete = () => {},
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#203746] text-white">
          <tr>
            <th className="px-4 py-3 border">Title</th>
            <th className="px-4 py-3 border">Author</th>
            <th className="px-4 py-3 border">Format</th>
            <th className="px-4 py-3 border">Price</th>
            <th className="px-4 py-3 border">Inventory</th>
            <th className="px-4 py-3 border">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {books.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center">
                No books match your search.
              </td>
            </tr>
          ) : (
            books.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 font-medium text-gray-800 border">
                  {book.title}
                </td>

                <td className="px-4 py-4 text-gray-600 border">
                  {book.author_name || "—"}
                </td>

                <td className="px-4 py-4 text-gray-600 border">
                  {book.physical_variants
                    ?.map((variant) => variant.format)
                    .join(", ") || "—"}
                </td>

                <td className="px-4 py-4 text-gray-600 border">
                  {book.physical_variants
                    ?.map(
                      (variant) =>
                        `${variant.currency} ${Number(variant.price).toFixed(2)}`
                    )
                    .join(", ") || "—"}
                </td>

                {/* Inventory column */}
                <td className="px-4 py-4 border">
                  <div className="space-y-2">
                    {book.physical_variants?.length > 0 ? (
                      book.physical_variants.map((variant) => (
                        <div key={variant.id}>
                          <span className="text-gray-600">
                            {variant.format}:{" "}
                          </span>

                          <span
                            className={
                              variant.stock_quantity === 0
                                ? "font-medium text-red-600"
                                : variant.stock_quantity <= 5
                                ? "font-medium text-orange-600"
                                : "font-medium text-green-700"
                            }
                          >
                            {variant.stock_quantity === 0
                              ? "Out of Stock"
                              : `${variant.stock_quantity} available`}
                          </span>
                        </div>
                      ))
                    ) : (
                      "—"
                    )}
                  </div>
                </td>

                <td className="px-4 py-4 border whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onEdit(book)}
                    className="mr-3 text-blue-700 hover:underline"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(book)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
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

export default BooksTable;
