import { useLocation, useNavigate } from "react-router-dom";

interface LocationState {
  orderId: string;
}

export default function OrderConfirm() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve orderId passed from checkout via navigate state
  const state = location.state as LocationState | null;
  const orderId = state?.orderId;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10 text-center">

        {/* Success Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        {/* Order ID */}
        {orderId ? (
          <div className="inline-block bg-gray-100 rounded-lg px-4 py-2 mb-8">
            <span className="text-xs text-gray-500">Order ID: </span>
            <span className="text-sm font-semibold text-gray-800">{orderId}</span>
          </div>
        ) : (
          <p className="text-xs text-red-400 mb-8">No order ID found.</p>
        )}

        {/* Back to Home Button */}
        <button
          onClick={() => navigate("/")}
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-700
            text-white font-semibold text-sm py-3 transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
