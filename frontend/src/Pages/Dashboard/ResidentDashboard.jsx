import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, Download, AlertTriangle, User, LogOut, Send, Phone, Mail, MapPin, Shield, CheckCircle, Clock, Printer, Briefcase } from 'lucide-react';
import { useNotification } from '../../components/NotificationProvider';
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

  /* ── ETHIOPIAN KEBELE ID CARD STYLE SYSTEM ── */
  .id-card-container {
    width: 148mm;
    height: 210mm;
    background-color: #ffffff;
    border: 1px solid #cccccc;
    box-sizing: border-box;
    padding: 12px;
    font-family: 'Outfit', 'Inter', 'Roboto', sans-serif;
    color: #000000;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .id-card-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 3.8rem;
    font-weight: 900;
    color: rgba(220, 220, 220, 0.22);
    white-space: nowrap;
    pointer-events: none;
    z-index: 1;
    letter-spacing: 5px;
  }
  .id-card-header {
    background-color: #078930;
    color: #ffffff;
    text-align: center;
    padding: 8px 6px;
    border-radius: 4px;
    position: relative;
    z-index: 2;
    margin-bottom: 8px;
    border: 2px solid #005a20;
  }
  .id-card-header-country {
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .id-card-header-country-am {
    font-size: 9.5px;
    font-weight: bold;
    margin-top: 1px;
  }
  .id-card-header-kebele {
    font-size: 7.5px;
    margin-top: 1px;
    opacity: 0.95;
    line-height: 1.3;
  }
  .id-card-header-title {
    font-size: 11px;
    font-weight: 800;
    color: #ffeb3b;
    margin-top: 4px;
    letter-spacing: 0.5px;
  }
  .id-card-header-number {
    font-size: 9.5px;
    font-weight: bold;
    background-color: rgba(255, 255, 255, 0.2);
    display: inline-block;
    padding: 1px 8px;
    border-radius: 2px;
    margin-top: 3px;
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  .id-card-body {
    position: relative;
    z-index: 2;
    flex-grow: 1;
  }
  .id-card-row-top {
    display: flex;
    gap: 12px;
    margin-bottom: 6px;
  }
  .id-card-col-photo {
    width: 30%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .id-card-photo-box {
    width: 100%;
    height: 125px;
    border: 1px solid #b0bec5;
    border-radius: 4px;
    background-color: #eceff1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .id-card-photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .id-card-photo-placeholder {
    font-size: 8px;
    color: #78909c;
    text-align: center;
    font-weight: bold;
    line-height: 1.3;
  }
  .id-card-col-personal {
    width: 70%;
  }
  .id-card-info-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .id-card-info-table td {
    padding: 2.5px 2px;
    font-size: 9px;
    vertical-align: top;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .id-card-label {
    font-weight: 800;
    color: #1a237e;
    width: 42%;
  }
  .id-card-val {
    color: #000000;
    width: 58%;
    font-weight: 500;
  }
  .id-card-section-title {
    font-size: 9.5px;
    font-weight: bold;
    color: #1a237e;
    border-bottom: 1.5px solid #1a237e;
    padding-bottom: 1px;
    margin-top: 5px;
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .id-card-row-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
  }
  .id-card-row-details > div {
    overflow: hidden;
  }
  .id-card-row-details .id-card-label,
  .id-card-row-details .id-card-val {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .id-card-row-details-full {
    grid-column: span 2;
  }
  .id-card-footer {
    position: relative;
    z-index: 2;
    margin-top: 6px;
    border-top: 1px solid #cfd8dc;
    padding-top: 6px;
  }
  .id-card-signatures {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 4px;
  }
  .id-card-sig-line {
    width: 38%;
    border-top: 1px solid #37474f;
    text-align: center;
    padding-top: 2px;
    font-size: 7.5px;
    font-weight: bold;
    color: #37474f;
    line-height: 1.3;
  }
  .id-card-stamp-box {
    width: 50px;
    height: 50px;
    border: 1.5px solid #f44336;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f44336;
    font-size: 6.5px;
    font-weight: 900;
    text-align: center;
    text-transform: uppercase;
    margin: 0 auto;
    line-height: 1.2;
  }
  .id-card-warning {
    font-size: 6.5px;
    color: #546e7a;
    text-align: center;
    line-height: 1.3;
    font-weight: bold;
  }
  .id-card-print-container {
    display: none;
  }
  @media print {
    body * {
      visibility: hidden !important;
    }
    .id-card-print-container, .id-card-print-container * {
      visibility: visible !important;
    }
    .id-card-print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 148mm;
      height: 210mm;
      display: block !important;
      border: none !important;
      box-shadow: none !important;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
  }
`;

/**
 * Strips clipboard metadata (Version:0.9, StartHTML:, EndHTML:, etc.),
 * zero-width characters, stray HTML tags, and normalizes whitespace.
 */
const sanitize = (val) => {
  if (!val || typeof val !== 'string') return val;
  let cleaned = val;
  // Strip zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Remove Windows clipboard header lines
  cleaned = cleaned.replace(/Version:\d[\s\S]*?StartFragment:/i, '');
  cleaned = cleaned.replace(/EndFragment:[\s\S]*/i, '');
  // Remove any leftover HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned.trim() || '';
};

/** Helper: returns empty string for null/undefined/empty, strips clipboard metadata */
const v = (val) => {
  if (val === null || val === undefined || val === '' || val === '-' || val === '—' || val === 'N/A' || val === 'null' || val === 'undefined') return '';
  return sanitize(String(val));
};

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
    kebele: "Heremata Mentina",
    address: "Ethiopia",
    nationalId: "ETH-2026-00000",
    joinedDate: "January 15, 2024",
    firstname: "",
    lastname: "",
    gender: "",
    birth_date: "",
    birthplace: "",
    marital_status: "",
    nationality: "Ethiopian",
    religion: "",
    disability_status: 0,
    father_name: "",
    mother_name: "",
    spouse_id: null,
    spouseName: "",
    house_number: "",
    occupation: "",
    education_level: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    photo_path: null,
    registration_date: ""
  });
  const [loading, setLoading] = useState(true);
  const [certFetchError, setCertFetchError] = useState(null);
  const [certQuery, setCertQuery] = useState('');
  const [certPage, setCertPage] = useState(1);
  const certPageSize = 8;

  useEffect(() => {
    setCertPage(1);
  }, [certQuery]);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    const fetchData = async () => {
      setCertFetchError(null);
      try {
        const config = getAuthConfig();

        if (!config) {
          setCertFetchError("Authentication required. Please log in to view your dashboard.");
          return;
        }

        // 1. Fetch Profile
        const profileRes = await axios.get("http://localhost:5000/api/residents/profile", config);
        const p = profileRes.data.profile;
        if (p) {
          let sName = "";
          const spouseId = Number(p.spouse_id);
          if (Number.isInteger(spouseId) && spouseId > 0 && p.marital_status === "married") {
            try {
              const spouseRes = await axios.get(`http://localhost:5000/api/residents/${spouseId}`, config);
              const s = spouseRes.data.resident;
              if (s) {
                sName = `${s.firstname} ${s.lastname}`;
              }
            } catch (spouseErr) {
              console.warn("Spouse lookup failed, continuing without spouse name:", spouseErr.response?.data || spouseErr.message || spouseErr);
            }
          }

          setUserProfile({
            ...p,
            name: `${p.firstname} ${p.lastname}`,
            email: p.email || "—",
            phone: p.phone_number || "—",
            kebele: "Heremata Mentina",
            address: p.address || "Jimma, Oromia, Ethiopia",
            nationalId: `KBL-HM-2026-${String(p.resident_id).padStart(5, '0')}`,
            joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "—",
            spouseName: sName
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
        setCertFetchError(err.response?.data?.error || err.message || "Could not load your dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const user = userProfile;
  const initials = user.name.split(' ').map(n => n[0]).join('');

  const issuedCount = certificates.filter(c => c.status === 'issued' || c.status === 'approved').length;

  // Downloads the ID card via the same backend PDF generator as all other certs.
  // The approvedIdCert is resolved in the profile tab's conditional render.
  const handleDownloadIDCard = async (certId) => {
    if (!certId) {
      notifyWarning('No approved ID card found. Please apply and wait for admin approval.');
      return;
    }
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/residents/certificates/${certId}/download`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Kebele_ID_${userProfile.firstname || 'Resident'}_${userProfile.lastname || 'Card'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('ID card download failed:', err);
      notifyError(err.response?.data?.error || 'Failed to download ID card. Please try again.');
    }
  };

  const handlePrintIDCard = () => {
    window.print();
  };

  const renderIDCardHTML = () => {
    let photoUrl = null;
    if (userProfile.photo_path) {
      if (userProfile.photo_path.startsWith('http')) {
        photoUrl = userProfile.photo_path;
      } else if (userProfile.photo_path.startsWith('/')) {
        photoUrl = userProfile.photo_path;
      } else if (userProfile.photo_path.startsWith('uploads/')) {
        photoUrl = '/' + userProfile.photo_path;
      } else {
        photoUrl = '/uploads/photos/' + userProfile.photo_path;
      }
    }
    const isDisability = Number(userProfile.disability_status) === 1 ? "Yes / አዎ" : "No / የለም";
    
    const formatD = (dString) => {
      if (!dString || dString === '—' || dString === '-' || dString === 'N/A' || dString === 'null' || dString === 'undefined') return "";
      const d = new Date(dString);
      if (isNaN(d.getTime())) return dString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const birthDateStr = formatD(userProfile.birth_date);
    const regDateStr = formatD(userProfile.registration_date || userProfile.created_at);
    const issueDateStr = formatD(new Date());
    const expiryDateStr = formatD(new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000));
    
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', position: 'relative' }}>
        <div className="id-card-watermark">OFFICIAL DOCUMENT</div>
        
        {/* HEADER */}
        <div className="id-card-header">
          <div className="id-card-header-country">FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA</div>
          <div className="id-card-header-country-am">የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ</div>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, margin: '2px 0' }}>
            <div className="id-card-stamp-box" style={{ width: 18, height: 18, fontSize: 4.5, border: '1px solid white', color: 'white', margin: 0, padding: 0 }}>
              SEAL
            </div>
            <div className="id-card-header-kebele">
              Oromia Region · Jimma Zone · Jimma Woreda · Heremata Mentina Kebele<br />
              ኦሮሚያ ክልል · ጅማ ዞን · ጅማ ወረዳ · ሔረማታ መንቲና ቀበሌ
            </div>
          </div>
          
          <div className="id-card-header-title">RESIDENT ID CARD / የቀበሌ ነዋሪ መታወቂያ ካርድ</div>
          <div className="id-card-header-number">Card No / የመታወቂያ ቁጥር: {userProfile.nationalId}</div>
        </div>

        {/* BODY */}
        <div className="id-card-body">
          {/* PHOTO & PERSONAL INFO (Side-by-side) */}
          <div className="id-card-row-top">
            {/* Left Col (Photo) */}
            <div className="id-card-col-photo">
              <div className="id-card-photo-box">
                {photoUrl ? (
                  <img src={photoUrl} alt="Resident Photo" className="id-card-photo-img" crossOrigin="anonymous" />
                ) : (
                  <div className="id-card-photo-placeholder">
                    <span style={{ fontSize: 16 }}>👤</span><br />
                    3x4cm Photo<br />ፎቶግራፍ
                  </div>
                )}
              </div>
            </div>

            {/* Right Col (Personal Details) */}
            <div className="id-card-col-personal">
              <table className="id-card-info-table">
                <tbody>
                  <tr>
                    <td className="id-card-label">Full Name / ሙሉ ስም:</td>
                    <td className="id-card-val" style={{ fontWeight: 'bold', fontSize: 10 }}>{userProfile.name}</td>
                  </tr>
                  <tr>
                    <td className="id-card-label">Gender / ጾታ:</td>
                    <td className="id-card-val">{v(userProfile.gender)}</td>
                  </tr>
                  <tr>
                    <td className="id-card-label">Date of Birth / ልደት:</td>
                    <td className="id-card-val">{birthDateStr}</td>
                  </tr>
                  <tr>
                    <td className="id-card-label">Birthplace / ትውልድ ቦታ:</td>
                    <td className="id-card-val">{v(userProfile.birthplace)}</td>
                  </tr>
                  <tr>
                    <td className="id-card-label">Nationality / ዜግነት:</td>
                    <td className="id-card-val">{v(userProfile.nationality) || "Ethiopian / ኢትዮጵያዊ"}</td>
                  </tr>
                  <tr>
                    <td className="id-card-label">Religion / ሃይማኖት:</td>
                    <td className="id-card-val">{v(userProfile.religion)}</td>
                  </tr>
                  <tr>
                    <td className="id-card-label">Marital Status / ጋብቻ:</td>
                    <td className="id-card-val" style={{ textTransform: 'capitalize' }}>{v(userProfile.marital_status)}</td>
                  </tr>
                  <tr>
                    <td className="id-card-label">Disability / አካል ጉዳት:</td>
                    <td className="id-card-val">{isDisability}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAMILY SECTION */}
          <div className="id-card-section-title">Family Information / የቤተሰብ መረጃ</div>
          <div className="id-card-row-details">
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Father's Name / የአባት ስም:</div>
              <div className="id-card-val" style={{ width: '100%', fontSize: 8.5 }}>{v(userProfile.father_name)}</div>
            </div>
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Mother's Name / የእናት ስም:</div>
              <div className="id-card-val" style={{ width: '100%', fontSize: 8.5 }}>{v(userProfile.mother_name)}</div>
            </div>
            {userProfile.marital_status === "married" && (
              <div className="id-card-row-details-full">
                <span className="id-card-label">Spouse Name / የትዳር አጋር ስም: </span>
                <span className="id-card-val" style={{ fontSize: 8.5 }}>{v(userProfile.spouseName)}</span>
              </div>
            )}
          </div>

          {/* ADDRESS SECTION */}
          <div className="id-card-section-title">Address / አድራሻ</div>
          <div className="id-card-row-details">
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Kebele & House No / የቤት ቁጥር:</div>
              <div className="id-card-val" style={{ width: '100%' }}>HM - {v(userProfile.house_number)}</div>
            </div>
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Full Address / ሙሉ አድራሻ:</div>
              <div className="id-card-val" style={{ width: '100%' }}>{v(userProfile.address)}</div>
            </div>
          </div>

          {/* CONTACT & OTHER INFO */}
          <div className="id-card-section-title">Contact & Work / ግንኙነት እና ሥራ</div>
          <div className="id-card-row-details">
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Phone / ስልክ:</div>
              <div className="id-card-val" style={{ width: '100%' }}>{v(userProfile.phone)}</div>
            </div>
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Occupation / ሥራ:</div>
              <div className="id-card-val" style={{ width: '100%' }}>{v(userProfile.occupation)}</div>
            </div>
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Education / ትምህርት:</div>
              <div className="id-card-val" style={{ width: '100%' }}>{v(userProfile.education_level)}</div>
            </div>
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Emergency Contact / አደጋ ጊዜ ተጠሪ:</div>
              <div className="id-card-val" style={{ width: '100%' }}>
                {v(userProfile.emergency_contact_name)} ({v(userProfile.emergency_contact_phone)})
              </div>
            </div>
          </div>

          {/* CERTIFICATE DETAILS */}
          <div className="id-card-section-title">Card Validity / የመታወቂያው ፀናነት</div>
          <div className="id-card-row-details" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Issue Date / የተሰጠበት:</div>
              <div className="id-card-val" style={{ width: '100%' }}>{issueDateStr}</div>
            </div>
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Expiry Date / የሚያበቃበት:</div>
              <div className="id-card-val" style={{ width: '100%', color: '#d32f2f', fontWeight: 'bold' }}>{expiryDateStr}</div>
            </div>
            <div>
              <div className="id-card-label" style={{ width: '100%' }}>Registration Date / ምዝገባ:</div>
              <div className="id-card-val" style={{ width: '100%' }}>{regDateStr}</div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="id-card-footer">
          <div className="id-card-signatures">
            <div className="id-card-sig-line" style={{ marginTop: 15 }}>
              Registrar Signature / ሬጅስትራር
            </div>
            
            <div className="id-card-stamp-box">
              OFFICIAL<br />STAMP<br />ማህተም
            </div>

            <div className="id-card-sig-line" style={{ marginTop: 15 }}>
              Kebele Manager / ሥራ አስኪያጅ
            </div>
          </div>
          <div className="id-card-warning">
            This card is official and valid only with official stamp and signatures.<br />
            ይህ መታወቂያ የሚፀናው ኦፊሴላዊ ማህተም እና ፊርማዎች ሲኖሩት ብቻ ነው።
          </div>
        </div>
      </div>
    );
  };
  const pendingCount = certificates.filter(c =>
    ['pending', 'assigned', 'processing', 'ready_for_approval'].includes(c.status)
  ).length;

  // Determine ID-card / residency certificate approval state for the profile tab
  const idCertTypes = ['residency-id', 'residency'];
  const approvedIdCert = certificates.find(
    c => idCertTypes.includes(c.certificate_type) && (c.status === 'approved' || c.status === 'issued')
  );
  const rejectedIdCert = !approvedIdCert && certificates.find(
    c => idCertTypes.includes(c.certificate_type) && c.status === 'rejected'
  );
  const pendingIdCert = !approvedIdCert && !rejectedIdCert && certificates.find(
    c => idCertTypes.includes(c.certificate_type)
  );

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

  const { notifyError, notifyWarning } = useNotification();

  const downloadCertificate = async (cert) => {
    if (cert.status !== 'approved' && cert.status !== 'issued') {
      notifyWarning(`This certificate is '${cert.status}'. It must be approved by the admin before you can download it.`);
      return;
    }
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/residents/certificates/${cert.id}/download`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${cert.certificate_type || 'Certificate'}_${cert.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Certificate download failed:', err);
      notifyError(err.response?.data?.error || 'Failed to download certificate. Please try again.');
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
      notifyError(err.response?.data?.error || "Failed to submit report. Please try again.");
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
                  Your personal information and official Kebele ID card
                </div>
              </div>

              {/* ── ID CARD STATUS BANNER ── */}
              {approvedIdCert ? (
                /* Approved: show ID card preview + download/print */
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                    alignItems: 'center', gap: 12, padding: '14px 20px',
                    background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                    borderRadius: 14, marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle style={{ color: '#16a34a', width: 22, height: 22 }} />
                      <div>
                        <div style={{ fontWeight: 700, color: '#15803d', fontSize: 14 }}>ID Card Approved</div>
                        <div style={{ fontSize: 12, color: '#166534' }}>
                          Your Kebele ID card has been approved and is ready to download.
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleDownloadIDCard(approvedIdCert?.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          backgroundColor: '#10b981', color: 'white', border: 'none',
                          borderRadius: 10, padding: '10px 18px', fontSize: 14,
                          fontWeight: 600, cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(16,185,129,0.2)'
                        }}
                      >
                        <Download style={{ width: 16, height: 16 }} /> Download ID Card
                      </button>
                      <button
                        onClick={handlePrintIDCard}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          backgroundColor: '#4f46e5', color: 'white', border: 'none',
                          borderRadius: 10, padding: '10px 18px', fontSize: 14,
                          fontWeight: 600, cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(79,70,229,0.2)'
                        }}
                      >
                        <Printer style={{ width: 16, height: 16 }} /> Print ID Card
                      </button>
                    </div>
                  </div>

                  {/* Offscreen ID Card for jsPDF */}
                  <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                    <div id="ethiopian-kebele-id-card" className="id-card-container">
                      {renderIDCardHTML()}
                    </div>
                  </div>
                  {/* Print-only container */}
                  <div className="id-card-print-container">
                    <div className="id-card-container">{renderIDCardHTML()}</div>
                  </div>
                </div>
              ) : rejectedIdCert ? (
                /* Rejected: show rejection banner */
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '16px 20px', background: '#fef2f2',
                  border: '1.5px solid #fecaca', borderRadius: 14, marginBottom: 24
                }}>
                  <Shield style={{ color: '#b91c1c', width: 22, height: 22, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: 14 }}>
                      Registration Rejected
                    </div>
                    <div style={{ fontSize: 13, color: '#dc2626', marginTop: 4 }}>
                      This resident registration has been rejected.
                    </div>
                    {rejectedIdCert.rejection_reason && (
                      <div style={{
                        marginTop: 8, fontSize: 12, color: '#7f1d1d',
                        background: '#fee2e2', padding: '8px 12px', borderRadius: 8
                      }}>
                        <strong>Reason:</strong> {rejectedIdCert.rejection_reason}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#991b1b', marginTop: 8 }}>
                      Please visit the Kebele office or submit a new application to appeal.
                    </div>
                  </div>
                </div>
              ) : pendingIdCert ? (
                /* Pending / In-progress: show waiting banner */
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px', background: '#fffbeb',
                  border: '1.5px solid #fde68a', borderRadius: 14, marginBottom: 24
                }}>
                  <Clock style={{ color: '#d97706', width: 22, height: 22, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#b45309', fontSize: 14 }}>
                      Awaiting Admin Approval
                    </div>
                    <div style={{ fontSize: 13, color: '#92400e', marginTop: 2 }}>
                      ID Card will be available after admin approval. Current status:{' '}
                      <strong style={{ textTransform: 'capitalize' }}>{pendingIdCert.status.replace(/_/g, ' ')}</strong>.
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="kd-profile-wrap">
                <div className="kd-profile-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {user.photo_path ? (
                    <img 
                      src={`/uploads/photos/${user.photo_path}`} 
                      alt="Profile" 
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #2563eb' }} 
                    />
                  ) : (
                    <div className="kd-profile-avatar">{initials}</div>
                  )}
                  <div>
                    <div className="kd-profile-name">{user.name}</div>
                    <div className="kd-profile-role">Registered Kebele Resident</div>
                    <div className="kd-profile-since">Member since {user.joinedDate}</div>
                  </div>
                </div>

                <div className="kd-profile-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  {[
                    { icon: <Mail />, label: 'Email Address', value: user.email },
                    { icon: <Phone />, label: 'Phone Number', value: user.phone },
                    { icon: <MapPin />, label: 'Address & House No', value: `${user.address} (House No: HM-${user.house_number || '—'})` },
                    { icon: <Shield />, label: 'National ID Number', value: user.nationalId },
                    { icon: <User />, label: 'Personal Specs', value: `Gender: ${user.gender || '—'} · Marital: ${user.marital_status || '—'}` },
                    { icon: <FileText />, label: 'Family Details', value: `Father: ${user.father_name || '—'} · Mother: ${user.mother_name || '—'} ${user.spouseName ? `· Spouse: ${user.spouseName}` : ''}` },
                    { icon: <Briefcase className="w-5 h-5" />, label: 'Occupation & Education', value: `${user.occupation || '—'} (${user.education_level || '—'})` },
                    { icon: <AlertTriangle />, label: 'Emergency Contact', value: `${user.emergency_contact_name || '—'} (${user.emergency_contact_phone || '—'})` },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="kd-profile-row" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div className="kd-prof-icon" style={{ marginTop: 2 }}>{icon}</div>
                      <div>
                        <div className="kd-prof-lbl">{label}</div>
                        <div className="kd-prof-val" style={{ fontSize: 13, wordBreak: 'break-word' }}>{value}</div>
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