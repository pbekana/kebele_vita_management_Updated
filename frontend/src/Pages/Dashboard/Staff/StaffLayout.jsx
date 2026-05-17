import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  FileText,
  AlertTriangle,
  IdCard,
  LogOut,
} from "lucide-react";

const StaffLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = localStorage.getItem("role") || "staff";

  const menuItems = [
    {
      path: "/staff/dashboard",
      label: "My Dashboard",
      icon: Users, // Using Users as a placeholder icon since it's already imported
      role: "kebele_staff", // Every staff member has this role
    },
    {
      path: "/staff/death",
      label: "Death Certificates",
      icon: FileText,
      role: "death_officer",
    },

    {
      path: "/staff/birth",
      label: "Birth Certificates",
      icon: Users,
      role: "birth_officer",
    },

    {
      path: "/staff/marriage",
      label: "Marriage Certificates",
      icon: Shield,
      role: "marriage_officer",
    },

    {
      path: "/staff/reports",
      label: "Resident Reports",
      icon: AlertTriangle,
      role: "reports_officer",
    },

    {
      path: "/staff/id",
      label: "ID Management",
      icon: IdCard,
      role: "id_officer",
    },
  ];

  // Only show allowed modules
  const allowedMenu = menuItems.filter(
    (item) =>
      userRole === item.role || userRole === "admin"
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate("/staff-login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <div className="w-72 bg-white border-r shadow-sm fixed h-screen">

        {/* Logo */}
        <div className="p-6 border-b">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl">
              🛡️
            </div>

            <div>
              <h1 className="font-bold text-xl text-gray-800">
                Kebele Vital
              </h1>

              <p className="text-xs text-gray-500">
                Staff Portal
              </p>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <div className="p-6">

          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">
            My Modules
          </p>

          <nav className="space-y-2">

            {allowedMenu.map((item) => {
              const Icon = item.icon;

              const isActive =
                location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />

                  {item.label}
                </Link>
              );
            })}

          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-6 left-0 w-full px-6">

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition font-medium"
          >
            <LogOut className="w-5 h-5" />

            Logout
          </button>

        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-72">
        <Outlet />
      </div>
    </div>
  );
};

export default StaffLayout;