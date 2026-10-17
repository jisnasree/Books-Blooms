
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"
import { AUTH_REGISTER_URL } from "../../constants";

function Register() {

    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirm_password: "",
    })

    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)


    const handleChange = (event) => {
        const { name, value } = event.target

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }))
    }

    const handleSubmit = async (event) => {

        event.preventDefault()
        setError("")


        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match.")
            return
        }

        setLoading(true)


        try {
            const response = await fetch(
                AUTH_REGISTER_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        email: formData.email,
                        password: formData.password,
                    }),
                }
            )

            const data = await response.json()

            if (!response.ok) {
                const errorMessage =
                    typeof data === "object"
                        ? Object.values(data).flat().join(" ")
                        : "Registration failed."

                setError(errorMessage || "Registration failed.")
                return
            }

            navigate("/verify-email", {
                state: { email: formData.email },
            })
        } catch (error) {
            setError("Unable to connect to the server. Please try again.")
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="flex flex-col bg-[#FBFAF7]">
            <Header />

            <div className="mx-auto w-full max-w-lg p-6 bg-white border border-gray-200 mt-6 mb-6 space-y-4">
                <h2 className="mb-6 text-left text-2xl font-bold text-black-900">
                    Registration
                </h2>

                <form className="space-y-4" onSubmit={handleSubmit} >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                First Name
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                placeholder="Enter your first name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Last Name
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                placeholder="Enter your last name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            placeholder="name@example.in"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirm_password"
                            placeholder="Re-enter your password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
                            required
                        />
                    </div>


                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="terms"
                            id="terms"
                            required
                            className="h-4 w-4 accent-rose-900"
                        />

                        <label htmlFor="terms" className="text-sm text-gray-700">
                            I agree to the{" "}
                            <a href="/terms" className="text-rose-900 underline">
                                Terms and Conditions
                            </a>
                        </label>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600" role="alert">
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-green-900 px-4 py-3 font-semibold text-white transition hover:bg-rose-800"
                    >
                        Create Account
                    </button>


                    <p className="mt-4 text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-rose-900 hover:text-rose-800 hover:underline"
                        >
                            Login
                        </Link>
                    </p>


                </form>
            </div>

            <Footer />
        </div>
    );

}
export default Register