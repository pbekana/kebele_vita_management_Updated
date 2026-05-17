import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  LogOut,
  FileText,
} from "lucide-react";

export default function ReportsOfficerDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/staff-login");
      return;
    }

    // Dummy local data
    setReports([
      {
        id: 1,
        resident: "Abel Kebede",
        title: "Water Supply Problem",
        category: "Infrastructure",
        description:
          "There has been no water service for three days.",
        date: "2026-05-10",
        status: "pending",
      },

      {
        id: 2,
        resident: "Sara Bekele",
        title: "Noise Complaint",
        category: "Community",
        description:
          "Loud music during nighttime in the neighborhood.",
        date: "2026-05-11",
        status: "in_review",
      },

      {
        id: 3,
        resident: "Daniel Tadesse",
        title: "Road Damage",
        category: "Roads",
        description:
          "Main road near market area is damaged badly.",
        date: "2026-05-12",
        status: "resolved",
      },
    ]);

    setLoading(false);
  }, []);

  const handleResolve = (id) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === id
          ? { ...report, status: "resolved" }
          : report
      )
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/staff-login");
  };

  const pendingReports = reports.filter(
    (r) => r.status === "pending"
  ).length;

  const inReviewReports = reports.filter(
    (r) => r.status === "in_review"
  ).length;

  const resolvedReports = reports.filter(
    (r) => r.status === "resolved"
  ).length;

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      in_review: "bg-blue-100 text-blue-700",
      resolved: "bg-green-100 text-green-700",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || "bg-gray-100 text-gray-600"
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b px-8 py-4 flex items-center justify-between">

        <div className="flex items-center gap-3">

          <AlertTriangle className="w-7 h-7 text-red-600" />

          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Resident Reports & Complaints
            </h1>

            <p className="text-sm text-gray-500">
              Community Feedback Manager
            </p>
          </div>

        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />

          Logout
        </button>
      </div>

      <div className="p-8 space-y-8">

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <div className="bg-white p-6 rounded-2xl shadow">
            <FileText className="w-8 h-8 text-indigo-500 mb-2" />

            <p className="text-3xl font-bold">
              {reports.length}
            </p>

            <p className="text-gray-500 text-sm">
              Total Reports
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <Clock className="w-8 h-8 text-yellow-500 mb-2" />

            <p className="text-3xl font-bold text-yellow-600">
              {pendingReports}
            </p>

            <p className="text-gray-500 text-sm">
              Pending
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <AlertTriangle className="w-8 h-8 text-blue-500 mb-2" />

            <p className="text-3xl font-bold text-blue-600">
              {inReviewReports}
            </p>

            <p className="text-gray-500 text-sm">
              In Review
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />

            <p className="text-3xl font-bold text-green-600">
              {resolvedReports}
            </p>

            <p className="text-gray-500 text-sm">
              Resolved
            </p>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-2xl shadow p-6">

          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Incoming Reports
          </h2>

          {reports.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No reports available.
            </p>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 pr-4">Resident</th>
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Description</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >

                      <td className="py-3 pr-4 font-medium">
                        {report.resident}
                      </td>

                      <td className="py-3 pr-4">
                        {report.title}
                      </td>

                      <td className="py-3 pr-4">
                        {report.category}
                      </td>

                      <td className="py-3 pr-4 max-w-xs truncate">
                        {report.description}
                      </td>

                      <td className="py-3 pr-4">
                        {new Date(
                          report.date
                        ).toLocaleDateString()}
                      </td>

                      <td className="py-3 pr-4">
                        <StatusBadge status={report.status} />
                      </td>

                      <td className="py-3">

                        {report.status !== "resolved" ? (
                          <button
                            onClick={() =>
                              handleResolve(report.id)
                            }
                            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />

                            Resolve
                          </button>
                        ) : (
                          <span className="text-green-600 text-xs font-medium">
                            ✓ Resolved
                          </span>
                        )}

                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}