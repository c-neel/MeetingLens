import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, CheckCircle, AlertTriangle, Clock, X } from 'lucide-react';
import { getActionItems, getMeetings } from '../services/api';

export default function Topbar() {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Read logged in user from localStorage
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = savedUser.name || 'Amit Shah';

  useEffect(() => {
    // Build notifications from tasks and meetings
    const buildNotifications = async () => {
      try {
        const [tasks, meetings] = await Promise.all([getActionItems(), getMeetings()]);
        const notes = [];

        // Overdue tasks
        tasks.filter(t => {
          const due = t.dueDate || t.due_date;
          return due && t.status !== 'Completed' && new Date(due) < new Date();
        }).forEach(t => {
          notes.push({ id: `overdue-${t.id}`, type: 'warning', title: 'Task Overdue', message: `"${t.task}" was due ${t.dueDate || t.due_date}`, time: 'overdue' });
        });

        // Pending tasks count
        const pending = tasks.filter(t => t.status === 'Pending').length;
        if (pending > 0) {
          notes.push({ id: 'pending-tasks', type: 'info', title: 'Pending Tasks', message: `You have ${pending} pending task${pending > 1 ? 's' : ''} awaiting action`, time: 'now' });
        }

        // Recent meetings
        if (meetings.length > 0) {
          const latest = meetings[0];
          notes.push({ id: `latest-meeting-${latest.id}`, type: 'success', title: 'Latest Meeting', message: `"${latest.title}" was processed successfully`, time: latest.date || latest.meeting_date || 'recently' });
        }

        setNotifications(notes);
      } catch (e) {
        // Silently fail
      }
    };

    buildNotifications();
    const interval = setInterval(buildNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.length;

  const getNotifIcon = (type) => {
    if (type === 'warning') return <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />;
    if (type === 'success') return <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />;
    return <Clock className="w-4 h-4" style={{ color: '#3b82f6' }} />;
  };

  return (
    <div className="topbar">
      <div className="search-bar">
        <Search className="w-4 h-4 text-muted" />
        <input type="text" placeholder="Search meetings..." />
      </div>
      <div className="topbar-actions" style={{ position: 'relative' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <Bell
            className="w-5 h-5"
            style={{ cursor: 'pointer' }}
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
          />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'var(--danger)',
              color: 'white',
              fontSize: '0.625rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white'
            }}>
              {unreadCount}
            </span>
          )}

          {/* Notification Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '0.5rem',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.2)',
              zIndex: 200,
              width: '360px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unreadCount} items</span>
              </div>

              {notifications.length === 0 && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  No notifications
                </div>
              )}

              {notifications.map(notif => (
                <div
                  key={notif.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f8fafc',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ marginTop: '2px' }}>{getNotifIcon(notif.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{notif.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{notif.message}</div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>{notif.time}</div>
                  </div>
                  <X
                    className="w-3.5 h-3.5"
                    style={{ color: 'var(--text-light)', cursor: 'pointer', flexShrink: 0, marginTop: '2px' }}
                    onClick={e => { e.stopPropagation(); dismissNotification(notif.id); }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ position: 'relative' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem' }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{userName}</span>
          </div>

          {showUserMenu && (
            <div style={{ 
              position: 'absolute', 
              right: 0, 
              top: '100%', 
              marginTop: '0.5rem', 
              background: 'white', 
              border: '1px solid var(--border)', 
              borderRadius: '0.5rem', 
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', 
              zIndex: 100, 
              minWidth: '160px', 
              overflow: 'hidden' 
            }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{userName}</div>
                {savedUser.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{savedUser.email}</div>}
              </div>
              <button 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  width: '100%', 
                  padding: '0.625rem 1rem', 
                  border: 'none', 
                  background: 'none', 
                  textAlign: 'left', 
                  cursor: 'pointer', 
                  fontSize: '0.8125rem',
                  color: 'var(--danger)',
                  fontWeight: 500
                }}
                onClick={handleLogout}
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
