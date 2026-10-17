import Footer from "../../components/Footer"
import Header from "../../components/Header"
import { Link } from 'react-router-dom'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_LOGIN_URL } from "../../constants";
import { HOME_URL } from "../../constants";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("")

    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(
                AUTH_LOGIN_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                    data.detail ||
                    data.non_field_errors?.[0] ||
                    "Login failed. Please check your details."
                );
                return;
            }

            setMessage(data.message || "Login successful!");
            // Save the token for future authenticated API requests.
            sessionStorage.setItem("authToken", data.token);
            console.log("Login successful:", data);

            // Navigate to the admin dashboard.
            navigate(HOME_URL);
        } catch (err) {
            setError("Unable to connect to the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex flex-col bg-[#FBFAF7]">
            <Header />
            <main className="flex flex-1 items-center justify-center px-4 py-8">
                <div className="mx-auto w-full max-w-lg p-6 bg-white border border-gray-200 space-y-4">
                    <h2 className="mb-6 text-left text-2xl font-bold text-black-900">
                        Login as an existing User
                    </h2>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="name@example.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-green-900 px-4 py-3 font-semibold text-white transition hover:bg-rose-900"
                        >
                            Login
                        </button>

                        {error && (
                            <p className="text-sm text-red-600" role="alert">
                                {error}
                            </p>
                        )}

                        {message && (
                            <p className="text-sm text-green-700" role="status">
                                {message}
                            </p>
                        )}


                        <p className="mt-4 text-left text-sm text-gray-600">
                            Forgot password?{" "}
                            <Link
                                to="/forgot-password"
                                className="font-semibold text-rose-900 hover:text-rose-800 hover:underline"
                            >
                                Reset Here
                            </Link>
                        </p>

                        <p className="mt-4 text-left text-sm text-gray-600">
                            Don't have an acoount?{" "}
                            <Link
                                to="/register"
                                className="font-semibold text-rose-900 hover:text-rose-800 hover:underline"
                            >
                                SignUp Here
                            </Link>
                        </p>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
export default Login