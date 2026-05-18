import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Shield, Users, FileText, AlertTriangle,
  CheckCircle, XCircle, Bell, Briefcase, ClipboardList
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [reportImages, setReportImages] = useState([]);

  // New states for Staff and Tasks
  const [staffList, setStaffList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '', description: '', task_type: 'id_card', assigned_to: '', resident_id: '', due_date: ''
  });
  const [loading, setLoading] = useState(false);

  const [approvalCerts, setApprovalCerts] = useState([]);
  const [assignmentCerts, setAssignmentCerts] = useState([]);
  const [inProgressCerts, setInProgressCerts] = useState([]);
  const [approvalTotal, setApprovalTotal] = useState(0);
  const [assignmentTotal, setAssignmentTotal] = useState(0);
  const [inProgressTotal, setInProgressTotal] = useState(0);
  const [certStaffList, setCertStaffList] = useState([]);
  const [certSubTab, setCertSubTab] = useState('assignment');
  const [certSearch, setCertSearch] = useState('');
  const [certError, setCertError] = useState(null);
  const [assignTo, setAssignTo] = useState({});

  const refreshCertificates = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const params = { limit: 50 };
    const [aRes, bRes, pRes] = await Promise.all([
      axios.get(`${API}/admin/certificates`, { ...config, params: { ...params, queue: 'approval' } }),
      axios.get(`${API}/admin/certificates`, { ...config, params: { ...params, queue: 'assignment' } }),
      axios.get(`${API}/admin/certificates`, { ...config, params: { ...params, queue: 'in_progress' } }),
    ]);
    setApprovalCerts(aRes.data.certificates || []);
    setApprovalTotal(aRes.data.total ?? aRes.data.count ?? 0);
    setAssignmentCerts(bRes.data.certificates || []);
    setAssignmentTotal(bRes.data.total ?? bRes.data.count ?? 0);
    setInProgressCerts(pRes.data.certificates || []);
    setInProgressTotal(pRes.data.total ?? pRes.data.count ?? 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setCertError(null);
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        if (activeTab === 'overview' || activeTab === 'certificates') {
          await refreshCertificates();
          const staffRes = await axios.get(`${API}/admin/staff`, config);
          setCertStaffList(staffRes.data.staff || []);
        }

        if (activeTab === 'staff' || activeTab === 'tasks') {
          const staffRes = await axios.get(`${API}/admin/staff`, config);
          setStaffList(staffRes.data.staff || []);
        }

        if (activeTab === 'tasks') {
          const tasksRes = await axios.get(`${API}/admin/tasks`, config);
          setTasks(tasksRes.data.tasks || []);
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setCertError(err.response?.data?.error || 'Failed to load certificate data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const [stats] = useState({
    totalUsers: 12450,
    pendingCertificates: 87,
    todayApplications: 34,
    reports: 12
  });

  const staffOptionsForCertificate = (cert) => {
    const map = {
      birth: 'birth_officer',
      marriage: 'marriage_officer',
      death: 'death_officer',
      'residency-id': 'id_officer',
      residency: 'id_officer'
    };
    const pos = map[cert.certificate_type];
    return certStaffList.filter((s) => (s.position === pos || s.position === 'kebele_staff') && s.is_active !== false);
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API}/admin/certificates/${id}/approve`, {}, config);
      alert(`Certificate #${id} approved.`);
      await refreshCertificates();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve certificate');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason (required):');
    if (!reason || !reason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API}/admin/certificates/${id}/reject`, { reason: reason.trim() }, config);
      alert(`Certificate #${id} rejected.`);
      await refreshCertificates();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject certificate');
    }
  };

  const handleAssign = async (certId, staffUserId) => {
    if (!staffUserId) {
      alert('Select a staff member to assign.');
      return;
    }
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${API}/admin/certificates/${certId}/assign`,
        { staff_user_id: Number(staffUserId) },
        config
      );
      alert(`Request #${certId} assigned to staff.`);
      await refreshCertificates();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign certificate');
    }
  };

  const filterCertList = (list) => {
    const s = certSearch.trim().toLowerCase();
    if (!s) return list;
    return list.filter((c) => {
      const blob = [
        c.id,
        c.resident_firstname,
        c.resident_lastname,
        c.resident_phone,
        c.child_name,
        c.husband_name,
        c.wife_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(s);
    });
  };

  const certApplicantSummary = (cert) => {
    if (cert.certificate_type === 'birth') return `Child: ${cert.child_name || '—'}`;
    if (cert.certificate_type === 'marriage') {
      return `Husband: ${cert.husband_name || '—'}, Wife: ${cert.wife_name || '—'}`;
    }
    if (cert.certificate_type === 'residency-id' || cert.certificate_type === 'residency') {
      return `Applicant: ${cert.child_name || '—'}`; // We saved fullName into child_name in the backend
    }
    return `Deceased: ${cert.child_name || cert.deceased_name || '—'}`;
  };

  const renderAssignControls = (cert) => {
    const options = staffOptionsForCertificate(cert);
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border rounded-lg px-2 py-1 text-sm"
          value={assignTo[cert.id] || ''}
          onChange={(e) => setAssignTo((prev) => ({ ...prev, [cert.id]: e.target.value }))}
        >
          <option value="">Select staff…</option>
          {options.map((s) => (
            <option key={s.user_id} value={s.user_id}>
              {s.email} ({s.position})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => handleAssign(cert.id, assignTo[cert.id])}
          className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
        >
          Assign
        </button>
        {options.length === 0 && (
          <span className="text-xs text-amber-600">No active staff for this type.</span>
        )}
      </div>
    );
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert("Each image must be less than 5MB");
        return;
      }
      const preview = URL.createObjectURL(file);
      newImages.push({ file, preview });
    });

    setReportImages(prev => [...prev, ...newImages].slice(0, 4));
  };

  const removeReportImage = (index) => {
    setReportImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleStaffToggle = async (userId, isActive) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const endpoint = isActive ? 'deactivate' : 'activate';
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/${endpoint}`, {}, config);
      
      setStaffList(prev => prev.map(staff => 
        staff.user_id === userId ? { ...staff, is_active: !isActive } : staff
      ));
    } catch (err) {
      alert('Failed to update staff status');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/admin/tasks/create', newTask, config);
      
      const tasksRes = await axios.get('http://localhost:5000/api/admin/tasks', config);
      setTasks(tasksRes.data.tasks || []);
      setNewTask({ title: '', description: '', task_type: 'id_card', assigned_to: '', resident_id: '', due_date: '' });
      alert('Task assigned successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign task');
    }
  };

  const handleReassignTask = async (taskId, newAssigneeId) => {
    if (!newAssigneeId) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/admin/tasks/${taskId}/reassign`, { assigned_to: newAssigneeId }, config);
      
      const tasksRes = await axios.get('http://localhost:5000/api/admin/tasks', config);
      setTasks(tasksRes.data.tasks || []);
      alert('Task reassigned successfully!');
    } catch (err) {
      alert('Failed to reassign task');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl">🛡️</div>
            <div>
              <h1 className="font-bold text-2xl">Heremata Mentina</h1>
              <p className="text-xs text-gray-500 -mt-1">Administration Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl">
              <div className="text-right">
                <p className="font-semibold">Admin User</p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">👨‍💼</div>
            </div>
            <button className="p-3 hover:bg-gray-100 rounded-xl">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white h-screen border-r shadow-sm p-6">
          <div className="space-y-2">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: Shield },
              { id: 'certificates', label: 'Certificates', icon: FileText },
              { id: 'users', label: 'Users Management', icon: Users },
              { id: 'staff', label: 'Staff Management', icon: Briefcase },
              { id: 'tasks', label: 'Task Assignment', icon: ClipboardList },
              { id: 'reports', label: 'Reports & Complaints', icon: AlertTriangle },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {certError && (
                <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{certError}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow">
                  <div className="text-indigo-600 text-4xl mb-2">👥</div>
                  <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-gray-600">Total Residents</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow">
                  <div className="text-orange-500 text-4xl mb-2">📋</div>
                  <div className="text-3xl font-bold">{assignmentTotal}</div>
                  <p className="text-gray-600">Awaiting staff assignment</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {inProgressTotal} with staff · {approvalTotal} ready for final approval
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow">
                  <div className="text-green-500 text-4xl mb-2">📈</div>
                  <div className="text-3xl font-bold">{stats.todayApplications}</div>
                  <p className="text-gray-600">Applications Today</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow">
                  <div className="text-red-500 text-4xl mb-2">⚠️</div>
                  <div className="text-3xl font-bold">{stats.reports}</div>
                  <p className="text-gray-600">New Reports</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">
                New resident requests
                {assignmentTotal > 0 && (
                  <span className="ml-2 text-sm font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    {assignmentTotal} pending — assign staff to start processing
                  </span>
                )}
              </h3>
              <div className="bg-white rounded-2xl shadow overflow-hidden mb-10">
                {assignmentCerts.length === 0 ? (
                  <p className="p-6 text-gray-500 text-center">No new certificate requests waiting for staff assignment.</p>
                ) : (
                  assignmentCerts.slice(0, 8).map((cert) => (
                    <div key={cert.id} className="flex flex-wrap items-center justify-between gap-4 p-6 border-b last:border-0 hover:bg-gray-50">
                      <div>
                        <p className="font-medium">
                          #{(cert.id)} · {(cert.certificate_type || 'UNKNOWN').toUpperCase()} Certificate
                          <span className="ml-2 text-xs font-semibold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        </p>
                        <p className="text-gray-600 text-sm">{certApplicantSummary(cert)}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Requested by: {cert.resident_firstname} {cert.resident_lastname}
                          {cert.requested_at ? ` · ${new Date(cert.requested_at).toLocaleString()}` : ''}
                        </p>
                      </div>
                      {renderAssignControls(cert)}
                    </div>
                  ))
                )}
                {assignmentTotal > 8 && (
                  <p className="p-4 text-center text-sm text-indigo-600">
                    <button type="button" className="font-semibold hover:underline" onClick={() => setActiveTab('certificates')}>
                      View all {assignmentTotal} pending requests in Certificates →
                    </button>
                  </p>
                )}
              </div>

              {inProgressTotal > 0 && (
                <>
                  <h3 className="text-xl font-semibold mb-4">
                    With staff (in progress)
                    <span className="ml-2 text-sm font-normal text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                      {inProgressTotal} — waiting for staff to submit
                    </span>
                  </h3>
                  <div className="bg-white rounded-2xl shadow overflow-hidden mb-10">
                    {inProgressCerts.slice(0, 6).map((cert) => (
                      <div key={cert.id} className="flex flex-wrap items-center justify-between gap-4 p-6 border-b last:border-0 hover:bg-gray-50">
                        <div>
                          <p className="font-medium">
                            #{cert.id} · {(cert.certificate_type || 'UNKNOWN').toUpperCase()}
                            <span className="ml-2 text-xs font-semibold uppercase text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                              {cert.status.replace('_', ' ')}
                            </span>
                          </p>
                          <p className="text-gray-600 text-sm">{certApplicantSummary(cert)}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            Assigned to: {cert.assigned_staff_email || '—'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          Staff must click <strong>Submit for admin approval</strong> in their dashboard.
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h3 className="text-xl font-semibold mb-4">Ready for final approval</h3>
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                {approvalCerts.length === 0 ? (
                  <p className="p-6 text-gray-500 text-center">
                    No certificates are waiting for final approval yet.
                    {assignmentTotal > 0 && (
                      <span> Assign staff above first — requests appear here after staff uploads the PDF and marks them ready.</span>
                    )}
                  </p>
                ) : (
                  approvalCerts.slice(0, 6).map((cert) => (
                    <div key={cert.id} className="flex flex-wrap items-center justify-between gap-4 p-6 border-b last:border-0 hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{(cert.certificate_type || 'UNKNOWN').toUpperCase()} Certificate</p>
                        <p className="text-gray-600 text-sm">{certApplicantSummary(cert)}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Requested by: {cert.resident_firstname} {cert.resident_lastname}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Requested: {cert.requested_at ? new Date(cert.requested_at).toLocaleDateString() : '—'}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleApprove(cert.id)}
                          className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(cert.id)}
                          className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div>
              <h3 className="text-2xl font-semibold mb-4">Certificate management</h3>
              {certError && (
                <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{certError}</p>
              )}
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setCertSubTab('assignment')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    certSubTab === 'assignment' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-700'
                  }`}
                >
                  New requests — assign staff ({assignmentTotal})
                </button>
                <button
                  type="button"
                  onClick={() => setCertSubTab('approval')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    certSubTab === 'approval' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-700'
                  }`}
                >
                  Ready for final approval ({approvalTotal})
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Resident submissions start as <strong>Pending</strong>. Assign a staff member here first; after they prepare the PDF, the request moves to final approval.
              </p>
              <div className="flex flex-wrap gap-3 mb-4 items-center">
                <input
                  type="search"
                  placeholder="Filter this page (resident, phone, ID)…"
                  className="border rounded-xl px-4 py-2 text-sm w-full max-w-md"
                  value={certSearch}
                  onChange={(e) => setCertSearch(e.target.value)}
                />
                {loading && <span className="text-sm text-gray-500">Refreshing…</span>}
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                {certSubTab === 'approval' ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">Type</th>
                        <th className="px-6 py-4 text-left font-semibold">Applicant</th>
                        <th className="px-6 py-4 text-left font-semibold">Resident</th>
                        <th className="px-6 py-4 text-left font-semibold">Requested</th>
                        <th className="px-6 py-4 text-left font-semibold">PDF</th>
                        <th className="px-6 py-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterCertList(approvalCerts).length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-medium">
                            No certificates ready for final approval.
                            {assignmentTotal > 0 && ' Assign pending requests to staff first.'}
                          </td>
                        </tr>
                      ) : (
                        filterCertList(approvalCerts).map((cert) => (
                          <tr key={cert.id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{(cert.certificate_type || 'UNKNOWN').toUpperCase()}</td>
                            <td className="px-6 py-4 text-sm">{certApplicantSummary(cert)}</td>
                            <td className="px-6 py-4 text-sm">
                              {cert.resident_firstname} {cert.resident_lastname}
                              <div className="text-xs text-gray-400">{cert.resident_phone}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {cert.requested_at ? new Date(cert.requested_at).toLocaleString() : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm">{cert.pdf_url ? 'Uploaded' : '—'}</td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => handleApprove(cert.id)}
                                className="text-green-600 hover:underline text-sm font-semibold mr-3"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(cert.id)}
                                className="text-red-600 hover:underline text-sm font-semibold"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">Type</th>
                        <th className="px-6 py-4 text-left font-semibold">Details</th>
                        <th className="px-6 py-4 text-left font-semibold">Resident</th>
                        <th className="px-6 py-4 text-left font-semibold">Requested</th>
                        <th className="px-6 py-4 text-left font-semibold">Assign to</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterCertList(assignmentCerts).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-medium">
                            No new certificate requests from residents.
                          </td>
                        </tr>
                      ) : (
                        filterCertList(assignmentCerts).map((cert) => (
                          <tr key={cert.id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">
                              {(cert.certificate_type || 'UNKNOWN').toUpperCase()}
                              <span className="ml-2 text-xs text-amber-700">Pending</span>
                            </td>
                            <td className="px-6 py-4 text-sm">{certApplicantSummary(cert)}</td>
                            <td className="px-6 py-4 text-sm">
                              {cert.resident_firstname} {cert.resident_lastname}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {cert.requested_at ? new Date(cert.requested_at).toLocaleString() : '—'}
                            </td>
                            <td className="px-6 py-4">{renderAssignControls(cert)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Users Management Tab */}
          {activeTab === 'users' && (
            <div>
              <h3 className="text-2xl font-semibold mb-6">User Management</h3>
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Name</th>
                      <th className="px-6 py-4 text-left font-semibold">Email</th>
                      <th className="px-6 py-4 text-left font-semibold">Role</th>
                      <th className="px-6 py-4 text-left font-semibold">Status</th>
                      <th className="px-6 py-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 1, name: "Abebe Bikila", email: "abebe@example.com", role: "Resident", kebele: "Kebele 01", status: "active" },
                      { id: 2, name: "Almaz Genene", email: "almaz@example.com", role: "Staff", kebele: "Kebele 02", status: "active" },
                      { id: 3, name: "Daniel Adeba", email: "daniel@example.com", role: "Resident", kebele: "Kebele 03", status: "inactive" },
                      { id: 4, name: "Yohannes Mesfin", email: "yohannes@example.com", role: "Manager", kebele: "Kebele 01", status: "active" },
                      { id: 5, name: "Sara Kebede", email: "sara@example.com", role: "Resident", kebele: "Kebele 02", status: "active" },
                    ].map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm">{user.role}</td>
                        <td className="px-6 py-4 text-sm">{user.kebele}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Staff Management Tab */}
          {activeTab === 'staff' && (
            <div>
              <h3 className="text-2xl font-semibold mb-6">Staff Management</h3>
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Employee ID</th>
                      <th className="px-6 py-4 text-left font-semibold">Email</th>
                      <th className="px-6 py-4 text-left font-semibold">Position</th>
                      <th className="px-6 py-4 text-left font-semibold">Status</th>
                      <th className="px-6 py-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map(staff => (
                      <tr key={staff.user_id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{staff.employee_id || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{staff.email}</td>
                        <td className="px-6 py-4 text-sm">{staff.position || 'Staff'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${staff.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {staff.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleStaffToggle(staff.user_id, staff.is_active)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${staff.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                          >
                            {staff.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {staffList.length === 0 && (
                      <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No staff found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Task Assignment Tab */}
          {activeTab === 'tasks' && (
            <div>
              <h3 className="text-2xl font-semibold mb-6">Task Assignment</h3>
              
              <div className="bg-white rounded-2xl shadow p-6 mb-8 border border-gray-100">
                <h4 className="text-lg font-semibold mb-4">Create New Task</h4>
                <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input type="text" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="Task Title"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                    <select value={newTask.task_type} onChange={e => setNewTask({...newTask, task_type: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500">
                      <option value="id_card">ID Card</option>
                      <option value="birth_certificate">Birth Certificate</option>
                      <option value="death_certificate">Death Certificate</option>
                      <option value="marriage_certificate">Marriage Certificate</option>
                      <option value="issue_report">Issue Report</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500" rows="3" placeholder="Detailed description..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign To (Staff)</label>
                    <select required value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select Staff...</option>
                      {staffList.filter(s => s.is_active).map(staff => (
                        <option key={staff.user_id} value={staff.user_id}>{staff.email} ({staff.position || 'Staff'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition">Assign Task</button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Task</th>
                      <th className="px-6 py-4 text-left font-semibold">Type</th>
                      <th className="px-6 py-4 text-left font-semibold">Assigned To</th>
                      <th className="px-6 py-4 text-left font-semibold">Status</th>
                      <th className="px-6 py-4 text-left font-semibold">Due Date</th>
                      <th className="px-6 py-4 text-left font-semibold">Reassign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{task.title}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{task.task_type.replace('_', ' ')}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{task.assigned_staff_email} ({task.assigned_staff_position || 'Staff'})</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.status === 'completed' ? 'bg-green-100 text-green-700' : task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                            {task.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4">
                          <select 
                            onChange={(e) => handleReassignTask(task.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                            value={task.assigned_to}
                          >
                            <option value="">Reassign...</option>
                            {staffList.filter(s => s.is_active).map(staff => (
                              <option key={staff.user_id} value={staff.user_id}>{staff.email} ({staff.position || 'Staff'})</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {tasks.length === 0 && (
                      <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No tasks found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports & Complaints Tab */}
          {activeTab === 'reports' && (
            <div>
              {!selectedReport ? (
                <>
                  <h3 className="text-2xl font-semibold mb-6">Reports & Complaints</h3>
                  <div className="bg-white rounded-2xl shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left font-semibold">Category</th>
                          <th className="px-6 py-4 text-left font-semibold">Reporter</th>
                          <th className="px-6 py-4 text-left font-semibold">Description</th>
                          <th className="px-6 py-4 text-left font-semibold">Date</th>
                          <th className="px-6 py-4 text-left font-semibold">Status</th>
                          <th className="px-6 py-4 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 1, category: "Road Damage", reporter: "Abebe T.", description: "Large pothole on main road affecting traffic", date: "2025-05-12", status: "open", hasImages: true },
                          { id: 2, category: "Water Supply Problem", reporter: "Meron A.", description: "No water supply in residential area for 3 days", date: "2025-05-11", status: "in-progress", hasImages: true },
                          { id: 3, category: "Electricity Outage", reporter: "Yohannes M.", description: "Power outage affecting entire kebele since morning", date: "2025-05-10", status: "resolved", hasImages: false },
                          { id: 4, category: "Sanitation / Waste", reporter: "Sara K.", description: "Garbage collection not done for 2 weeks", date: "2025-05-09", status: "open", hasImages: true },
                          { id: 5, category: "Security Concern", reporter: "Daniel A.", description: "Suspicious activity in residential area at night", date: "2025-05-08", status: "resolved", hasImages: false },
                        ].map(report => (
                          <tr key={report.id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{report.category}</td>
                            <td className="px-6 py-4 text-sm">{report.reporter}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{report.description}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{report.date}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${report.status === 'open' ? 'bg-red-100 text-red-700' :
                                  report.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                          <button className="text-blue-600 hover:underline text-sm font-medium">View Details</button>
                        </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow p-8">
                  <button onClick={() => setSelectedReport(null)} className="text-blue-600 hover:underline font-medium mb-6">← Back to Reports</button>

                  <h3 className="text-2xl font-semibold mb-6">Investigate Report #{selectedReport.id}</h3>

                  <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Category</label>
                      <p className="text-lg font-medium mt-1">{selectedReport.category}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Reporter</label>
                      <p className="text-lg font-medium mt-1">{selectedReport.reporter}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Date Reported</label>
                      <p className="text-lg font-medium mt-1">{selectedReport.date}</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Status</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${selectedReport.status === 'open' ? 'bg-red-100 text-red-700' :
                          selectedReport.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                        {selectedReport.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="text-sm font-semibold block mb-2">Description</label>
                    <p className="text-gray-700">{selectedReport.description}</p>
                  </div>

                  <div className="mb-8">
                    <label className="text-sm font-semibold block mb-3">Evidence Photos (Max 4)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition mb-4">
                      <input
                        type="file"
                        id="evidence-images"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label htmlFor="evidence-images" className="cursor-pointer block">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-3xl">📸</div>
                        <p className="font-medium">Click to upload evidence photos</p>
                        <p className="text-sm text-gray-500">JPG, PNG (max 5MB each)</p>
                      </label>
                    </div>

                    {reportImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-3">
                        {reportImages.map((img, index) => (
                          <div key={index} className="relative">
                            <img src={img.preview} alt={`evidence-${index}`} className="w-full h-24 object-cover rounded-lg border" />
                            <button type="button" onClick={() => removeReportImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-8">
                    <label className="text-sm font-semibold block mb-3">Investigation Notes</label>
                    <textarea
                      value={investigationNotes}
                      onChange={(e) => setInvestigationNotes(e.target.value)}
                      placeholder="Document your investigation findings, next steps, and resolution..."
                      rows="4"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <select className="px-4 py-3 border rounded-lg font-medium focus:ring-2 focus:ring-blue-500">
                      <option>Assign to: Select Staff</option>
                      <option>Abebe Bikila</option>
                      <option>Almaz Genene</option>
                      <option>Yohannes Mesfin</option>
                    </select>
                    <select className="px-4 py-3 border rounded-lg font-medium focus:ring-2 focus:ring-blue-500">
                      <option value="">Update Status...</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition">Save Investigation</button>
                    <button onClick={() => setSelectedReport(null)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold transition">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;