import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded routes
const Login = React.lazy(() => import('./pages/auth/Login'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const GuestAccess = React.lazy(() => import('./pages/admin/GuestAccess'));
const Presentations = React.lazy(() => import('./pages/admin/Presentations'));
const AudioLibrary = React.lazy(() => import('./pages/admin/AudioLibrary'));
const ActiveSessions = React.lazy(() => import('./pages/admin/ActiveSessions'));
const SlideTimelineEditor = React.lazy(() => import('./pages/admin/SlideTimelineEditor'));
const LiveControlPanel = React.lazy(() => import('./pages/admin/LiveControlPanel'));
const GuestJoin = React.lazy(() => import('./pages/guest/Join'));
const GuestView = React.lazy(() => import('./pages/guest/LiveView'));
const GuestLogin = React.lazy(() => import('./pages/auth/GuestLogin'));

const App = () => {
  const { initializeAuth, role } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <React.Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-xl">Loading App...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/guest/login" element={<GuestLogin />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute requireRole="admin">
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="guests" element={<GuestAccess />} />
                <Route path="presentations" element={<Presentations />} />
                <Route path="audio" element={<AudioLibrary />} />q
                <Route path="sessions" element={<ActiveSessions />} />
                <Route path="timeline/:presentationId" element={<SlideTimelineEditor />} />
                <Route path="host/:sessionId" element={<LiveControlPanel />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* Guest Routes */}
          <Route path="/guest/*" element={
            <ProtectedRoute requireRole="guest">
              <Routes>
                <Route path=":sessionId" element={<GuestView />} />
              </Routes>
            </ProtectedRoute>
          } />
          <Route path="/join" element={
            <ProtectedRoute requireRole="guest">
              <GuestJoin />
            </ProtectedRoute>
          } />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to={role === 'admin' ? "/admin" : "/guest/login"} replace />} />
          <Route path="*" element={<Navigate to="/guest/login" replace />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
};

export default App;
