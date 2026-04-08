import { useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface FormFields {
  fullName: string;
  phone: string;
  street: string;
  city: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
}

export default function Checkout() {
  const navigate = useNavigate();

  // --- State ---
  const [form, setForm] = useState<FormFields>({
    fullName: "",
    phone: "",
    street: "",
    city: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // --- Validation ---
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    }
    if (!form.street.trim()) {
      newErrors.street = "Street address is required.";
    }
    if (!form.city.trim()) {
      newErrors.city = "City is required.";
    }

    setErrors(newErrors);

    // Returns true if no errors
    return Object.keys(newErrors).length === 0;
  };

  // --- Input Change Handler ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear the error for this field as user types
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // --- Form Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    // Stop if validation fails
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: "pending",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to place order. Please try again.");
      }

      const data = await response.json();

      // Navigate to order confirm and pass orderId via state
      navigate("/order-confirm", {
        state: { orderId: data.orderId },
      });
    } catch (err: any) {
      setServerError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Checkout</h1>
        <p className="text-sm text-gray-500 mb-8">
          Fill in your delivery details below.
        </p>

        {/* Server Error Banner */}
        {serverError && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800
                placeholder-gray-400 outline-none transition
                focus:ring-2 focus:ring-blue-500
                ${errors.fullName ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800
                placeholder-gray-400 outline-none transition
                focus:ring-2 focus:ring-blue-500
                ${errors.phone ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Street Address */}
          <div>
            <label
              htmlFor="street"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Street Address
            </label>
            <input
              id="street"
              name="street"
              type="text"
              value={form.street}
              onChange={handleChange}
              placeholder="123 Main Street"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800
                placeholder-gray-400 outline-none transition
                focus:ring-2 focus:ring-blue-500
                ${errors.street ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
            />
            {errors.street && (
              <p className="mt-1 text-xs text-red-500">{errors.street}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              placeholder="New York"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800
                placeholder-gray-400 outline-none transition
                focus:ring-2 focus:ring-blue-500
                ${errors.city ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
            />
            {errors.city && (
              <p className="mt-1 text-xs text-red-500">{errors.city}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg
              bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white font-semibold text-sm py-3 transition"
          >
            {loading ? (
              <>
                {/* Spinner */}
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Placing Order...
              </>
            ) : (
              "Place Order"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
