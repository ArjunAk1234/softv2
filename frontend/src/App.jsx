import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext'; 
import { ThemeProvider } from './contexts/ThemeContext.jsx';

import AppLayout from './components/AppLayout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Jobs from './components/Jobs';
import Applications from './components/Applications';
import Profile from './components/Profile';
import InterviewerDashboard from './components/InterviewerDashboard';

function AppRoutes() {
  const { auth, logout } = useAuth();
  const role = auth?.user?.role;

  const getDefaultPath = () => {
    if (role === 'interviewer') return '/interviewer';
    return '/dashboard';
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={auth ? <Navigate to={getDefaultPath()} /> : <Login />} />

      {/* Interviewer-only portal */}
      <Route
        path="/interviewer"
        element={
          auth && role === 'interviewer' ? <InterviewerDashboard />
          : auth ? <Navigate to="/dashboard" />
          : <Navigate to="/login" />
        }
      />

      {/* Main app shell (candidate + company) */}
      <Route
        path="/"
        element={
          auth && role !== 'interviewer' ? <AppLayout onLogout={logout} />
          : auth ? <Navigate to="/interviewer" />
          : <Navigate to="/login" />
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="jobs" element={<Jobs />} />
        {/* /applications is candidate-only — company redirected to jobs */}
        <Route
          path="applications"
          element={role === 'company' ? <Navigate to="/jobs" /> : <Applications />}
        />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={auth ? getDefaultPath() : '/login'} />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;