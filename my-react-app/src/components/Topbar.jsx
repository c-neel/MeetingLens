import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { getActionItems, getMeetings } from '../services/api';

export default function Topbar() {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);


  // Read logged in user with reactive state
  const [savedUser, setSavedUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      return {};
    }
  });
  const userName = savedUser.name || 'Amit Shah';

  useEffect(() => {
    const handleUserUpdated = () => {
      try {
        setSavedUser(JSON.parse(localStorage.getItem('user') || '{}'));
      } catch (e) {}
    };
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => window.removeEventListener('userUpdated', handleUserUpdated);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="topbar">
      <div className="search-bar">
        <Search className="w-4 h-4 text-muted" />
        <input type="text" placeholder="Search meetings..." />
      </div>
      <div className="topbar-actions" style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => { setShowUserMenu(!showUserMenu); }}
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
                  borderBottom: '1px solid #f1f5f9',
                  background: 'none', 
                  textAlign: 'left', 
                  cursor: 'pointer', 
                  fontSize: '0.8125rem',
                  color: '#334155',
                  fontWeight: 500
                }}
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
              >
                <SettingsIcon className="w-3.5 h-3.5" /> Settings
              </button>
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
