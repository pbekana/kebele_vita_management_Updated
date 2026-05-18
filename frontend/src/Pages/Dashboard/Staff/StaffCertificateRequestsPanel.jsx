import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Play,
  Send,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

const STATUS_LABEL = {
  pending: "Pending",
  assigned: "Assigned",
  processing: "Processing",
  ready_for_approval: "Ready For Approval",
  approved: "Approved",
  rejected: "Rejected",
  issued: "Issued",
};

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-100 text-amber-800",
    assigned: "bg-sky-100 text-sky-800",
    processing: "bg-violet-100 text-violet-800",
    ready_for_approval: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    issued: "bg-emerald-100 text-emerald-800",
  };
  const label = STATUS_LABEL[status] || status;
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}

const btnBase = "px-3 py-1.5 rounded-lg text-xs font-semibold transition";
const btnGreen = `${btnBase} bg-green-600 text-white hover:bg-green-700`;
const btnRed = `${btnBase} bg-red-600 text-white hover:bg-red-700`;
const btnBlue = `${btnBase} bg-blue-600 text-white hover:bg-blue-700`;
const btnGray = `${btnBase} bg-gray-200 text-gray-800 hover:bg-gray-300`;

export default function StaffCertificateRequestsPanel({ title, headerIcon: HeaderIcon }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [staff, setStaff] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("assigned,processing,ready_for_approval");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [staffRejectReason, setStaffRejectReason] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchCerts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/staff/certificates`, {
        headers,
        params: {
          page,
          limit,
          q: qDebounced || undefined,
          status: statusFilter || undefined,
        },
      });
      setCertificates(res.data.certificates || []);
      setTotal(res.data.total ?? res.data.count ?? 0);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/staff-login");
      } else {
        setAlert({
          type: "error",
          message: err.response?.data?.error || "Failed to load certificates.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, qDebounced, statusFilter, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/staff-login");
      return;
    }
    const loadProfile = async () => {
      try {
        const profileRes = await axios.get(`${API}/staff/profile`, { headers });
        setStaff(profileRes.data.staff);
      } catch {
        setStaff(null);
      }
    };
    loadProfile();
    fetchCerts();
  }, [token, navigate, fetchCerts]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setStaffRejectReason("");
    try {
      const res = await axios.get(`${API}/staff/certificates/${id}`, { headers });
      setDetail(res.data.certificate);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.error || "Could not load request details.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const act = async (fn) => {
    try {
      await fn();
      setAlert({ type: "success", message: "Updated successfully." });
      setDetail(null);
      fetchCerts();
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.error || "Action failed.",
      });
    }
  };

  const startProcessing = (id) =>
    act(() =>
      axios.put(`${API}/staff/certificates/${id}/start-processing`, {}, { headers })
    );

  const submitForApproval = (id) =>
    act(() =>
      axios.put(`${API}/staff/certificates/${id}/prepare`, {}, { headers })
    );

  const markReady = (id) =>
    act(() =>
      axios.put(`${API}/staff/certificates/${id}/ready-for-approval`, {}, { headers })
    );

  const staffReject = (id) =>
    act(() =>
      axios.put(
        `${API}/staff/certificates/${id}/reject`,
        { reason: staffRejectReason },
        { headers }
      )
    );

  const uploadPdf = (id, file) => {
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const result = reader.result;
        const file_base64 =
          typeof result === "string" && result.includes(",")
            ? result.split(",")[1]
            : result;
        await axios.post(
          `${API}/staff/certificates/${id}/upload-pdf`,
          { file_base64 },
          { headers }
        );
        setAlert({ type: "success", message: "PDF uploaded." });
        if (detail && detail.id === id) {
          const res = await axios.get(`${API}/staff/certificates/${id}`, { headers });
          setDetail(res.data.certificate);
        }
        fetchCerts();
      } catch (err) {
        setAlert({
          type: "error",
          message: err.response?.data?.error || "Upload failed.",
        });
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploading(false);
      setAlert({ type: "error", message: "Could not read the selected file." });
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/staff-login");
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {HeaderIcon}
          <div>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            <p className="text-sm text-gray-500">
              {staff?.firstname} {staff?.lastname} · {staff?.employee_id || "—"}
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

      <div className="p-8 space-y-6">
        {alert && (
          <div
            className={`p-4 rounded-xl text-sm ${
              alert.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {alert.message}
            <button type="button" onClick={() => setAlert(null)} className="ml-3 font-bold">
              ✕
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-end justify-between">
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    className="pl-9 pr-3 py-2 border rounded-lg text-sm w-64"
                    placeholder="Resident name, phone, ID…"
                    value={q}
                    onChange={(e) => {
                      setPage(1);
                      setQ(e.target.value);
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <select
                  className="border rounded-lg px-3 py-2 text-sm min-w-[200px]"
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                >
                  <option value="assigned,processing,ready_for_approval">Active pipeline</option>
                  <option value="assigned">Assigned</option>
                  <option value="processing">Processing</option>
                  <option value="ready_for_approval">Ready for approval</option>
                  <option value="assigned,processing,ready_for_approval,rejected,approved">
                    All outcomes (mine)
                  </option>
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {total} request{total !== 1 ? "s" : ""} · Page {page} / {totalPages}
            </p>
          </div>

          {loading ? (
            <p className="text-gray-500 py-10 text-center">Loading…</p>
          ) : certificates.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No certificate requests match your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 pr-3">ID</th>
                    <th className="pb-3 pr-3">Resident</th>
                    <th className="pb-3 pr-3">Requested</th>
                    <th className="pb-3 pr-3">Status</th>
                    <th className="pb-3 pr-3">PDF</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-3 font-mono">#{c.id}</td>
                      <td className="py-3 pr-3">
                        {c.resident_firstname} {c.resident_lastname}
                        <div className="text-xs text-gray-400">{c.resident_phone}</div>
                      </td>
                      <td className="py-3 pr-3">
                        {c.requested_at
                          ? new Date(c.requested_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 pr-3">{c.pdf_url ? "Yes" : "—"}</td>
                      <td className="py-3">
                        <button type="button" className={btnBlue} onClick={() => openDetail(c.id)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className={btnGray}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4 inline" /> Prev
            </button>
            <button
              type="button"
              className={btnGray}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="w-4 h-4 inline" />
            </button>
          </div>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold">Request #{detail.id}</h2>
              <button type="button" className="text-gray-500 hover:text-gray-800" onClick={() => setDetail(null)}>
                ✕
              </button>
            </div>
            {detailLoading ? (
              <p className="text-gray-500">Loading…</p>
            ) : (
              <>
                <div className="space-y-2 text-sm mb-4">
                  <p>
                    <span className="text-gray-500">Type:</span>{" "}
                    <strong>{(detail.certificate_type || "").toUpperCase()}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">Resident:</span>{" "}
                    {detail.resident_firstname} {detail.resident_lastname}
                  </p>
                  <p>
                    <span className="text-gray-500">Status:</span> <StatusBadge status={detail.status} />
                  </p>
                  <p>
                    <span className="text-gray-500">Child / subject:</span>{" "}
                    {detail.child_name || detail.husband_name || "—"}
                  </p>
                </div>

                <div className="border-t pt-4 space-y-3">
                  {["assigned", "processing"].includes(detail.status) && (
                    <>
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                        When ready, submit this request to the administrator. A certificate PDF will be generated automatically if you have not uploaded one.
                      </p>
                      <button
                        type="button"
                        className={`${btnGreen} w-full flex justify-center gap-2`}
                        onClick={() => submitForApproval(detail.id)}
                      >
                        <Send className="w-4 h-4" /> Submit for admin approval
                      </button>
                    </>
                  )}

                  {detail.status === "assigned" && (
                    <button type="button" className={`${btnBlue} w-full flex justify-center gap-2`} onClick={() => startProcessing(detail.id)}>
                      <Play className="w-4 h-4" /> Start processing (optional)
                    </button>
                  )}

                  {["assigned", "processing"].includes(detail.status) && (
                    <label className="block">
                      <span className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1">
                        <Upload className="w-3 h-3" /> Or upload your own PDF (optional)
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadPdf(detail.id, f);
                          e.target.value = "";
                        }}
                        className="text-sm"
                      />
                    </label>
                  )}

                  {detail.status === "processing" && (
                    <button type="button" className={`${btnGray} w-full flex justify-center gap-2`} onClick={() => markReady(detail.id)}>
                      <Send className="w-4 h-4" /> Mark ready (after upload)
                    </button>
                  )}

                  {["assigned", "processing"].includes(detail.status) && (
                    <div>
                      <textarea
                        className="w-full border rounded-lg p-2 text-sm"
                        rows={2}
                        placeholder="Optional note if rejecting…"
                        value={staffRejectReason}
                        onChange={(e) => setStaffRejectReason(e.target.value)}
                      />
                      <button
                        type="button"
                        className={`${btnRed} w-full mt-2 flex justify-center gap-2`}
                        onClick={() => {
                          if (!window.confirm("Reject this request?")) return;
                          staffReject(detail.id);
                        }}
                      >
                        <XCircle className="w-4 h-4" /> Reject request
                      </button>
                    </div>
                  )}

                  {detail.status === "ready_for_approval" && (
                    <p className="text-sm text-blue-700 bg-blue-50 rounded-lg p-3">
                      This request is with the administrator for final approval.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
