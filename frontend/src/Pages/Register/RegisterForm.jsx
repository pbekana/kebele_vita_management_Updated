import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const EyeIcon = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.56-4.19M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18" />
    </svg>
  );

export default function RegisterForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone_number: "",
    password: "",
    confirm: "",
    otp: "",
  });

  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    // First name validation
    if (!form.firstname.trim()) {
      newErrors.firstname = "First name is required";
    } else if (/\d/.test(form.firstname)) {
      newErrors.firstname = "First name cannot contain numbers";
    }
    
    // Last name validation
    if (!form.lastname.trim()) {
      newErrors.lastname = "Last name is required";
    } else if (/\d/.test(form.lastname)) {
      newErrors.lastname = "Last name cannot contain numbers";
    }
    
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.phone_number.trim()) newErrors.phone = "Phone number is required";
    if (!form.password) newErrors.password = "Password is required";
    if (form.password && form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (form.password !== form.confirm)
      newErrors.confirm = "Passwords do not match";
    return newErrors;
  };

  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep1();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
      });

      if (res.data.requires_otp) {
        setAlert({ type: "success", message: "Account created! Please check your email for the OTP verification code." });
        setResendCooldown(60);
        setStep(2);
      } else {
        // Fallback if no OTP required
        setAlert({ type: "success", message: "Registration successful!" });
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.error || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStep2 = async (e) => {
    e.preventDefault();
    if (!form.otp.trim()) {
      setErrors({ otp: "OTP is required" });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: form.email,
        otp: form.otp,
      });

      setAlert({ type: "success", message: "OTP Verified! Redirecting to login..." });
      
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.error || "OTP verification failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setAlert(null);
    try {
      await axios.post("http://localhost:5000/api/auth/resend-otp", { email: form.email });
      setAlert({ type: "success", message: "A new OTP has been sent to your email." });
      setResendCooldown(60);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.error || "Failed to resend OTP. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 text-white p-8 text-center">
            <h1 className="text-2xl font-bold">Create Resident Account</h1>
            <p className="text-blue-100 mt-2">Heremata Mentina Kebele System</p>
            {/* Step indicators */}
            <div className="flex justify-center items-center gap-3 mt-4">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                step === 1 ? 'bg-white text-blue-700' : 'bg-blue-500 text-white'
              }`}>
                {step > 1 ? '✓' : '1'} Register
              </div>
              <div className="w-6 h-px bg-blue-400" />
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                step === 2 ? 'bg-white text-blue-700' : 'bg-blue-500 text-white opacity-60'
              }`}>
                2 Verify Email
              </div>
            </div>
          </div>

          <div className="p-8">
            {alert && (
              <div className={`mb-6 p-4 rounded-2xl text-sm ${alert.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {alert.message}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSubmitStep1} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">FIRST NAME *</label>
                  <input
                    type="text"
                    placeholder="Abebe"
                    value={form.firstname}
                    onChange={handleChange("firstname")}
                    className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.firstname && <p className="text-red-500 text-sm mt-1">{errors.firstname}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">LAST NAME *</label>
                  <input
                    type="text"
                    placeholder="Bikila"
                    value={form.lastname}
                    onChange={handleChange("lastname")}
                    className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.lastname && <p className="text-red-500 text-sm mt-1">{errors.lastname}</p>}
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
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={form.phone_number}
                    onChange={handleChange("phone_number")}
                    className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="Create password"
                      value={form.password}
                      onChange={handleChange("password")}
                      className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-4">
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm password"
                      value={form.confirm}
                      onChange={handleChange("confirm")}
                      className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-4">
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                  {errors.confirm && <p className="text-red-500 text-sm mt-1">{errors.confirm}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition"
                >
                  {loading ? "Registering..." : "Next"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitStep2} className="space-y-6">
                <div className="text-center mb-2">
                  <p className="text-sm text-gray-600">We sent a 6-digit code to</p>
                  <p className="font-semibold text-blue-700">{form.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Enter OTP *</label>
                  <p className="text-xs text-gray-500 mb-2">Check your inbox (and spam folder) for the 6-digit code.</p>
                  <input
                    type="text"
                    placeholder="123456"
                    value={form.otp}
                    onChange={handleChange("otp")}
                    className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 text-center tracking-widest text-lg"
                    maxLength={6}
                  />
                  {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition"
                >
                  {loading ? "Verifying..." : "Verify OTP & Activate Account"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading || resendCooldown > 0}
                    className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Didn't receive it? Resend OTP"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-sm text-gray-500 hover:underline"
                >
                  ← Back to Registration
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
