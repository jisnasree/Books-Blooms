
function BookForm({
    formData,
    authors,
    categories,
    onChange,
    onSubmit,
    onClose,
    editingBook,
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {editingBook ? "Edit Book" : "Add Book"}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
                        aria-label="Close form"
                    >
                        &times;
                    </button>
                </div>

                {/* Book Form */}
                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Book Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={onChange}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-700"
                            placeholder="Enter book title"
                        />
                    </div>

                    {/* Author */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Author
                        </label>
                        <select
                            name="author"
                            value={formData.author}
                            onChange={onChange}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-700"
                        >
                            <option value="">Select an author</option>
                            {authors.map((author) => (
                                <option key={author.id} value={author.id}>
                                    {author.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={onChange}
                            rows="4"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-700"
                            placeholder="Enter book description"
                        />
                    </div>

                    {/* Cover URL */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Cover Image URL
                        </label>
                        <input
                            type="url"
                            name="cover_url"
                            value={formData.cover_url}
                            onChange={onChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-700"
                            placeholder="https://example.com/book-cover.jpg"
                        />
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Rating
                        </label>
                        <input
                            type="number"
                            name="rating"
                            value={formData.rating}
                            onChange={onChange}
                            min="0"
                            max="5"
                            step="0.1"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-700"
                            placeholder="0 to 5"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Category
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={onChange}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-700"
                        >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Format */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Format
                        </label>
                        <select
                            name="format"
                            value={formData.format}
                            onChange={onChange}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-700"
                        >
                            <option value="Paperback">Paperback</option>
                            <option value="Hardcover">Hardcover</option>
                        </select>
                    </div>

                    {/* Price and Currency */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Price
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={onChange}
                                min="0"
                                step="0.01"
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-700"
                                placeholder="Enter price"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Currency
                            </label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={onChange}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-700"
                            >
                                <option value="INR">INR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>

                    {/* Stock Quantity */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Stock Quantity
                        </label>
                        <input
                            type="number"
                            name="stock_quantity"
                            value={formData.stock_quantity}
                            onChange={onChange}
                            min="0"
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-700"
                            placeholder="Enter stock quantity"
                        />
                    </div>

                    {/* Featured */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured}
                            onChange={onChange}
                            id="featured"
                            className="h-4 w-4 accent-rose-700"
                        />
                        <label
                            htmlFor="featured"
                            className="text-sm text-gray-700"
                        >
                            Featured book
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 border-t pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="rounded-lg bg-rose-700 px-5 py-2 text-white hover:bg-rose-800"
                        >
                            {editingBook ? "Update Book" : "Save Book"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default BookForm;
