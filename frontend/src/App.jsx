import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import UserDashboard from './pages/UserDashboard';
import FileComplaint from './pages/FileComplaint';
import TrackComplaint from './pages/TrackComplaint';
import StateAdminDashboard from './pages/StateAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PartnerDashboard from './pages/PartnerDashboard';

function ProtectedUser({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

function ProtectedAdmin({ children, requireSuper = false }) {
  const { admin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!admin) return <Navigate to="/admin/login" replace />;
  if (requireSuper && admin.role !== 'super_admin') return <Navigate to="/admin" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-burg border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Loading CivicAI...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, admin } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/admin/login" element={admin ? <Navigate to="/admin" /> : <AdminLoginPage />} />
      <Route path="/track/:trackingId" element={<TrackComplaint />} />

      {/* User Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedUser>
            {user?.role === 'Partner' ? <PartnerDashboard /> : <UserDashboard />}
          </ProtectedUser>
        }
      />
      <Route path="/file-complaint" element={<ProtectedUser><FileComplaint /></ProtectedUser>} />

      {/* Admin Protected */}
      <Route
        path="/admin"
        element={
          <ProtectedAdmin>
            {admin?.role === 'super_admin' ? <SuperAdminDashboard /> : <StateAdminDashboard />}
          </ProtectedAdmin>
        }
      />
      <Route
        path="/admin/super"
        element={<ProtectedAdmin requireSuper><SuperAdminDashboard /></ProtectedAdmin>}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
