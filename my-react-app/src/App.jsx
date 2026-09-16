import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import NewMeeting from './pages/NewMeeting';
import VoiceMeeting from './pages/VoiceMeeting';
import Tasks from './pages/Tasks';
import TaskApproval from './pages/TaskApproval';
import MeetingDetails from './pages/MeetingDetails';
import Meetings from './pages/Meetings';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';

function ProtectedRoute({ children }) {
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  if (!savedUser || (!savedUser.id && !savedUser.email)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppLayout() {
  const location = useLocation();

  if (location.pathname === '/') {
    return <LandingPage />;
  }

  if (location.pathname === '/forgot-password') {
    return <ForgotPassword />;
  }

  if (['/login', '/register', '/auth'].includes(location.pathname)) {
    return <Auth />;
  }

  // If user is not logged in, redirect to login page instead of showing empty workspace
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  if (!savedUser || (!savedUser.id && !savedUser.email)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="content-area">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/analyze" element={<ProtectedRoute><NewMeeting /></ProtectedRoute>} />
            <Route path="/new-meeting" element={<ProtectedRoute><NewMeeting /></ProtectedRoute>} />
            <Route path="/voice-meeting" element={<ProtectedRoute><VoiceMeeting /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/tasks/approve/:id" element={<ProtectedRoute><TaskApproval /></ProtectedRoute>} />
            <Route path="/action-items" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/meetings/:id" element={<ProtectedRoute><MeetingDetails /></ProtectedRoute>} />
            <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
