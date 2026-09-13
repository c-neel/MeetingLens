import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Mic, Video, Calendar, CheckSquare, FileBarChart, Settings, User, Sparkles } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo" style={{ padding: '0.5rem 0' }}>
        <Link to="/" title="Go to Landing Page" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="MeetingLens Logo" style={{ height: '52px', width: 'auto', objectFit: 'contain', cursor: 'pointer', transition: 'transform 0.2s' }} />
        </Link>
      </div>

      <div className="nav-section-label">Main</div>
      <nav style={{ flex: 1 }}>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/analyze" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <PlusCircle className="w-4 h-4" />
          <span>Analyze File</span>
        </NavLink>
        <NavLink to="/voice-meeting" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Mic className="w-4 h-4" />
          <span>Voice Meeting</span>
        </NavLink>

        <div className="nav-section-label">Workspace</div>
        <NavLink to="/meetings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Calendar className="w-4 h-4" />
          <span>Meetings</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CheckSquare className="w-4 h-4" />
          <span>Tasks</span>
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileBarChart className="w-4 h-4" />
          <span>Reports & Export</span>
        </NavLink>
      </nav>

      <div className="nav-divider"></div>
      <div className="sidebar-bottom">
        <NavLink to="/" className="nav-link">
          <Sparkles className="w-4 h-4" />
          <span>Landing Page</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
}
