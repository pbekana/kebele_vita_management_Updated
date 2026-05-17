import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Baby, Clock, CheckCircle, XCircle, LogOut } from "lucide-react";

export default function BirthOfficerDashboard() {
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

  const pendingCerts = certificates.filter(c => c.status === "pending").length;
  const inReviewCerts = certificates.filter(c => c.status === "in_review").length;
  const activeTasks = tasks.filter(t => t.status !== "completed").length;

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      in_review: "bg-blue-100 text-blue-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      in_progress: "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-500",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Baby className="w-7 h-7 text-pink-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Birth Certificate Office
            </h1>
            <p className="text-sm text-gray-500">
              {staff?.firstname} {staff?.lastname} · {staff?.employee_id}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="p-8 space-y-8">

        {/* Alert */}
        {alert && (
          <div
            className={`p-4 rounded-xl text-sm ${
              alert.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {alert.message}
            <button onClick={() => setAlert(null)} className="ml-3 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat icon={<Baby />} value={certificates.length} label="Total Requests" />
          <Stat icon={<Clock />} value={pendingCerts} label="Pending" color="text-yellow-600" />
          <Stat icon={<CheckCircle />} value={inReviewCerts} label="In Review" color="text-blue-600" />
          <Stat icon={<XCircle />} value={activeTasks} label="Active Tasks" color="text-purple-600" />
        </div>

        {/* Certificates */}
        <Section title="Birth Certificate Requests">
          {certificates.length === 0 ? (
            <Empty text="No pending certificate requests." />
          ) : (
            <Table
              headers={[
                "Child",
                "Father",
                "Mother",
                "Birth Date",
                "Requested By",
                "Status",
                "Actions",
              ]}
              rows={certificates.map(cert => (
                <tr key={cert.id} className="border-b hover:bg-gray-50">
                  <td>{cert.child_name || "—"}</td>
                  <td>{cert.father_name || "—"}</td>
                  <td>{cert.mother_name || "—"}</td>
                  <td>{cert.birth_date ? new Date(cert.birth_date).toLocaleDateString() : "—"}</td>
                  <td>{cert.resident_firstname} {cert.resident_lastname}</td>
                  <td><StatusBadge status={cert.status} /></td>
                  <td className="flex gap-2">
                    <button onClick={() => handleApprove(cert.id)} className="btn-green">Prepare</button>
                    <button onClick={() => handleReject(cert.id)} className="btn-red">Reject</button>
                  </td>
                </tr>
              ))}
            />
          )}
        </Section>

        {/* Tasks */}
        <Section title="My Tasks">
          {tasks.length === 0 ? (
            <Empty text="No tasks assigned." />
          ) : (
            <Table
              headers={["Title", "Type", "Resident", "Due", "Status", "Actions"]}
              rows={tasks.map(task => (
                <tr key={task.id} className="border-b hover:bg-gray-50">
                  <td>{task.title}</td>
                  <td>{task.task_type.replace("_", " ")}</td>
                  <td>{task.resident_firstname ? `${task.resident_firstname} ${task.resident_lastname}` : "—"}</td>
                  <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}</td>
                  <td><StatusBadge status={task.status} /></td>
                  <td className="flex gap-2">
                    {task.status === "pending" && (
                      <button onClick={() => handleStartTask(task.id)} className="btn-blue">
                        Start
                      </button>
                    )}
                    {task.status === "in_progress" && (
                      <button onClick={() => handleCompleteTask(task.id)} className="btn-green">
                        Complete
                      </button>
                    )}
                    {task.status === "completed" && (
                      <span className="text-green-600 text-xs">✓ Done</span>
                    )}
                  </td>
                </tr>
              ))}
            />
          )}
        </Section>
      </div>
    </div>
  );
}

/* ── Reusable UI Components ───────────────────────── */

function Stat({ icon, value, label, color = "text-gray-700" }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <div className={`w-8 h-8 mb-2 ${color}`}>{icon}</div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">{title}</h2>
      {children}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            {headers.map((h, i) => (
              <th key={i} className="pb-3 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-gray-400 text-center py-8">{text}</p>;
}

const btnBase = "px-3 py-1 rounded-lg text-xs font-medium transition";
const btnGreen = `${btnBase} bg-green-100 hover:bg-green-200 text-green-700`;
const btnRed = `${btnBase} bg-red-100 hover:bg-red-200 text-red-700`;
const btnBlue = `${btnBase} bg-blue-100 hover:bg-blue-200 text-blue-700`;