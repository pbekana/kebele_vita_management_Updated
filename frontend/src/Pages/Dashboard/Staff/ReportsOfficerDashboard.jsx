import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  LogOut,
  FileText,
} from "lucide-react";
import { useNotification } from '../../../components/NotificationProvider';

export default function ReportsOfficerDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const { notifySuccess, notifyError } = useNotification();

  const navigate = useNavigate();
  const API = "http://localhost:5000/api";

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API}/staff/reports`, config);
      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/staff-login");
      return;
    }

    fetchReports();
  }, []);

  const handleResolve = async (id, responseMsg) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API}/staff/reports/${id}/resolve`, { response: responseMsg }, config);
      await fetchReports();
      setSelectedReport(null);
      setResponseMessage("");
      notifySuccess("Report resolved and message sent to requester successfully!");
    } catch (err) {
      console.error("Failed to resolve report:", err);
      notifyError("Failed to resolve report. Please try again.");
    }
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
    (r) => r.status === "resolved" || r.status === "completed"
  ).length;

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      in_review: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      resolved: "bg-green-100 text-green-700",
      rejected: "bg-gray-100 text-gray-700",
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

        {/* Reports Table & Response Pane */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Reports Table Panel */}
          <div className={`${selectedReport ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl shadow p-6 transition-all duration-300`}>

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
                        onClick={() => {
                          setSelectedReport(report);
                          setResponseMessage(report.response || "");
                        }}
                        className={`border-b last:border-0 hover:bg-gray-50 cursor-pointer transition ${
                          selectedReport?.id === report.id ? "bg-indigo-50/70 hover:bg-indigo-50" : ""
                        }`}
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
                            report.created_at || report.date
                          ).toLocaleDateString()}
                        </td>

                        <td className="py-3 pr-4">
                          <StatusBadge status={report.status} />
                        </td>

                        <td className="py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                              setResponseMessage(report.response || "");
                            }}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View & Respond
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}
          </div>

          {/* Response / Detail Panel */}
          {selectedReport && (
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100 flex flex-col justify-between h-fit space-y-6 transition-all duration-300">
              <div>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="text-lg font-bold text-gray-800">Report Details</h3>
                  <button 
                    onClick={() => setSelectedReport(null)} 
                    className="text-gray-400 hover:text-gray-600 text-sm font-semibold transition"
                  >
                    ✕ Close
                  </button>
                </div>
                
                <div className="space-y-4 text-sm mb-6">
                  <div>
                    <span className="font-semibold text-gray-500 block mb-1">Resident</span>
                    <p className="font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      {selectedReport.resident} ({selectedReport.resident_email})
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block mb-1">Title & Category</span>
                    <p className="font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      [{selectedReport.category}] {selectedReport.title}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block mb-1">Description</span>
                    <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">
                      {selectedReport.description}
                    </p>
                  </div>
                  {selectedReport.response && (
                    <div>
                      <span className="font-semibold text-gray-500 block mb-1">Previous Response Sent</span>
                      <p className="text-green-800 bg-green-50 px-3 py-2 rounded-xl border border-green-200 whitespace-pre-wrap font-medium">
                        {selectedReport.response}
                      </p>
                    </div>
                  )}
                </div>

                {selectedReport.status !== "resolved" && selectedReport.status !== "completed" && (
                  <div className="mb-6">
                    <label className="text-sm font-bold text-gray-700 block mb-2">Message to Requester</label>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Write your official response message to send to the resident..."
                      rows="6"
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition outline-none"
                    />
                  </div>
                )}
              </div>

              {selectedReport.status !== "resolved" && selectedReport.status !== "completed" ? (
                <button
                  onClick={() => handleResolve(selectedReport.id, responseMessage)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Send Message & Resolve
                </button>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center text-green-800 font-semibold text-sm">
                  ✓ This report has been resolved
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}