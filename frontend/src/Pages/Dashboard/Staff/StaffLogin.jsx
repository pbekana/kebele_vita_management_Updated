import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";

function InputField({ label, id, error, children, required }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold tracking-widest text-sky-700 uppercase">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function StaffLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const change = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
    return newErrors;
  };

  const submit = async (e) => {
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
        setLoading(false);
        return;
      }

      // Save token and user info
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user.id);

      setAlert({ type: "success", message: "Login successful! Redirecting..." });

      // Always go to staff dashboard — position-based routing handled there
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
          <div className="bg-gradient-to-r from-indigo-700 to-blue-700 p-8 text-white text-center">
            <div className="text-4xl mb-4">🛡️</div>
            <h1 className="text-2xl font-bold">Staff Portal</h1>
            <p className="text-indigo-200 mt-2">Kebele Vital Records System</p>
          </div>

          <div className="p-8">
            {alert && (
              <div className={`mb-6 p-4 rounded-2xl text-sm ${alert.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {alert.message}
              </div>
            )}

            <form onSubmit={submit} className="space-y-6">
              <InputField label="Staff Email" id="email" error={errors.email} required>
                <input
                  id="email"
                  type="email"
                  placeholder="staff@kebele.gov.et"
                  value={form.email}
                  onChange={change("email")}
                  className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500"
                />
              </InputField>

              <InputField label="Password" id="password" error={errors.password} required>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={change("password")}
                  className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500"
                />
              </InputField>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition"
              >
                {loading ? "Signing in..." : "Staff Sign In"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Resident?{" "}
          <Link to="/login" className="text-indigo-400 hover:underline">Go to Resident Login</Link>
        </p>
      </div>
    </div>
  );
}