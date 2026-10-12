
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";

function PasswordUpdateSuccess() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBFAF7]">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">

          {/* Success tick mark */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-green-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          </div>

          {/* Success message */}
          <h2 className="text-2xl font-bold text-green-900">
            Password Updated!
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Your password has been successfully updated.
            You can now sign in using your new password.
          </p>

          {/* Return to Login */}
          <Link
            to="/login"
            className="mt-8 inline-block w-full rounded-lg bg-green-900 px-4 py-3 font-semibold text-white transition hover:bg-rose-800"
          >
            RETURN TO LOGIN
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PasswordUpdateSuccess;
