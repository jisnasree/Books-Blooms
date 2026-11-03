import { Link, useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

function OrderFailure() {
    const { state } = useLocation();

    const order = state?.order;
    const errorMessage = state?.errorMessage || "";
    const paymentId = state?.paymentId || "";

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#FBFAF7] px-4 py-20">
                <div className="mx-auto max-w-2xl rounded-xl border bg-white p-8 text-center">

                    {/* Failure icon */}
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl font-bold text-red-600">
                        ✕
                    </div>

                    <h1 className="mt-5 text-2xl font-semibold text-gray-800">
                        Payment Failed
                    </h1>

                    <p className="mt-3 text-gray-600">
                        {errorMessage ||
                            "Your payment could not be completed. No money has been charged for this attempt."}
                    </p>

                    {/* Order info */}
                    {order && (
                        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                            <p>
                                Order <span className="font-semibold">#{order.id}</span>
                                {" · "}
                                Total <span className="font-semibold">₹{Number(order.total_amount).toFixed(2)}</span>
                            </p>
                            <p className="mt-1 text-gray-500">
                                Your order is saved. You can retry payment anytime.
                            </p>
                        </div>
                    )}

                    {/* Payment reference for support */}
                    {paymentId && (
                        <p className="mt-4 break-all text-xs text-gray-500">
                            Payment reference ID:{" "}
                            <span className="font-mono">{paymentId}</span>
                            {" "}— share this with support if money was deducted.
                        </p>
                    )}

                    {/* Actions */}
                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">

                        {order && (
                            <Link
                                to={`/orders/${order.id}`}
                                className="w-full rounded-lg bg-rose-700 px-6 py-3 font-medium text-white hover:bg-rose-800 sm:w-auto"
                            >
                                Retry Payment
                            </Link>
                        )}

                        <Link
                            to="/orders"
                            className="w-full rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-100 sm:w-auto"
                        >
                            View My Orders
                        </Link>

                    </div>

                </div>
            </main>

            <Footer />
        </>
    );
}

export default OrderFailure;