import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Mic, Video, Calendar, CheckSquare, FileBarChart, Settings, User, Sparkles } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
        <img src="/logo.png" alt="MeetingLens Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MeetingLens</span>
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
