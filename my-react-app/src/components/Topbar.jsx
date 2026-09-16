import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, Settings as SettingsIcon, LogOut, Shield, FileText, Calendar, ArrowRight, X } from 'lucide-react';
import { getMeetings } from '../services/api';

export default function Topbar() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

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

  useEffect(() => {
    getMeetings().then(data => {
      setMeetings(data || []);
    }).catch(console.error);

    const handleUserUpdated = () => {
      try {
        setSavedUser(JSON.parse(localStorage.getItem('user') || '{}'));
      } catch (e) {}
    };
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => window.removeEventListener('userUpdated', handleUserUpdated);
  }, []);

  // Global keyboard shortcut (Cmd+K or Ctrl+K) to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search results dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredMeetings = meetings.filter(m => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    const title = (m.title || '').toLowerCase();
    const summary = (m.summary || m.executive_summary || '').toLowerCase();
    return title.includes(q) || summary.includes(q);
  }).slice(0, 5);

  return (
    <div className="topbar" style={{ height: '64px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 40 }}>
      {/* Search Input Container */}
      <div ref={searchContainerRef} style={{ position: 'relative', width: '380px' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.45rem 0.875rem', gap: '0.625rem', transition: 'all 0.2s ease' }}>
          <Search style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search meetings, action items, transcripts..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem', color: '#0f172a' }}
          />
          {searchQuery ? (
            <button 
              onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          ) : (
            <span className="shortcut-badge">⌘K</span>
          )}
        </div>

        {/* Search Results Dropdown Overlay */}
        {showSearchResults && searchQuery.trim() !== '' && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.375rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
            zIndex: 100,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '0.625rem 0.875rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              Search Results ({filteredMeetings.length})
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map((m) => (
                  <div 
                    key={m.id}
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery('');
                      navigate(`/meetings/${m.id}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.875rem',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', overflow: 'hidden' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '0.375rem', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText style={{ width: '14px', height: '14px' }} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.title || 'Untitled Meeting'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar style={{ width: '11px', height: '11px' }} />
                          <span>{m.date || m.meeting_date || 'Recent'}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight style={{ width: '14px', height: '14px', color: '#94a3b8', flexShrink: 0 }} />
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', color: '#64748b' }}>
                  No meetings found matching "{searchQuery}".
                </div>
              )}
            </div>

            <div 
              onClick={() => {
                setShowSearchResults(false);
                navigate('/meetings');
              }}
              style={{
                padding: '0.625rem 0.875rem',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#4f46e5',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Browse All Meetings →
            </div>
          </div>
        )}
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

