import Footer from "../../components/Footer"
import Header from "../../components/Header"
function ForgotPassword() {
    return (
        <div className="min-h-screen flex flex-col bg-[#FBFAF7]">
            <Header />
            <main className="flex flex-1 items-center justify-center px-4 py-8">
                <div className="mx-auto w-full max-w-lg p-6 bg-white border border-gray-200 space-y-4">
                    <h2 className="mb-6 text-left text-2xl font-bold text-black-900">
                        Forgot your password?
                    </h2>

                    <form className="space-y-4 " >
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="name@example.in"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-rose-800 focus:ring-2 focus:ring-rose-200"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-green-900 px-4 py-3 font-semibold text-white transition hover:bg-rose-800"
                        >
                            Login
                        </button>


                        <p className="mt-4 text-left text-sm text-gray-600">
                            Forgot password?
                            <a
                                href="/login"
                                className="font-semibold text-rose-900 hover:text-rose-800 hover:underline"
                            >
                                Send reset code
                            </a>
                        </p>
                        <p className="mt-6 text-center text-sm text-gray-500">
                           Remember your password?{" "}
                            <a
                                href="/login"
                                className="font-semibold text-rose-900 hover:underline"
                            >
                                Back to Login
                            </a>
                        </p>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
export default ForgotPassword