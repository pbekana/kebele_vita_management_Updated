import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
} from "lucide-react";

export default function MarriageOfficerDashboard() {
  const [certificates, setCertificates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) {
      navigate("/staff-login");
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, certRes, taskRes] = await Promise.all([
        axios.get("http://localhost:5000/api/staff/profile", { headers }),
        axios.get("http://localhost:5000/api/staff/certificates", { headers }),
        axios.get("http://localhost:5000/api/staff/tasks", { headers }),
      ]);

      setStaff(profileRes.data.staff);
      setCertificates(certRes.data.certificates);
      setTasks(taskRes.data.tasks);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/staff-login");
      } else {
        setAlert({ type: "error", message: "Failed to load dashboard data." });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (url, successMsg, errorMsg) => {
    try {
      await axios.put(url, {}, { headers });
      setAlert({ type: "success", message: successMsg });
      fetchAll();
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.error || errorMsg,
      });
    }
  };

  const handleApprove = (id) =>
    updateTask(
      `http://localhost:5000/api/staff/certificates/${id}/prepare`,
      "Certificate prepared for review successfully.",
      "Failed to prepare certificate."
    );

  const handleReject = (id) => {
    if (!window.confirm("Are you sure you want to reject this certificate?")) return;
    updateTask(
      `http://localhost:5000/api/staff/certificates/${id}/reject`,
      "Certificate rejected.",
      "Rejection failed."
    );
  };

  const handleStartTask = (id) =>
    updateTask(
      `http://localhost:5000/api/staff/tasks/${id}/start`,
      "Task started.",
      "Failed to start task."
    );

  const handleCompleteTask = (id) =>
    updateTask(
      `http://localhost:5000/api/staff/tasks/${id}/complete`,
      "Task completed.",
      "Failed to complete task."
    );

  const handleLogout = () => {
    localStorage.clear();
    navigate("/staff-login");
  };

  const pendingCerts = certificates.filter(
    (c) => c.status === "pending"
  ).length;

  const inReviewCerts = certificates.filter(
    (c) => c.status === "in_review"
  ).length;

  const activeTasks = tasks.filter(
    (t) =>
      t.status === "pending" ||
      t.status === "in_progress"
  ).length;

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      in_review: "bg-blue-100 text-blue-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      in_progress: "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
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

          <Heart className="w-7 h-7 text-purple-600" />

          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Marriage Certificate Office
            </h1>

            <p className="text-sm text-gray-500">
              Marriage Management Dashboard
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
        {alert && (
          <div className={`p-4 rounded-xl text-sm font-medium ${alert.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {alert.message}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <div className="bg-white p-6 rounded-2xl shadow">
            <Heart className="w-8 h-8 text-purple-500 mb-2" />

            <p className="text-3xl font-bold">
              {certificates.length}
            </p>

            <p className="text-gray-500 text-sm">
              Total Requests
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <Clock className="w-8 h-8 text-yellow-500 mb-2" />

            <p className="text-3xl font-bold text-yellow-600">
              {pendingCerts}
            </p>

            <p className="text-gray-500 text-sm">
              Pending
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <CheckCircle className="w-8 h-8 text-blue-500 mb-2" />

            <p className="text-3xl font-bold text-blue-600">
              {inReviewCerts}
            </p>

            <p className="text-gray-500 text-sm">
              In Review
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <XCircle className="w-8 h-8 text-purple-500 mb-2" />

            <p className="text-3xl font-bold text-purple-600">
              {activeTasks}
            </p>

            <p className="text-gray-500 text-sm">
              Active Tasks
            </p>
          </div>

        </div>

        {/* Certificates */}
        <div className="bg-white rounded-2xl shadow p-6">

          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Marriage Certificate Requests
          </h2>

          {certificates.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No certificate requests available.
            </p>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 pr-4">
                      Husband Name
                    </th>

                    <th className="pb-3 pr-4">
                      Wife Name
                    </th>

                    <th className="pb-3 pr-4">
                      Marriage Date
                    </th>

                    <th className="pb-3 pr-4">
                      Marriage Place
                    </th>

                    <th className="pb-3 pr-4">
                      Witness
                    </th>

                    <th className="pb-3 pr-4">
                      Requested By
                    </th>

                    <th className="pb-3 pr-4">
                      Status
                    </th>

                    <th className="pb-3">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {certificates.map((cert) => (
                    <tr
                      key={cert.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >

                      <td className="py-3 pr-4 font-medium">
                        {cert.husband_name || "—"}
                      </td>

                      <td className="py-3 pr-4">
                        {cert.wife_name || "—"}
                      </td>

                      <td className="py-3 pr-4">
                        {cert.marriage_date ? new Date(
                          cert.marriage_date
                        ).toLocaleDateString() : "—"}
                      </td>

                      <td className="py-3 pr-4">
                        {cert.marriage_place || "—"}
                      </td>

                      <td className="py-3 pr-4">
                        {cert.witness_name || "—"}
                      </td>

                      <td className="py-3 pr-4">
                        {cert.resident_firstname ? `${cert.resident_firstname} ${cert.resident_lastname}` : (cert.requested_by || "—")}
                      </td>

                      <td className="py-3 pr-4">
                        <StatusBadge
                          status={cert.status}
                        />
                      </td>

                      <td className="py-3">
                        <div className="flex gap-2">
                          {cert.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApprove(cert.id)
                                }
                                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Prepare
                              </button>

                              <button
                                onClick={() =>
                                  handleReject(cert.id)
                                }
                                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}
                          {cert.status === "in_review" && (
                            <span className="text-blue-600 text-xs font-semibold">Prepared (In Review)</span>
                          )}
                          {cert.status === "approved" && (
                            <span className="text-green-600 text-xs font-semibold">Approved</span>
                          )}
                          {cert.status === "rejected" && (
                            <span className="text-red-600 text-xs font-semibold">Rejected</span>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-2xl shadow p-6">

          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            My Tasks
          </h2>

          {tasks.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No tasks assigned.
            </p>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 pr-4">
                      Title
                    </th>

                    <th className="pb-3 pr-4">
                      Type
                    </th>

                    <th className="pb-3 pr-4">
                      Resident
                    </th>

                    <th className="pb-3 pr-4">
                      Due Date
                    </th>

                    <th className="pb-3 pr-4">
                      Status
                    </th>

                    <th className="pb-3">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >

                      <td className="py-3 pr-4 font-medium">
                        {task.title}
                      </td>

                      <td className="py-3 pr-4">
                        {task.task_type.replace(
                          "_",
                          " "
                        )}
                      </td>

                      <td className="py-3 pr-4">
                        {task.resident_firstname ? `${task.resident_firstname} ${task.resident_lastname}` : (task.resident || "—")}
                      </td>

                      <td className="py-3 pr-4">
                        {task.due_date ? new Date(
                          task.due_date
                        ).toLocaleDateString() : "—"}
                      </td>

                      <td className="py-3 pr-4">
                        <StatusBadge
                          status={task.status}
                        />
                      </td>

                      <td className="py-3">

                        {task.status === "pending" && (
                          <button
                            onClick={() =>
                              handleStartTask(task.id)
                            }
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition"
                          >
                            Start
                          </button>
                        )}

                        {task.status === "in_progress" && (
                          <button
                            onClick={() =>
                              handleCompleteTask(
                                task.id
                              )
                            }
                            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition"
                          >
                            Complete
                          </button>
                        )}

                        {task.status === "completed" && (
                          <span className="text-green-600 text-xs font-medium">
                            ✓ Done
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