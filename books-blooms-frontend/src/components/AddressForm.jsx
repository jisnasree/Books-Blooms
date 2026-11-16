
function AddressForm({ formData, setFormData, inputClass }) {

    // Handle changes in all address fields
    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setFormData((previousForm) => ({
            ...previousForm,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    // Handle phone number: allow only 10 digits
    function handlePhoneChange(e) {
        const value = e.target.value.replace(/\D/g, "");

        if (value.length <= 10) {
            setFormData((previousForm) => ({
                ...previousForm,
                phone_number: value,
            }));
        }
    }

    const fieldClass =
        inputClass ||
        "w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-rose-600";

    return (
        <div className="grid gap-5 sm:grid-cols-2">

            {/* Address Type */}
            <div>
                <label htmlFor="label" className="mb-2 block text-sm font-medium text-gray-700">
                    Address Type
                </label>

                <select
                    id="label"
                    name="label"
                    value={formData.label}
                    onChange={handleChange}
                    required
                    className={fieldClass}
                >
                    <option value="HOME">Home</option>
                    <option value="WORK">Work</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>

            {/* Full Name */}
            <div>
                <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-gray-700">
                    Full Name
                </label>

                <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder="Enter full name"
                    className={fieldClass}
                />
            </div>

            {/* Phone Number */}
            <div>
                <label htmlFor="phone_number" className="mb-2 block text-sm font-medium text-gray-700">
                    Phone Number
                </label>

                <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone_number}
                    onChange={handlePhoneChange}
                    required
                    placeholder="Enter 10-digit phone number"
                    className={fieldClass}
                />
            </div>

            {/* Address Line 1 */}
            <div>
                <label htmlFor="address_line_1" className="mb-2 block text-sm font-medium text-gray-700">
                    Address Line 1
                </label>

                <input
                    id="address_line_1"
                    name="address_line_1"
                    type="text"
                    value={formData.address_line_1}
                    onChange={handleChange}
                    required
                    placeholder="Street address"
                    className={fieldClass}
                />
            </div>

            {/* Address Line 2 */}
            <div>
                <label htmlFor="address_line_2" className="mb-2 block text-sm font-medium text-gray-700">
                    Address Line 2 (Optional)
                </label>

                <input
                    id="address_line_2"
                    name="address_line_2"
                    type="text"
                    value={formData.address_line_2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, etc."
                    className={fieldClass}
                />
            </div>

            {/* City */}
            <div>
                <label htmlFor="city" className="mb-2 block text-sm font-medium text-gray-700">
                    City
                </label>

                <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Enter city"
                    className={fieldClass}
                />
            </div>

            {/* State */}
            <div>
                <label htmlFor="state" className="mb-2 block text-sm font-medium text-gray-700">
                    State
                </label>

                <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="Enter state"
                    className={fieldClass}
                />
            </div>

            {/* Postal Code */}
            <div>
                <label htmlFor="postal_code" className="mb-2 block text-sm font-medium text-gray-700">
                    ZIP / Postal Code
                </label>

                <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    value={formData.postal_code}
                    onChange={handleChange}
                    required
                    placeholder="Enter postal code"
                    className={fieldClass}
                />
            </div>

            {/* Country */}
            <div>
                <label htmlFor="country" className="mb-2 block text-sm font-medium text-gray-700">
                    Country
                </label>

                <input
                    id="country"
                    name="country"
                    type="text"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className={fieldClass}
                />
            </div>

            {/* Default Address */}
            <div className="sm:col-span-2">
                <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        name="is_default"
                        checked={formData.is_default}
                        onChange={handleChange}
                        className="h-4 w-4 accent-rose-700"
                    />

                    Set as default address
                </label>
            </div>

        </div>
    );
}

export default AddressForm;
