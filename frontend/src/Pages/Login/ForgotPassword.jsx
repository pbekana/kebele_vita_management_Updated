import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState(""); // From backend response
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setAlert({ type: "error", message: "Email or phone number is required" });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        identifier,
      });

      if (res.data.email) setEmail(res.data.email);
      setAlert({ type: "success", message: res.data.message });
      setStep(2);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.error || "Failed to request password reset.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim()) {
      setAlert({ type: "error", message: "OTP and new password are required" });
      return;
    }
    if (newPassword.length < 6) {
      setAlert({ type: "error", message: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email: email || identifier, // Fallback if backend didn't return email
        otp,
        newPassword,
      });

      setAlert({ type: "success", message: "Password reset successfully! Redirecting..." });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.error || "Failed to reset password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 to-blue-600 p-8 text-center text-white">
            <h1 className="text-2xl font-bold">Forgot Password</h1>
            <p className="text-sky-100 mt-2">Reset your account password</p>
          </div>

          <div className="p-8">
            {alert && (
              <div className={`mb-6 p-4 rounded-2xl text-sm ${alert.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {alert.message}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequestOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Email or Phone Number *</label>
                  <p className="text-xs text-gray-500 mb-2">Enter the email or phone number associated with your account.</p>
                  <input
                    type="text"
                    placeholder="you@example.com or 0912345678"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition"
                >
                  {loading ? "Sending..." : "Send Reset Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Reset Code (OTP) *</label>
                  <p className="text-xs text-gray-500 mb-2">Enter the 6-digit code sent to you.</p>
                  <input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 text-center tracking-widest text-lg"
                    maxLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">New Password *</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-slate-500">
              Remember your password?{" "}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
