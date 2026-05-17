import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const EyeIcon = ({ open }) =>
  open ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.56-4.19M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18"
      />
    </svg>
  );

export default function RegisterForm() {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone_number: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.firstname.trim()) newErrors.firstname = "First name is required";
    if (!form.lastname.trim()) newErrors.lastname = "Last name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.phone_number.trim()) newErrors.phone = "Phone number is required";
    if (!form.password) newErrors.password = "Password is required";
    if (form.password && form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (form.password !== form.confirm)
      newErrors.confirm = "Passwords do not match";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
// Add this in handleSubmit, before the axios call
console.log("Submitting role:", form.role);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
      });

      setAlert({
        type: "success",
        message: "✅ Registration successful! Redirecting to login...",
      });

      // Reset form
      setForm({
        firstname: "",
        lastname: "",
        email: "",
        phone_number: "",
        password: "",
        confirm: "",
      });

      setErrors({});

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setAlert({
        type: "error",
        message:
          err.response?.data?.error || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 text-white p-8 text-center">
            <h1 className="text-2xl font-bold">Create Resident Account</h1>
            <p className="text-blue-100 mt-2">
              Join Heremata Mentina Kebele System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {alert && (
              <div
                className={`p-4 rounded-2xl text-sm ${alert.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {alert.message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                FIRST NAME *
              </label>
              <input
                type="text"
                placeholder="Abebe"
                value={form.firstname}
                onChange={handleChange("firstname")}
                className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500"
              />
              {errors.firstname && (
                <p className="text-red-500 text-sm mt-1">{errors.firstname}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                LAST NAME *
              </label>
              <input
                type="text"
                placeholder="Bikila"
                value={form.lastname}
                onChange={handleChange("lastname")}
                className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500"
              />
              {errors.lastname && (
                <p className="text-red-500 text-sm mt-1">{errors.lastname}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">EMAIL *</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange("email")}
                className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                placeholder="0912345678"
                value={form.phone_number}
                onChange={handleChange("phone_number")}
                className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Create password"
                  value={form.password}
                  onChange={handleChange("password")}
                  className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-4"
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  value={form.confirm}
                  onChange={handleChange("confirm")}
                  className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-4"
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {errors.confirm && (
                <p className="text-red-500 text-sm mt-1">{errors.confirm}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
