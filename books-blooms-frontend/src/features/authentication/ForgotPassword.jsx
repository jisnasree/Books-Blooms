import Footer from "../../components/Footer"
import Header from "../../components/Header"
import { useNavigate , Link} from "react-router-dom";
import { useState } from "react";
import { AUTH_FORGOT_PWD_URL } from "../../constants"; 

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        AUTH_FORGOT_PWD_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : "Unable to process your request.";

        setError(errorMessage || "Unable to process your request.");
        return;
      }

      setMessage(
        data.message || "If an account exists for this email, a reset code will be sent."
      );

      // Continue to the reset-code screen.
      navigate("/verify-reset-code", {
        state: { email: email },
      });
    } catch (error) {
      console.error("Forgot password error:", error);
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
                        Forgot your password?
                    </h2>

                    <form className="space-y-4 " onSubmit={handleSubmit}>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="name@example.in"
                                value={email}
                                onChange={(e)=>setEmail(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl px-4 py-3 font-semibold text-white bg-gradient-to-r from-amber-400 via-orange-500 to-orange-700 hover:from-amber-500 hover:via-orange-600 hover:to-orange-800"
                        >
                            Login
                        </button>

                        <p className="mt-6 text-center text-sm text-gray-500">
                           Remember your password?{" "}
                            <Link
                                to="/login"
                                className="font-semibold text-rose-900 hover:underline"
                            >
                                Back to Login
                            </Link>
                        </p>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
export default ForgotPassword