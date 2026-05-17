import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

export default function StaffLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setAlert(null);
    setErrors({});

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: form.email,
        password: form.password,
      });

      const { user, token } = res.data;

      // Block non-staff users
      if (user.role !== 'kebele_staff') {
        setAlert({ type: "error", message: "Access denied. This portal is for staff only." });
        return;
      }

      // Save token and role
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user.id);

      setAlert({ type: "success", message: "Login successful! Redirecting..." });

      setTimeout(() => navigate("/staff/dashboard"), 1000);

    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.error || "Invalid email or password."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-700 to-blue-700 p-10 text-white text-center">
            <div className="text-5xl mb-4">🛡️</div>
            <h1 className="text-3xl font-bold">Staff Portal</h1>
            <p className="text-indigo-200 mt-2">Kebele Vital Records System</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {alert && (
                <div className={`p-4 rounded-2xl text-sm ${alert.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {alert.message}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Staff Email</label>
                <input
                  type="email"
                  placeholder="staff@kebele.gov.et"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-white mt-6">
          Resident?{" "}
          <a href="/login" className="underline hover:text-indigo-300">Go to Resident Login</a>
        </p>
      </div>
    </div>
  );
}
