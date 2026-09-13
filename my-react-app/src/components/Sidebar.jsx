import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Mic, Calendar, CheckSquare, FileBarChart, Settings, Globe, Zap } from 'lucide-react';
import { getMeetings, getActionItems } from '../services/api';

export default function Sidebar() {
  const [meetingsCount, setMeetingsCount] = useState(0);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchCounts = () => {
      getMeetings()
        .then(data => { if (isMounted && data) setMeetingsCount(data.length); })
        .catch(() => {});
      
      getActionItems()
        .then(data => {
          if (isMounted && data) {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const full = (savedUser.name || '').toLowerCase();
            const first = full.split(' ')[0] || '';
            const pending = data.filter(item => {
              if (item.status === 'Completed') return false;
              if (!item.assignee) return false;
              const a = String(item.assignee).trim().toLowerCase();
              if (!a || a === '-' || a === 'unassigned' || a === 'none') return false;
              return a === full || a === first || a.includes(first) || full.includes(a);
            }).length;
            setPendingTasksCount(pending);
          }
        })
        .catch(() => {});
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="sidebar" style={{ width: '264px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '1.25rem 1rem', height: '100vh', position: 'sticky', top: 0 }}>
      {/* Brand Header */}
      <div className="sidebar-logo" style={{ padding: '0.25rem 0', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Link to="/" title="Go to Landing Page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <img 
            src="/logo.png" 
            alt="MeetingLens Logo" 
            style={{ height: '54px', width: 'auto', maxWidth: '100%', objectFit: 'contain', cursor: 'pointer', transition: 'transform 0.2s' }} 
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="nav-section-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', padding: '0.25rem 0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        Main
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/analyze" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
          <PlusCircle className="w-4 h-4" />
          <span>Analyze File</span>
        </NavLink>

        <NavLink to="/voice-meeting" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Mic className="w-4 h-4" />
            <span>Voice Meeting</span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.125rem 0.45rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <span className="live-pulse-red" />
            LIVE
          </span>
        </NavLink>

        {/* Workspace Section */}
        <div className="nav-section-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', padding: '0.75rem 0.75rem 0.375rem 0.75rem', fontWeight: 700 }}>
          Workspace
        </div>

        <NavLink to="/meetings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar className="w-4 h-4" />
            <span>Meetings</span>
          </div>
          {meetingsCount > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#475569' }}>
              {meetingsCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckSquare className="w-4 h-4" />
            <span>Tasks</span>
          </div>
          {pendingTasksCount > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#b45309' }}>
              {pendingTasksCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
          <FileBarChart className="w-4 h-4" />
          <span>Reports & Export</span>
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Usage Card matching reference */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.875rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>AI Transcription</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5' }}>4.2 / 10 hrs</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <div style={{ width: '42%', height: '100%', backgroundColor: '#4f46e5', borderRadius: '9999px' }} />
          </div>
          <Link to="/settings" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Manage Plan →
          </Link>
        </div>

        <div style={{ height: '1px', background: '#e2e8f0' }} />

        {/* Bottom Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <NavLink to="/" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            <span>Landing Page</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

