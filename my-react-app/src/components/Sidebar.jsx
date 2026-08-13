import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Mic, Video, Calendar, CheckSquare, FileText, Settings, User, Sparkles } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Sparkles className="w-6 h-6" style={{ color: 'var(--primary)' }} />
        <span>MeetAI</span>
      </div>

      <div className="nav-section-label">Main</div>
      <nav style={{ flex: 1 }}>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/online-meeting" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Video className="w-4 h-4" />
          <span>Online Meeting</span>
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
        <NavLink to="/documents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText className="w-4 h-4" />
          <span>Documents</span>
        </NavLink>
      </nav>

      <div className="nav-divider"></div>
      <div className="sidebar-bottom">
        <NavLink to="/" className="nav-link">
          <Sparkles className="w-4 h-4" />
          <span>Landing Page</span>
        </NavLink>
        <a href="#" className="nav-link">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </a>
      </div>
    </div>
  );
}
