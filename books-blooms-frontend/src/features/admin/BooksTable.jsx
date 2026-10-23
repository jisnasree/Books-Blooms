{/* Books table */ }
function BooksTable({
  books = [],
  onEdit = () => {},
  onDelete = () => {},
}) {
    return (

        <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                    <tr>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Author</th>
                        <th className="px-4 py-3">Format</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {books.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-8 text-center">
                                No books match your search.
                            </td>
                        </tr>
                    ) : (
                        books.map((book) => (
                            <tr key={book.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 font-medium text-gray-800">
                                    {book.title}
                                </td>

                                <td className="px-4 py-4 text-gray-600">
                                    {book.author_name || "—"}
                                </td>

                                <td className="px-4 py-4 text-gray-600">
                                    {book.physical_variants
                                        ?.map((variant) => variant.format)
                                        .join(", ") || "—"}
                                </td>

                                <td className="px-4 py-4 text-gray-600">
                                    {book.physical_variants
                                        ?.map(
                                            (variant) =>
                                                `${variant.currency} ${Number(variant.price).toFixed(2)}`
                                        )
                                        .join(", ") || "—"}
                                </td>

                                <td className="px-4 py-4">
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

    )
}
export default BooksTable