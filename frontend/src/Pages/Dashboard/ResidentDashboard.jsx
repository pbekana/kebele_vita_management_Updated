import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, Download, AlertTriangle, User, LogOut, Send, Phone, Mail, MapPin, Shield, CheckCircle, Clock } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const css = `
  .kd * { box-sizing: border-box; margin: 0; padding: 0; }

  .kd {
    min-height: 100vh;
    display: flex;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f0f4ff;
  }

  /* ── SIDEBAR ── */
  .kd-sidebar {
    width: 268px;
    min-height: 100vh;
    background: #0d1b3e;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
  }

  .kd-brand {
    padding: 28px 22px 22px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .kd-brand-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .kd-brand-icon {
    width: 42px; height: 42px;
    background: #2563eb;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .kd-brand-name {
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }

  .kd-brand-sub {
    font-size: 11px;
    color: #475569;
    margin-top: 2px;
    letter-spacing: 0.04em;
  }

  .kd-user-pill {
    margin-top: 16px;
    background: rgba(37,99,235,0.12);
    border: 1px solid rgba(37,99,235,0.2);
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .kd-avatar {
    width: 34px; height: 34px;
    background: #2563eb;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }

  .kd-user-name {
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .kd-user-role {
    font-size: 10px;
    color: #60a5fa;
    margin-top: 1px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .kd-nav {
    flex: 1;
    padding: 22px 14px;
  }

  .kd-nav-label {
    font-size: 10px;
    color: #334155;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 600;
    padding: 0 10px;
    margin-bottom: 10px;
  }

  .kd-nav-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-bottom: 3px;
    text-align: left;
    font-family: inherit;
  }

  .kd-nav-btn svg { width: 17px; height: 17px; flex-shrink: 0; }
  .kd-nav-btn:hover { background: rgba(255,255,255,0.05); color: #cbd5e1; }

  .kd-nav-btn.active {
    background: #2563eb;
    color: #fff;
  }

  .kd-nav-btn.active svg { color: #bfdbfe; }

  .kd-sidebar-footer {
    padding: 14px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .kd-logout {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    color: #f87171;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .kd-logout svg { width: 17px; height: 17px; }
  .kd-logout:hover { background: rgba(248,113,113,0.08); }

  /* ── MAIN ── */
  .kd-main {
    flex: 1;
    margin-left: 268px;
    padding: 36px 40px;
    min-height: 100vh;
  }

  .kd-topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .kd-welcome-title {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
  }

  .kd-welcome-sub {
    font-size: 14px;
    color: #64748b;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .kd-kebele-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
  }

  /* ── STAT CARDS ── */
  .kd-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }

  .kd-stat-card {
    background: #fff;
    border-radius: 16px;
    padding: 20px 22px;
    border: 1px solid #e8edf8;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .kd-stat-icon {
    width: 46px; height: 46px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .kd-stat-icon.blue { background: #eff6ff; }
  .kd-stat-icon.green { background: #f0fdf4; }
  .kd-stat-icon.amber { background: #fffbeb; }

  .kd-stat-num {
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .kd-stat-lbl {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 500;
    margin-top: 3px;
  }

  /* ── CONTENT GRID ── */
  .kd-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;
  }

  /* ── SECTION HEADER ── */
  .kd-section-hd {
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  /* ── APPLY CARDS ── */
  .kd-apply-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .kd-apply-card {
    background: #fff;
    border: 1.5px solid #e8edf8;
    border-radius: 18px;
    padding: 22px 20px;
    cursor: pointer;
    transition: all 0.18s ease;
    text-decoration: none;
    display: block;
    position: relative;
    overflow: hidden;
  }

  .kd-apply-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: #2563eb;
    transform: scaleX(0);
    transition: transform 0.2s ease;
    transform-origin: left;
  }

  .kd-apply-card:hover {
    border-color: #bfdbfe;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(37,99,235,0.08);
  }

  .kd-apply-card:hover::before { transform: scaleX(1); }

  .kd-apply-emoji {
    font-size: 32px;
    margin-bottom: 12px;
    display: block;
  }

  .kd-apply-title {
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 4px;
  }

  .kd-apply-sub {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 500;
  }

  /* ── CERT LIST ── */
  .kd-cert-panel {
    background: #fff;
    border-radius: 18px;
    border: 1px solid #e8edf8;
    overflow: hidden;
  }

  .kd-cert-panel-hd {
    padding: 18px 20px 14px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
  }

  .kd-cert-panel-hd svg { color: #2563eb; width: 18px; height: 18px; }

  .kd-cert-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid #f8fafc;
    transition: background 0.12s;
  }

  .kd-cert-row:last-child { border-bottom: none; }
  .kd-cert-row:hover { background: #fafbff; }

  .kd-cert-type {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }

  .kd-cert-date {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 2px;
  }

  .kd-cert-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .kd-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 20px;
  }

  .kd-badge.pending { background: #fffbeb; color: #b45309; }
  .kd-badge.assigned { background: #e0f2fe; color: #0369a1; }
  .kd-badge.processing { background: #ede9fe; color: #5b21b6; }
  .kd-badge.ready { background: #dbeafe; color: #1d4ed8; }
  .kd-badge.approved { background: #f0fdf4; color: #16a34a; }
  .kd-badge.rejected { background: #fef2f2; color: #b91c1c; }
  .kd-badge.issued { background: #f0fdf4; color: #15803d; }

  .kd-dl-btn {
    width: 32px; height: 32px;
    border-radius: 8px;
    border: 1.5px solid #bfdbfe;
    background: #eff6ff;
    color: #2563eb;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .kd-dl-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
  .kd-dl-btn svg { width: 15px; height: 15px; }

  /* ── REPORT FORM ── */
  .kd-form-card {
    background: #fff;
    border-radius: 18px;
    border: 1px solid #e8edf8;
    padding: 28px;
    max-width: 640px;
  }

  .kd-form-title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }

  .kd-form-sub {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 24px;
  }

  .kd-field { margin-bottom: 18px; }

  .kd-label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .kd-input, .kd-select, .kd-textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    color: #1e293b;
    background: #fff;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }

  .kd-input:focus, .kd-select:focus, .kd-textarea:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }

  .kd-textarea { resize: vertical; min-height: 120px; }

  .kd-submit-btn {
    width: 100%;
    padding: 13px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;
    letter-spacing: 0.02em;
    margin-top: 6px;
  }

  .kd-submit-btn:hover { background: #1d4ed8; }
  .kd-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .kd-submit-btn svg { width: 16px; height: 16px; }

  .kd-success-box {
    background: #f0fdf4;
    border: 1.5px solid #bbf7d0;
    border-radius: 18px;
    padding: 40px 28px;
    text-align: center;
    max-width: 640px;
  }

  .kd-success-icon { font-size: 48px; margin-bottom: 16px; }

  .kd-success-title {
    font-size: 20px;
    font-weight: 800;
    color: #15803d;
    margin-bottom: 8px;
  }

  .kd-success-desc {
    font-size: 14px;
    color: #4ade80;
    margin-bottom: 24px;
    color: #16a34a;
  }

  .kd-success-retry {
    padding: 11px 28px;
    background: #16a34a;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  /* ── PROFILE ── */
  .kd-profile-wrap { max-width: 620px; }

  .kd-profile-header {
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
    border-radius: 18px;
    padding: 32px 28px;
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 16px;
  }

  .kd-profile-avatar {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    border: 3px solid rgba(255,255,255,0.35);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    flex-shrink: 0;
    letter-spacing: -0.01em;
  }

  .kd-profile-name {
    font-size: 22px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }

  .kd-profile-role {
    font-size: 12px;
    color: #93c5fd;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .kd-profile-since {
    font-size: 12px;
    color: rgba(255,255,255,0.5);
    margin-top: 6px;
  }

  .kd-profile-card {
    background: #fff;
    border-radius: 18px;
    border: 1px solid #e8edf8;
    overflow: hidden;
  }

  .kd-profile-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid #f8fafc;
    transition: background 0.12s;
  }

  .kd-profile-row:last-child { border-bottom: none; }
  .kd-profile-row:hover { background: #fafbff; }

  .kd-prof-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: #eff6ff;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .kd-prof-icon svg { width: 17px; height: 17px; color: #2563eb; }

  .kd-prof-lbl {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 3px;
  }

  .kd-prof-val {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }
`;

const ResidentDashboard = () => {
  const [activeTab, setActiveTab] = useState('certificates');
  const [reportForm, setReportForm] = useState({ title: '', category: '', description: '' });
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [myReports, setMyReports] = useState([]);

  const [certificates, setCertificates] = useState([]);
  const [userProfile, setUserProfile] = useState({
    name: "Resident User",
    email: "resident@kebele.gov.et",
    phone: "—",
    kebele: "Jimma 01",
    address: "Ethiopia",
    nationalId: "ETH-2024-00123",
    joinedDate: "January 15, 2024"
  });
  const [loading, setLoading] = useState(true);
  const [certFetchError, setCertFetchError] = useState(null);
  const [certQuery, setCertQuery] = useState('');
  const [certPage, setCertPage] = useState(1);
  const certPageSize = 8;

  useEffect(() => {
    setCertPage(1);
  }, [certQuery]);

  useEffect(() => {
    const fetchData = async () => {
      setCertFetchError(null);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Fetch Profile
        const profileRes = await axios.get("http://localhost:5000/api/residents/profile", config);
        const p = profileRes.data.profile;
        if (p) {
          setUserProfile({
            name: `${p.firstname} ${p.lastname}`,
            email: p.email || "—",
            phone: p.phone_number || "—",
            kebele: "Heremata Mentina",
            address: p.address || "Jimma, Oromia, Ethiopia",
            nationalId: `ETH-2026-0${p.resident_id}`,
            joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "—"
          });
        }

        // 2. Fetch Certificates
        const certRes = await axios.get("http://localhost:5000/api/residents/certificates", config);
        setCertificates(certRes.data.certificates || []);

        // 3. Fetch Reports
        const reportsRes = await axios.get("http://localhost:5000/api/residents/feedback", config);
        setMyReports(reportsRes.data.reports || []);
      } catch (err) {
        console.error("Error loading resident dashboard data:", err);
        setCertFetchError(err.response?.data?.error || "Could not load your certificates.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const user = userProfile;
  const initials = user.name.split(' ').map(n => n[0]).join('');

  const issuedCount = certificates.filter(c => c.status === 'issued' || c.status === 'approved').length;
  const pendingCount = certificates.filter(c =>
    ['pending', 'assigned', 'processing', 'ready_for_approval'].includes(c.status)
  ).length;

  const filteredCertificates = useMemo(() => {
    const q = certQuery.trim().toLowerCase();
    if (!q) return certificates;
    return certificates.filter((c) => {
      const blob = [
        c.id,
        c.certificate_type,
        c.status,
        c.rejection_reason,
      ].filter(Boolean).join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [certificates, certQuery]);

  const certTotalPages = Math.max(1, Math.ceil(filteredCertificates.length / certPageSize));

  const pagedCertificates = useMemo(() => {
    const start = (certPage - 1) * certPageSize;
    return filteredCertificates.slice(start, start + certPageSize);
  }, [filteredCertificates, certPage, certPageSize]);

  const certStatusBadgeClass = (status) => {
    const map = {
      pending: 'pending',
      assigned: 'assigned',
      processing: 'processing',
      ready_for_approval: 'ready',
      approved: 'approved',
      rejected: 'rejected',
      issued: 'issued',
    };
    return map[status] || 'pending';
  };

  const certStatusLabel = (status) =>
    ({
      pending: 'Pending',
      assigned: 'Assigned',
      processing: 'Processing',
      ready_for_approval: 'Ready For Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      issued: 'Issued',
    }[status] || status);

  const applyItems = [
    { label: 'Birth', icon: '👶', path: 'birth' },
    { label: 'Marriage', icon: '💍', path: 'marriage' },
    { label: 'Death', icon: '⚰️', path: 'death' },
    { label: 'Residency ID', icon: '🪪', path: 'residency-id' },
  ];

  const downloadCertificate = async (cert) => {
    if (cert.status !== 'approved' && cert.status !== 'issued') {
      alert(`❌ This certificate status is '${cert.status}'. It must be approved/issued by the admin.`);
      return;
    }
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/residents/certificates/${cert.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob'
        }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${cert.certificate_type || "Certificate"}_${cert.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
      alert(`✅ Certificate downloaded!`);
    } catch (err) {
      console.error("Backend download failed, falling back to frontend canvas:", err);
      alert("Attempting frontend PDF generation fallback...");
      try {
        let certHTML = '';
        const cType = cert.certificate_type || cert.type;
        const cId = cert.certificateId || cert.id;
        const cDate = cert.requested_at ? new Date(cert.requested_at).toLocaleDateString() : cert.requested_at;
        if (cType === 'birth') {
          certHTML = `<div style="width:950px;padding:60px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:18px solid #1e40af;font-family:Arial,sans-serif;"><div style="text-align:center;border-bottom:3px solid #1e40af;padding-bottom:30px;margin-bottom:40px;"><div style="font-size:50px;margin-bottom:10px;">🏛️</div><h1 style="color:#1e40af;font-size:30px;margin:0;letter-spacing:2px;">HEREMATA MENTINA KEBELE</h1><p style="color:#475569;margin:8px 0;font-size:15px;">Official Vital Records Office • Jimma, Oromia, Ethiopia</p><h2 style="color:#1e40af;font-size:28px;margin:15px 0 0;">BIRTH CERTIFICATE</h2></div><div style="text-align:center;margin:30px 0;"><p style="font-size:18px;color:#475569;">This is to officially certify that</p><div style="display:inline-block;border-bottom:2px solid #1e40af;padding:10px 40px;margin:15px 0;"><h3 style="font-size:36px;color:#1e40af;margin:0;font-weight:bold;">${cert.child_name || '—'}</h3></div><div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px;text-align:left;max-width:600px;margin-left:auto;margin-right:auto;font-size:16px;"><p><strong>Date of Birth:</strong> ${cert.birth_date ? new Date(cert.birth_date).toLocaleDateString() : 'N/A'}</p><p><strong>Place of Birth:</strong> ${cert.birth_place || 'N/A'}</p><p><strong>Father's Name:</strong> ${cert.father_name || 'N/A'}</p><p><strong>Mother's Name:</strong> ${cert.mother_name || 'N/A'}</p></div></div><div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;"><div style="font-size:16px;line-height:2;"><p style="margin:0;"><strong>Certificate ID:</strong> <span style="color:#1e40af;">${cId}</span></p><p style="margin:0;"><strong>Date of Issue:</strong> ${cDate}</p><p style="margin:0;"><strong>Kebele:</strong> ${user.kebele}</p><p style="margin:0;"><strong>Status:</strong> <span style="color:#16a34a;font-weight:bold;">OFFICIALLY ISSUED</span></p></div><div style="text-align:center;"><div style="width:140px;height:140px;border:5px solid #1e40af;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;background:#e0f2fe;"><span style="font-size:60px;">👶</span></div><p style="font-size:13px;color:#475569;margin-top:10px;">Official Seal</p></div></div><div style="text-align:center;margin-top:40px;border-top:1px solid #bfdbfe;padding-top:20px;"><p style="color:#64748b;font-size:13px;">This document is issued by the Kebele Administration Office and is legally valid.</p></div></div>`;
        } else if (cType === 'marriage') {
          certHTML = `<div style="width:950px;padding:60px;background:linear-gradient(135deg,#fff7ed,#fef3c7);border:18px double #92400e;font-family:Georgia,serif;"><div style="text-align:center;margin-bottom:30px;"><div style="font-size:50px;margin-bottom:10px;">🏛️</div><h1 style="color:#92400e;font-size:30px;margin:0;letter-spacing:2px;">HEREMATA MENTINA KEBELE</h1><p style="color:#78716c;font-size:15px;margin:8px 0;">Official Marriage Registry • Jimma, Oromia, Ethiopia</p><h2 style="color:#92400e;font-size:32px;margin:20px 0 0;">✦ MARRIAGE CERTIFICATE ✦</h2></div><div style="text-align:center;margin:30px 0;"><p style="font-size:18px;color:#78716c;font-style:italic;">This is to solemnly certify the holy union between</p><h3 style="font-size:32px;color:#92400e;margin:15px 0;border-bottom:2px solid #f59e0b;display:inline-block;padding:10px 50px;">${cert.husband_name || '—'} & ${cert.wife_name || '—'}</h3><div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px;text-align:left;max-width:600px;margin-left:auto;margin-right:auto;font-size:16px;font-family:Arial,sans-serif;"><p><strong>Marriage Date:</strong> ${cert.marriage_date ? new Date(cert.marriage_date).toLocaleDateString() : 'N/A'}</p><p><strong>Marriage Place:</strong> ${cert.marriage_place || 'N/A'}</p><p style="grid-column: span 2;"><strong>Witness Name:</strong> ${cert.witness_name || 'N/A'}</p></div></div><div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;"><div style="font-size:16px;line-height:2;font-family:Arial,sans-serif;"><p style="margin:0;"><strong>Certificate ID:</strong> ${cId}</p><p style="margin:0;"><strong>Date of Issue:</strong> ${cDate}</p><p style="margin:0;"><strong>Kebele:</strong> ${user.kebele}</p><p style="margin:0;"><strong>Status:</strong> <span style="color:#16a34a;font-weight:bold;">OFFICIALLY ISSUED</span></p></div><div style="text-align:center;"><div style="width:140px;height:140px;border:5px solid #92400e;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fef3c7;"><span style="font-size:60px;">💍</span></div><p style="font-size:13px;color:#78716c;margin-top:10px;">Official Seal</p></div></div></div>`;
        } else if (cType === 'death') {
          certHTML = `<div style="width:950px;padding:60px;background:#f8fafc;border:18px solid #334155;font-family:Arial,sans-serif;"><div style="text-align:center;border-bottom:2px solid #334155;padding-bottom:30px;margin-bottom:40px;"><div style="font-size:50px;margin-bottom:10px;">🏛️</div><h1 style="color:#334155;font-size:30px;margin:0;">HEREMATA MENTINA KEBELE</h1><p style="color:#64748b;font-size:15px;margin:8px 0;">Official Vital Records Office • Jimma, Oromia, Ethiopia</p><h2 style="color:#334155;font-size:28px;margin:15px 0 0;">DEATH CERTIFICATE</h2></div><div style="text-align:center;margin:30px 0;"><p style="font-size:18px;color:#64748b;">This is to officially certify the death of</p><div style="border:2px solid #334155;display:inline-block;padding:15px 50px;margin:15px 0;"><h3 style="font-size:36px;color:#334155;margin:0;">${cert.child_name || '—'}</h3></div><div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px;text-align:left;max-width:600px;margin-left:auto;margin-right:auto;font-size:16px;"><p><strong>Date of Death:</strong> ${cert.death_date ? new Date(cert.death_date).toLocaleDateString() : 'N/A'}</p><p><strong>Place of Death:</strong> ${cert.death_place || 'N/A'}</p><p style="grid-column: span 2;"><strong>Cause of Death:</strong> ${cert.cause_of_death || 'N/A'}</p></div></div><div style="display:flex;justify-content:space-between;margin-top:40px;"><div style="font-size:16px;line-height:2;"><p><strong>Certificate ID:</strong> ${cId}</p><p><strong>Date of Issue:</strong> ${cDate}</p><p><strong>Kebele:</strong> ${user.kebele}</p><p><strong>Status:</strong> <span style="color:#16a34a;">OFFICIALLY ISSUED</span></p></div><div style="text-align:center;"><div style="width:140px;height:140px;border:5px solid #334155;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#f1f5f9;"><span style="font-size:60px;">🏛️</span></div><p style="font-size:13px;color:#64748b;margin-top:10px;">Official Seal</p></div></div></div>`;
        } else {
          certHTML = `<div style="width:950px;padding:60px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:18px solid #166534;font-family:Arial,sans-serif;"><div style="text-align:center;border-bottom:3px solid #166534;padding-bottom:30px;margin-bottom:40px;"><div style="font-size:50px;margin-bottom:10px;">🏛️</div><h1 style="color:#166534;font-size:30px;margin:0;">HEREMATA MENTINA KEBELE</h1><p style="color:#4b5563;font-size:15px;margin:8px 0;">Official Records Office • Jimma, Oromia, Ethiopia</p><h2 style="color:#166534;font-size:28px;margin:15px 0 0;">${cType.toUpperCase()} CERTIFICATE</h2></div><div style="text-align:center;margin:50px 0;"><p style="font-size:18px;color:#4b5563;">This is to certify that</p><h3 style="font-size:38px;color:#166534;margin:20px 0;">${cert.child_name || user.name}</h3></div><div style="display:flex;justify-content:space-between;margin-top:60px;font-size:16px;line-height:2;"><div><p><strong>Certificate ID:</strong> ${cId}</p><p><strong>Date of Issue:</strong> ${cDate}</p><p><strong>Kebele:</strong> ${user.kebele}</p></div><div style="width:160px;height:160px;border:5px solid #166534;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#dcfce7;"><span style="font-size:70px;">🪪</span></div></div></div>`;
        }
  
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = certHTML;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-10000px';
        document.body.appendChild(tempDiv);
        const canvas = await html2canvas(tempDiv.firstElementChild, { scale: 2, useCORS: true });
        document.body.removeChild(tempDiv);
        const pdf = new jsPDF('landscape', 'px', [canvas.width, canvas.height]);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${cType}_Certificate_${cId}.pdf`);
        alert(`✅ ${cType} Certificate downloaded via fallback!`);
      } catch (fallbackErr) {
        console.error("Fallback failed:", fallbackErr);
        alert("Failed to generate PDF. Please try again.");
      }
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/residents/feedback', reportForm, config);
      setReportSubmitted(true);
      
      const reportsRes = await axios.get("http://localhost:5000/api/residents/feedback", config);
      setMyReports(reportsRes.data.reports || []);
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert(err.response?.data?.error || "Failed to submit report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="kd">

        {/* ── SIDEBAR ── */}
        <aside className="kd-sidebar">
          <div className="kd-brand">
            <div className="kd-brand-row">
              <div className="kd-brand-icon">🏛️</div>
              <div>
                <div className="kd-brand-name">Heremata Mentina</div>
                <div className="kd-brand-sub">Kebele Administration</div>
              </div>
            </div>
            <div className="kd-user-pill" style={{ marginTop: 16 }}>
              <div className="kd-avatar">{initials}</div>
              <div>
                <div className="kd-user-name">{user.name}</div>
                <div className="kd-user-role">Resident</div>
              </div>
            </div>
          </div>

          <nav className="kd-nav">
            <div className="kd-nav-label">Navigation</div>
            {[
              { id: 'certificates', label: 'Certificates', Icon: FileText },
              { id: 'report', label: 'Report Issue', Icon: AlertTriangle },
              { id: 'profile', label: 'My Profile', Icon: User },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`kd-nav-btn ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>

          <div className="kd-sidebar-footer">
            <button
              className="kd-logout"
              onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            >
              <LogOut />
              Logout
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="kd-main">

          {/* Top bar */}
          <div className="kd-topbar">
            <div>
              <div className="kd-welcome-title">Welcome back, {user.name.split(' ')[0]}! 👋</div>
              <div className="kd-welcome-sub">
                <span className="kd-kebele-tag">🏘 {user.kebele}</span>
                <span>Resident since {user.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* ── CERTIFICATES TAB ── */}
          {activeTab === 'certificates' && (
            <>
              {/* Stat strip */}
              <div className="kd-stats">
                <div className="kd-stat-card">
                  <div className="kd-stat-icon blue">📋</div>
                  <div>
                    <div className="kd-stat-num">{certificates.length}</div>
                    <div className="kd-stat-lbl">Total Applications</div>
                  </div>
                </div>
                <div className="kd-stat-card">
                  <div className="kd-stat-icon green">✅</div>
                  <div>
                    <div className="kd-stat-num">{issuedCount}</div>
                    <div className="kd-stat-lbl">Issued</div>
                  </div>
                </div>
                <div className="kd-stat-card">
                  <div className="kd-stat-icon amber">⏳</div>
                  <div>
                    <div className="kd-stat-num">{pendingCount}</div>
                    <div className="kd-stat-lbl">Pending</div>
                  </div>
                </div>
              </div>

              <div className="kd-grid">
                {/* Apply cards */}
                <div>
                  <div className="kd-section-hd">Request certificate</div>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Choose a certificate type to submit a new request. An administrator will assign your file to the correct office.</p>
                  <div className="kd-apply-grid">
                    {applyItems.map((item) => (
                      <Link key={item.path} to={`/apply/${item.path}`} className="kd-apply-card">
                        <span className="kd-apply-emoji">{item.icon}</span>
                        <div className="kd-apply-title">{item.label} Certificate</div>
                        <div className="kd-apply-sub">Apply Now →</div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Certificate list */}
                <div>
                  <div className="kd-section-hd">My certificate requests</div>
                  <div className="kd-cert-panel">
                    <div className="kd-cert-panel-hd">
                      <Download />
                      Status & downloads
                    </div>
                    {certFetchError && (
                      <p style={{ padding: 16, color: '#b91c1c', fontWeight: 600 }}>{certFetchError}</p>
                    )}
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        className="kd-input"
                        style={{ maxWidth: 280, margin: 0 }}
                        placeholder="Search by type, status, or ID…"
                        value={certQuery}
                        onChange={(e) => setCertQuery(e.target.value)}
                      />
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {filteredCertificates.length} request{filteredCertificates.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {loading ? (
                      <p style={{ padding: 24, textAlign: 'center', color: '#64748b', fontWeight: '500' }}>Loading certificates…</p>
                    ) : certificates.length === 0 ? (
                      <p style={{ padding: 24, textAlign: 'center', color: '#64748b', fontWeight: '500' }}>No certificate applications yet.</p>
                    ) : pagedCertificates.length === 0 ? (
                      <p style={{ padding: 24, textAlign: 'center', color: '#64748b', fontWeight: '500' }}>No requests match your search.</p>
                    ) : (
                      pagedCertificates.map(cert => (
                        <div key={cert.id} className="kd-cert-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                              <div className="kd-cert-type">{(cert.certificate_type || cert.type || "UNKNOWN").toUpperCase()} certificate</div>
                              {cert.certificate_type === 'death' && (
                                <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginTop: 2 }}>Deceased: <span style={{ fontWeight: 600, color: '#1e293b' }}>{cert.child_name || "—"}</span></div>
                              )}
                              {cert.certificate_type === 'birth' && (
                                <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginTop: 2 }}>Child: <span style={{ fontWeight: 600, color: '#1e293b' }}>{cert.child_name || "—"}</span></div>
                              )}
                              {cert.certificate_type === 'marriage' && (
                                <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginTop: 2 }}>Husband: <span style={{ fontWeight: 600, color: '#1e293b' }}>{cert.husband_name || "—"}</span> · Wife: <span style={{ fontWeight: 600, color: '#1e293b' }}>{cert.wife_name || "—"}</span></div>
                              )}
                              {(cert.certificate_type === 'residency' || cert.certificate_type === 'residency-id') && (
                                <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginTop: 2 }}>Applicant: <span style={{ fontWeight: 600, color: '#1e293b' }}>{cert.child_name || "—"}</span></div>
                              )}
                              <div className="kd-cert-date">Requested: {cert.requested_at ? new Date(cert.requested_at).toLocaleString() : "—"}</div>
                              {(cert.status === 'approved' || cert.status === 'issued') && cert.approved_at && (
                                <div className="kd-cert-date" style={{ color: '#15803d' }}>
                                  Approved: {new Date(cert.approved_at).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className="kd-cert-actions">
                              <span className={`kd-badge ${certStatusBadgeClass(cert.status)}`}>
                                {certStatusLabel(cert.status)}
                              </span>
                              {(cert.status === 'issued' || cert.status === 'approved') && (
                                <button
                                  className="kd-dl-btn"
                                  onClick={() => downloadCertificate(cert)}
                                  title="Download certificate"
                                  type="button"
                                >
                                  <Download />
                                </button>
                              )}
                            </div>
                          </div>
                          {cert.status === 'rejected' && cert.rejection_reason && (
                            <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', padding: '8px 10px', borderRadius: 8 }}>
                              <strong>Rejection reason:</strong> {cert.rejection_reason}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {filteredCertificates.length > certPageSize && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          className="kd-submit-btn"
                          style={{ width: 'auto', padding: '8px 16px', background: '#e2e8f0', color: '#1e293b' }}
                          disabled={certPage <= 1}
                          onClick={() => setCertPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </button>
                        <span style={{ fontSize: 13, color: '#64748b' }}>Page {certPage} / {certTotalPages}</span>
                        <button
                          type="button"
                          className="kd-submit-btn"
                          style={{ width: 'auto', padding: '8px 16px', background: '#e2e8f0', color: '#1e293b' }}
                          disabled={certPage >= certTotalPages}
                          onClick={() => setCertPage((p) => Math.min(certTotalPages, p + 1))}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── REPORT ISSUE TAB ── */}
          {activeTab === 'report' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div className="kd-welcome-title" style={{ fontSize: 22 }}>Report an Issue</div>
                <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                  Submit a complaint or problem to the Kebele office
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
                
                {/* Submit Panel */}
                <div>
                  {reportSubmitted ? (
                    <div className="kd-success-box" style={{ margin: 0 }}>
                      <div className="kd-success-icon">✅</div>
                      <div className="kd-success-title">Report Submitted Successfully!</div>
                      <div className="kd-success-desc">
                        Your issue has been reported. The Kebele office will review it and respond shortly.
                      </div>
                      <button
                        className="kd-success-retry"
                        onClick={() => {
                          setReportSubmitted(false);
                          setReportForm({ title: '', category: '', description: '' });
                        }}
                      >
                        Submit Another Report
                      </button>
                    </div>
                  ) : (
                    <div className="kd-form-card" style={{ margin: 0 }}>
                      <div className="kd-form-title">New Issue Report</div>
                      <div className="kd-form-sub">All fields are required. We aim to respond within 2–3 business days.</div>

                      <form onSubmit={handleReportSubmit}>
                        <div className="kd-field">
                          <label className="kd-label">Issue Title</label>
                          <input
                            className="kd-input"
                            type="text"
                            placeholder="Brief description of the issue"
                            value={reportForm.title}
                            onChange={e => setReportForm({ ...reportForm, title: e.target.value })}
                            required
                          />
                        </div>

                        <div className="kd-field">
                          <label className="kd-label">Category</label>
                          <select
                            className="kd-select"
                            value={reportForm.category}
                            onChange={e => setReportForm({ ...reportForm, category: e.target.value })}
                            required
                          >
                            <option value="">Select a category</option>
                            <option value="waste">🗑 Waste &amp; Garbage</option>
                            <option value="electricity">⚡ Electricity Problem</option>
                            <option value="water">💧 Water Supply Issue</option>
                            <option value="road">🛣 Road &amp; Infrastructure</option>
                            <option value="sanitation">🧹 Sanitation &amp; Hygiene</option>
                            <option value="security">🔒 Security Concern</option>
                            <option value="certificate">📄 Certificate Issue</option>
                            <option value="identity">🪪 Identity / ID Problem</option>
                            <option value="records">📋 Records Error</option>
                            <option value="service">🏛 Service Complaint</option>
                            <option value="other">📌 Other</option>
                          </select>
                        </div>

                        <div className="kd-field">
                          <label className="kd-label">Description</label>
                          <textarea
                            className="kd-textarea"
                            placeholder="Describe the issue in detail — location, time, what happened..."
                            value={reportForm.description}
                            onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="kd-submit-btn"
                          disabled={reportLoading}
                        >
                          <Send />
                          {reportLoading ? 'Submitting...' : 'Submit Report'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* My Past Reports Panel */}
                <div className="kd-form-card" style={{ margin: 0, height: 'fit-content', maxHeight: '720px', overflowY: 'auto' }}>
                  <div className="kd-form-title">My Submitted Reports</div>
                  <div className="kd-form-sub">Track status and view response messages from Kebele officers.</div>

                  <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {myReports.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: 14 }}>
                        You haven't submitted any reports yet.
                      </div>
                    ) : (
                      myReports.map((report) => (
                        <div key={report.id} style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, backgroundColor: '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#6366f1' }}>
                              {report.category}
                            </span>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 9999,
                              backgroundColor: report.status === 'completed' ? '#d1fae5' : report.status === 'in_review' ? '#dbeafe' : '#fef3c7',
                              color: report.status === 'completed' ? '#065f46' : report.status === 'in_review' ? '#1e40af' : '#92400e'
                            }}>
                              {report.status === 'completed' ? 'Resolved' : report.status === 'in_review' ? 'In Review' : 'Pending'}
                            </span>
                          </div>
                          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>{report.title}</h4>
                          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px 0', lineHeight: 1.4 }}>{report.description}</p>
                          
                          {report.response ? (
                            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 10 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', display: 'block', marginBottom: 4 }}>
                                Officer Response:
                              </span>
                              <p style={{ fontSize: 12, color: '#0d9488', margin: 0, fontStyle: 'italic', fontWeight: 600, lineHeight: 1.4 }}>
                                "{report.response}"
                              </p>
                            </div>
                          ) : (
                            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 10 }}>
                              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>
                                Pending review from Reports Officer
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div className="kd-welcome-title" style={{ fontSize: 22 }}>My Profile</div>
                <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                  Your personal information and account details
                </div>
              </div>

              <div className="kd-profile-wrap">
                <div className="kd-profile-header">
                  <div className="kd-profile-avatar">{initials}</div>
                  <div>
                    <div className="kd-profile-name">{user.name}</div>
                    <div className="kd-profile-role">Registered Resident</div>
                    <div className="kd-profile-since">Member since {user.joinedDate}</div>
                  </div>
                </div>

                <div className="kd-profile-card">
                  {[
                    { icon: <Mail />, label: 'Email Address', value: user.email },
                    { icon: <Phone />, label: 'Phone Number', value: user.phone },
                    { icon: <MapPin />, label: 'Address', value: user.address },
                    { icon: <Shield />, label: 'National ID', value: user.nationalId },
                    { icon: <FileText />, label: 'Kebele', value: user.kebele },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="kd-profile-row">
                      <div className="kd-prof-icon">{icon}</div>
                      <div>
                        <div className="kd-prof-lbl">{label}</div>
                        <div className="kd-prof-val">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </>
  );
};

export default ResidentDashboard;