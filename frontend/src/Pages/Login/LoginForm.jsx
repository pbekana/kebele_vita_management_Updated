// import { useState } from "react";
// import { useNavigate, Link } from 'react-router-dom';

// // Mock axios   connection in this 
// const axios = {
//   post: async () => {
//     await new Promise((r) => setTimeout(r, 800));
//     return { data: { message: "Login successful!" } };
//   },
// };

// const EyeIcon = ({ open }) =>
//   open ? (
//     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//       <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//       <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//     </svg>
//   ) : (
//     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//       <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.56-4.19M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18" />
//     </svg>
//   );

// const Spinner = () => (
//   <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
//   </svg>
// );

// function InputField({ label, id, error, children, required }) {
//   return (
//     <div className="flex flex-col gap-1">
//       <label htmlFor={id} className="text-xs font-semibold tracking-widest text-sky-700 uppercase">
//         {label}{required && <span className="text-red-400 ml-0.5">*</span>}
//       </label>
//       {children}
//       {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
//     </div>
//   );
// }

// export default function LoginForm() {
//   const [form, setForm] = useState({ identifier: "", password: "" });
//   const [errors, setErrors] = useState({});
//   const [showPw, setShowPw] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [alert, setAlert] = useState(null);
//   const navigate = useNavigate();

//   const change = (field) => (e) => {
//     setForm((f) => ({ ...f, [field]: e.target.value }));
//   };

//   const submit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setAlert(null);

//     try {
//       await axios.post("/api/login", form);

//       const email = form.identifier.toLowerCase();
//       let redirectPath = "/dashboard";

//       if (email.includes("admin")) {
//         redirectPath = "/admin";
//       }

//       localStorage.setItem("isLoggedIn", "true");
//       localStorage.setItem("userRole", email.includes("admin") ? "admin" : "resident");

//       setAlert({ type: "success", message: "Login successful!" });

//       setTimeout(() => navigate(redirectPath), 1000);
//     } catch {
//       setAlert({ type: "error", message: "Invalid credentials" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const quickLogin = (role) => {
//     const logins = {
//       admin: { identifier: "admin@kebele.gov.et", password: "admin123" },
//       resident: { identifier: "resident@example.com", password: "123456" }
//     };
//     setForm(logins[role]);
//     setAlert({ type: "success", message: `Quick ${role} login ready!` });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-32 -right-32 w-80 h-80 bg-sky-100/60 rounded-full blur-3xl" />
//         <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl" />
//       </div>

//       <div className="relative w-full max-w-lg">
//         <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
//           <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-8 pt-8 pb-7">
//             <div className="flex items-center gap-3 mb-4">
//               <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🏛️</div>
//               <p className="text-sky-100 text-xs font-semibold tracking-widest uppercase">Kebele Vital System</p>
//             </div>
//             <h1 className="text-white text-2xl font-bold">Welcome Back</h1>
//             <p className="text-sky-200/80 text-sm mt-1">Resident Portal</p>
//           </div>

//           <form onSubmit={submit} className="px-8 py-8 space-y-6">
//             {alert && (
//               <div className={`p-4 rounded-xl text-sm ${alert.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
//                 {alert.message}
//               </div>
//             )}

//             <InputField label="Email or Phone Number" required>
//               <input
//                 type="text"
//                 placeholder="you@example.com"
//                 value={form.identifier}
//                 onChange={change("identifier")}
//                 className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-sky-400"
//               />
//             </InputField>

//             <InputField label="Password" required>
//               <div className="relative">
//                 <input
//                   type={showPw ? "text" : "password"}
//                   placeholder="Enter password"
//                   value={form.password}
//                   onChange={change("password")}
//                   className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-sky-400 pr-12"
//                 />
//                 <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-4 text-gray-400">
//                   <EyeIcon open={showPw} />
//                 </button>
//               </div>
//             </InputField>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
//             >
//               {loading ? "Signing in..." : "Sign In"}
//             </button>

//             <div className="pt-4 border-t">
//               <p className="text-xs text-gray-500 mb-3 text-center">Quick Test</p>
//               <div className="flex gap-2">
//                 <button type="button" onClick={() => quickLogin('admin')} className="flex-1 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl text-sm">Admin Login</button>
//                 <button type="button" onClick={() => quickLogin('resident')} className="flex-1 py-3 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-xl text-sm">Resident Login</button>
//               </div>
//             </div>

//             <p className="text-center text-sm text-slate-500">
//               Staff Member? <Link to="/staff-login" className="text-indigo-600 font-semibold hover:underline">Staff Login</Link>
//             </p>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
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

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const change = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
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

      // Store token and role from actual backend response
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user.id);

      setAlert({ type: "success", message: "Login successful! Redirecting..." });

      // Redirect based on real role from backend
      let redirectPath = "/dashboard";
      if (user.role === "admin") redirectPath = "/admin";
      else if (user.role === "kebele_staff") redirectPath = "/staff";

      setTimeout(() => navigate(redirectPath), 1000);

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-sky-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-8 pt-8 pb-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🏛️</div>
              <p className="text-sky-100 text-xs font-semibold tracking-widest uppercase">Kebele Vital System</p>
            </div>
            <h1 className="text-white text-2xl font-bold">Welcome Back</h1>
            <p className="text-sky-200/80 text-sm mt-1">Resident Portal</p>
          </div>

          <form onSubmit={submit} className="px-8 py-8 space-y-6">
            {alert && (
              <div className={`p-4 rounded-xl text-sm ${alert.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {alert.message}
              </div>
            )}

            <InputField label="Email" id="email" error={errors.email} required>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={change("email")}
                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-sky-400"
              />
            </InputField>

            <InputField label="Password" id="password" error={errors.password} required>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={change("password")}
                  className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-sky-400 pr-12"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-4 text-gray-400">
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </InputField>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="flex flex-col items-center gap-2 mt-4 text-sm text-slate-500">
              <Link to="/forgot-password" className="text-blue-600 font-semibold hover:underline">
                Forgot Password?
              </Link>
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register</Link>
              </p>
            </div>

            <p className="text-center text-sm text-slate-500">
              Staff Member?{" "}
              <Link to="/staff-login" className="text-indigo-600 font-semibold hover:underline">Staff Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}