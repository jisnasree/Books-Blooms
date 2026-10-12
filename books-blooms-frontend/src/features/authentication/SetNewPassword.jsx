import Footer from "../../components/Footer"
import Header from "../../components/Header"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
function SetNewPassword() {
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/forgot/password-reset/",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        reset_token: resetToken,
                        new_password: password,
                    }),
                }
            );

            const data = await response.json();

             if (!response.ok) {
                setError(
                    Object.values(data)
                        .flat()
                        .join(" ") || "Unable to update your password."
                );
                return;
            }

            // Navigate only after Django confirms success
            navigate("/password-update-success", {replace: true,});
        } catch (error) {
            setError(
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };
    setMessage("Password validation successful.");


    return (
        <div className="min-h-screen flex flex-col bg-[#FBFAF7]">
            <Header />
            <main className="flex flex-1 items-center justify-center px-4 py-8">
                <div className="mx-auto w-full max-w-lg p-6 bg-white border border-gray-200 space-y-4">
                    <h2 className="mb-6 text-left text-2xl font-bold text-black-900">
                        Set a new password
                    </h2>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Create a password"
                                value={password}
                                minLength={8}
                                onChange={(e)=>setPassword(e.target.value)}
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
                                name="confirmPassword"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                minLength={8}
                                onChange={(e)=>setConfirmPassword(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-green-900 px-4 py-3 font-semibold text-white transition hover:bg-rose-800"
                        >
                            UPDATE PASSWORD
                        </button>

                        <p className="mt-6 text-center text-sm text-gray-500">
                            Use at least 8 characters with a mix of numbers and characters
                        </p>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
export default SetNewPassword