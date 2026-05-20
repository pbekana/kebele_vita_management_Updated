import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './components/NotificationProvider';

// Main Pages
import LandingPage from './Pages/Landing/LandingPage';
import RegisterForm from './Pages/Register/RegisterForm';
import LoginForm from './Pages/Login/LoginForm';

// Dashboards
import ResidentDashboard from './Pages/Dashboard/ResidentDashboard';
import AdminDashboard from './Pages/Dashboard/AdminDashboard';

// Staff
import StaffLogin from './Pages/Login/StaffLogin';   

// Staff Dashboards
import StaffLayout from './Pages/Dashboard/Staff/StaffLayout';
import StaffDashboard from './Pages/Dashboard/Staff/StaffDashboard';
import DeathOfficerDashboard from './Pages/Dashboard/Staff/DeathOfficerDashboard';
import BirthOfficerDashboard from './Pages/Dashboard/Staff/BirthOfficerDashboard';
import MarriageOfficerDashboard from './Pages/Dashboard/Staff/MarriageOfficerDashboard';
import ReportsOfficerDashboard from './Pages/Dashboard/Staff/ReportsOfficerDashboard';
import IDOfficerDashboard from './Pages/Dashboard/Staff/IDOfficerDashboard';
import AssignedCertificatesDashboard from './Pages/Dashboard/Staff/AssignedCertificatesDashboard';

// Apply Certificate
import ApplyCertificate from './Pages/Apply/ApplyCertificate';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
        
        {/* Staff Login Route */}
        <Route path="/staff-login" element={<StaffLogin />} />

        {/* Resident */}
        <Route path="/dashboard" element={<ResidentDashboard />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Staff Dashboards */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="certificates" element={<AssignedCertificatesDashboard />} />
          <Route path="death" element={<DeathOfficerDashboard />} />
          <Route path="birth" element={<BirthOfficerDashboard />} />
          <Route path="marriage" element={<MarriageOfficerDashboard />} />
          <Route path="reports" element={<ReportsOfficerDashboard />} />
          <Route path="id" element={<IDOfficerDashboard />} />
        </Route>

        {/* Apply Certificates */}
        <Route path="/apply/:type" element={<ApplyCertificate />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;