import Footer from "../../components/Footer"
import Header from "../../components/Header"
import { Link } from 'react-router-dom'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_LOGIN_URL } from "../../constants";
import { HOME_URL } from "../../constants";
import { useContext } from "react";
import { UserContext } from "../../context/UserContext";
import { ADMIN_URL } from "../../constants";
import GoogleLoginButton from "./GoogleLoginButton"
import loginImage from "../../assets/login.png";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("")
    const { user, setUser } = useContext(UserContext);

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
            //setUser({ isAdmin: data.isAdmin, isAuthenticated: data.isAuthenticated, first_name: data.first_name })
            setUser(data)
            data.isAdmin ? navigate(ADMIN_URL) : navigate(HOME_URL);
            setLoading(false)

            // // Navigate to the admin dashboard.
            //navigate(HOME_URL);
        } catch (err) {
            setError("Unable to connect to the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="flex min-h-screen flex-col bg-orange-50/40">
            <Header />

            <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
                <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-orange-100 md:min-h-[600px] md:grid-cols-2">
                    <section className="relative min-h-72 overflow-hidden md:min-h-full">
                        <img
                            src={loginImage}
                            alt="Hands typing on a laptop"
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center p-7 text-center text-white sm:p-10">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
                                Already have an account?
                            </p>
                            
                            <p className="mt-3 max-w-sm text-sm leading-6 text-white/85">
                                Sign in and pick up where your next favorite story begins.
                            </p>
                            <Link
                                to="/register"
                                className="mt-6 inline-flex rounded-lg px-5 py-3 text-sm font-semibold text-white transition bg-gradient-to-r from-amber-400 via-orange-500 to-orange-700 hover:from-amber-500 hover:via-orange-600 hover:to-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                New here? Create an account
                            </Link>
                        </div>
                    </section>

                    <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
                        <div className="w-full max-w-md">
                            
                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                Sign in to your account
                            </h2>
                            

                            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label
                                        htmlFor="login-email"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Email address
                                    </label>
                                    <input
                                        id="login-email"
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="mb-1.5 flex items-center justify-between gap-3">
                                        <label
                                            htmlFor="login-password"
                                            className="block text-sm font-medium text-slate-700"
                                        >
                                            Password
                                        </label>
                                        <Link
                                            to="/forgot-password"
                                            className="text-sm font-semibold text-orange-700 hover:text-orange-800 hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <input
                                        id="login-password"
                                        type="password"
                                        name="password"
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-100"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl px-4 py-3 font-semibold text-white bg-gradient-to-r from-amber-400 via-orange-500 to-orange-700 hover:from-amber-500 hover:via-orange-600 hover:to-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Signing in..." : "Sign in"}
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
                            </form>

                            <div className="my-6 flex items-center gap-4">
                                <span className="h-px flex-1 bg-slate-200" />
                                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Or
                                </span>
                                <span className="h-px flex-1 bg-slate-200" />
                            </div>

                            <div className="flex justify-center">
                                <GoogleLoginButton />
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
export default Login;