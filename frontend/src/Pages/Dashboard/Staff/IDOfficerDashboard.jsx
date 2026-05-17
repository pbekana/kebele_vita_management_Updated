import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
} from "lucide-react";

export default function IDOfficerDashboard() {
  const [activeTab, setActiveTab] = useState("new");
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
      const [profileRes, taskRes] = await Promise.all([
        axios.get("http://localhost:5000/api/staff/profile", { headers }),
        axios.get("http://localhost:5000/api/staff/tasks", { headers }),
      ]);

      setStaff(profileRes.data.staff);
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

  const newTasks = tasks.filter(
    (task) => task.title.toLowerCase().includes("new") || task.description?.toLowerCase().includes("new")
  );

  const renewalTasks = tasks.filter(
    (task) => task.title.toLowerCase().includes("renew") || task.description?.toLowerCase().includes("renew")
  );

  // Fallback if none matches to keep tab simple
  const displayedTasks =
    activeTab === "new"
      ? (newTasks.length > 0 ? newTasks : tasks)
      : (renewalTasks.length > 0 ? renewalTasks : tasks);

  const pendingCount = tasks.filter(
    (task) => task.status === "pending"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-600",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] ||
          "bg-gray-100 text-gray-600"
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

          <CreditCard className="w-7 h-7 text-teal-600" />

          <div>
            <h1 className="text-xl font-bold text-gray-800">
              ID Management Office
            </h1>

            <p className="text-sm text-gray-500">
              ID Card Management Dashboard
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <div className="bg-white p-6 rounded-2xl shadow">
            <CreditCard className="w-8 h-8 text-teal-500 mb-2" />

            <p className="text-3xl font-bold">
              {tasks.length}
            </p>

            <p className="text-gray-500 text-sm">
              Total ID Tasks
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <Clock className="w-8 h-8 text-yellow-500 mb-2" />

            <p className="text-3xl font-bold text-yellow-600">
              {pendingCount}
            </p>

            <p className="text-gray-500 text-sm">
              Pending
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <CheckCircle className="w-8 h-8 text-blue-500 mb-2" />

            <p className="text-3xl font-bold text-blue-600">
              {inProgressCount}
            </p>

            <p className="text-gray-500 text-sm">
              In Progress
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <XCircle className="w-8 h-8 text-green-500 mb-2" />

            <p className="text-3xl font-bold text-green-600">
              {completedCount}
            </p>

            <p className="text-gray-500 text-sm">
              Completed
            </p>
          </div>

        </div>

        {/* Tabs */}
        <div className="flex gap-4">

          <button
            onClick={() => setActiveTab("new")}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              activeTab === "new"
                ? "bg-teal-600 text-white"
                : "bg-white border hover:bg-gray-50"
            }`}
          >
            New Applications
          </button>

          <button
            onClick={() => setActiveTab("renew")}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              activeTab === "renew"
                ? "bg-teal-600 text-white"
                : "bg-white border hover:bg-gray-50"
            }`}
          >
            Renewals
          </button>

        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-2xl shadow p-6">

          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            {activeTab === "new"
              ? "New ID Applications"
              : "ID Renewal Applications"}
          </h2>

          {displayedTasks.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No tasks available.
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
                      Resident
                    </th>

                    <th className="pb-3 pr-4">
                      Assigned By
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
                  {displayedTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >

                      <td className="py-3 pr-4 font-medium">
                        {task.title}
                      </td>

                      <td className="py-3 pr-4">
                        {task.resident_firstname ? `${task.resident_firstname} ${task.resident_lastname}` : (task.resident || "—")}
                      </td>

                      <td className="py-3 pr-4">
                        {task.assigned_by_firstname ? `${task.assigned_by_firstname} ${task.assigned_by_lastname}` : "Admin Office"}
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
                        <div className="flex gap-2">

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

                          {task.status ===
                            "in_progress" && (
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

                          {task.status ===
                            "completed" && (
                            <span className="text-green-600 text-xs font-medium">
                              ✓ Done
                            </span>
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
      </div>
    </div>
  );
}