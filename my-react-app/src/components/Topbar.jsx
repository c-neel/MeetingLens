import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, ChevronDown, Settings as SettingsIcon, LogOut, Shield } from 'lucide-react';

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
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AS';
  const userRole = savedUser.role || 'Product Lead';

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
    <div className="topbar" style={{ height: '64px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 40 }}>
      {/* Search Input */}
      <div style={{ position: 'relative', width: '380px' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.45rem 0.875rem', gap: '0.625rem', transition: 'all 0.2s ease' }}>
          <Search style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search meetings, action items, transcripts..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem', color: '#0f172a' }}
          />
          <span className="shortcut-badge">⌘K</span>
        </div>
      </div>

      {/* Right Topbar Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Analyze New File CTA */}
        <button 
          onClick={() => navigate('/analyze')}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.375rem', 
            backgroundColor: '#4f46e5', 
            color: '#ffffff', 
            fontSize: '0.8125rem', 
            fontWeight: 600, 
            padding: '0.45rem 0.875rem', 
            borderRadius: '0.5rem', 
            border: 'none', 
            cursor: 'pointer',
            boxShadow: '0 1px 2px 0 rgba(79, 70, 229, 0.2)',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>Analyze New File</span>
        </button>

        {/* Bell Icon with Dot */}
        <button 
          style={{ 
            position: 'relative', 
            width: '36px', 
            height: '36px', 
            borderRadius: '0.5rem', 
            border: '1px solid #e2e8f0', 
            backgroundColor: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#64748b', 
            cursor: 'pointer' 
          }}
        >
          <Bell style={{ width: '18px', height: '18px' }} />
          <span style={{ position: 'absolute', top: '7px', right: '7px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b', border: '1.5px solid white' }} />
        </button>

        {/* Vertical Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }} />

        {/* User Profile Pill & Dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.625rem', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '0.5rem', 
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', border: '1px solid #c7d2fe' }}>
              {userInitials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', lineHeight: '1.2' }}>{userName}</span>
              <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>{userRole}</span>
            </div>
            <ChevronDown style={{ width: '14px', height: '14px', color: '#94a3b8', marginLeft: '0.25rem' }} />
          </div>

          {/* User Dropdown */}
          {showUserMenu && (
            <div style={{ 
              position: 'absolute', 
              right: 0, 
              top: '100%', 
              marginTop: '0.5rem', 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '0.75rem', 
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)', 
              zIndex: 100, 
              width: '200px', 
              overflow: 'hidden' 
            }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{userName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>{savedUser.email || 'user@meetinglens.ai'}</div>
              </div>

              <div style={{ padding: '0.375rem' }}>
                <button 
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.625rem', 
                    width: '100%', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '0.375rem',
                    border: 'none', 
                    background: 'none', 
                    cursor: 'pointer', 
                    fontSize: '0.8125rem',
                    color: '#334155',
                    fontWeight: 500
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <SettingsIcon style={{ width: '14px', height: '14px', color: '#64748b' }} /> Settings
                </button>

                <button 
                  onClick={() => { setShowUserMenu(false); navigate('/reports'); }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.625rem', 
                    width: '100%', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '0.375rem',
                    border: 'none', 
                    background: 'none', 
                    cursor: 'pointer', 
                    fontSize: '0.8125rem',
                    color: '#334155',
                    fontWeight: 500
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Shield style={{ width: '14px', height: '14px', color: '#64748b' }} /> Reports & Export
                </button>

                <div style={{ height: '1px', background: '#f1f5f9', margin: '0.25rem 0' }} />

                <button 
                  onClick={handleLogout}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.625rem', 
                    width: '100%', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '0.375rem',
                    border: 'none', 
                    background: 'none', 
                    cursor: 'pointer', 
                    fontSize: '0.8125rem',
                    color: '#ef4444',
                    fontWeight: 600
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

