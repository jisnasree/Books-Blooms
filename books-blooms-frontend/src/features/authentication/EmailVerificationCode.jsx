import Header from "../../components/Header"
import Footer from "../../components/Footer";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AUTH_VERIFY_EMAIL_URL, AUTH_EMAIL_RESEND_CODE_URL } from "../../constants";

function EmailVerificationCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const location = useLocation();
  const email = location.state?.email || "";
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);


  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);


  function handleEmailVerificationCode(e) {
    setCode(e.target.value)
  }

  const handleResendCode = async () => {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const response = await fetch(AUTH_EMAIL_RESEND_CODE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : "Unable to resend the code."
        );
        return;
      }

      setMessage("A new verification code has been sent.");
      setCountdown(30);
    } catch (error) {
      console.error("Resend code error:", error);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setResending(false);
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        AUTH_VERIFY_EMAIL_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            code: code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : "Email verification failed."
        );
        return;
      }

      navigate("/login");
    }
    catch (error) {
      console.error("Email verification error:", error);
      setError("Unable to connect to the server. Please try again.");
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FBFAF7]">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-8 shadow-sm">

          {/* Heading */}
          <div className="mb-6 text-center">
            <div className="mb-4 text-4xl">✉️</div>

            <h2 className="text-2xl font-bold text-green-900">
              Verify reset code
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              We have sent a 6-digit verification code to {email}.
              {" "}Please enter the code below.
            </p>
          </div>

          {/* Verification form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="verification_code"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Verification Code
              </label>

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

              <input
                id="verification_code"
                name="code"
                type="text"
                value={code}
                onChange={handleEmailVerificationCode}
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="Enter 6-digit code"
                autoComplete="one-time-code"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl px-4 py-3 font-semibold text-white bg-gradient-to-r from-amber-400 via-orange-500 to-orange-700 hover:from-amber-500 hover:via-orange-600 hover:to-orange-800"
            >
              Verify Email
            </button>

            <p className="text-center text-sm text-gray-600">
              Didn't receive the code?{" "}

              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || resending}
                className="font-semibold text-rose-900 hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
              >
                {resending
                  ? "Sending..."
                  : countdown > 0
                    ? `Resend code in ${countdown}s`
                    : "Resend Code"}
              </button>
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already verified?{" "}
            <Link
              to="/login"
              className="font-semibold text-rose-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
export default EmailVerificationCode