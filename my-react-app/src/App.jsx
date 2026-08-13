import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import NewMeeting from './pages/NewMeeting';
import VoiceMeeting from './pages/VoiceMeeting';
import OnlineMeeting from './pages/OnlineMeeting';
import Tasks from './pages/Tasks';
import TaskApproval from './pages/TaskApproval';
import MeetingDetails from './pages/MeetingDetails';
import Meetings from './pages/Meetings';
import Documents from './pages/Documents';

function AppLayout() {
  const location = useLocation();

  if (location.pathname === '/') {
    return <LandingPage />;
  }

  if (['/login', '/register', '/auth'].includes(location.pathname)) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="content-area">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analyze" element={<NewMeeting />} />
            <Route path="/new-meeting" element={<NewMeeting />} />
            <Route path="/voice-meeting" element={<VoiceMeeting />} />
            <Route path="/online-meeting" element={<OnlineMeeting />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/approve/:id" element={<TaskApproval />} />
            <Route path="/action-items" element={<Tasks />} />
            <Route path="/meetings/:id" element={<MeetingDetails />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/documents" element={<Documents />} />
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
