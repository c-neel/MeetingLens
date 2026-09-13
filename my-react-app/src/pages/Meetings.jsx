import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Search, Plus, Mic, ArrowRight, Clock, Users, Award, 
  LayoutGrid, List, Download, Share2, Bookmark, MoreVertical, Play, 
  Zap, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight,
  Video, FileText, CheckCircle2, AlertCircle, Eye, ShieldCheck, ChevronDown
} from 'lucide-react';
import { getMeetings } from '../services/api';
import { exportAsPDF } from '../utils/exporter';

export default function Meetings() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'live' | 'upload'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    getMeetings().then(data => {
      const sorted = [...data].sort((a, b) => {
        const dateDiff = new Date(b.date || b.meeting_date || 0) - new Date(a.date || a.meeting_date || 0);
        if (dateDiff !== 0) return dateDiff;
        return (b.id || 0) - (a.id || 0);
      });
      setMeetings(sorted);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const liveMeetingsCount = meetings.filter(m => m.source === 'voice' || m.source === 'live').length;
  const uploadMeetingsCount = meetings.length - liveMeetingsCount;

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = 
      (m.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.summary || m.executive_summary || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterType === 'live') {
      return m.source === 'voice' || m.source === 'live';
    } else if (filterType === 'upload') {
      return m.source !== 'voice' && m.source !== 'live';
    }
    return true;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / ITEMS_PER_PAGE));
  const paginatedMeetings = filteredMeetings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filteredMeetings.length);

  const pinnedMeetings = meetings.slice(0, 2);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMeetings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMeetings.map(m => m.id));
    }
  };

  const toggleSelectMeeting = (e, id) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Breadcrumb & Engine Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
          <span style={{ color: '#475569', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Workspace</span>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ color: '#4f46e5', fontWeight: 600 }}>Meetings</span>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 600 }}>Global Archive</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <span className="live-pulse-green" />
          <span style={{ color: '#15803d' }}>Engine Sync Active: 24h auto-index</span>
        </div>
      </div>

      {/* Executive Title Block & Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', fontFamily: 'var(--font-display)', margin: 0 }}>
              Meeting Workspace & History
            </h1>
            <span style={{ padding: '0.2rem 0.625rem', borderRadius: '9999px', backgroundColor: '#e0e7ff', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 700 }}>
              {meetings.length} Recorded
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.375rem', maxWidth: '640px', lineHeight: 1.5 }}>
            Search, analyze, and review transcripts, extracted action items, and executive decisions across your team calls.
          </p>
        </div>

        {/* Action Controls Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          


          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 0.875rem', 
                borderRadius: '0.5rem', 
                fontSize: '0.8125rem', 
                fontWeight: 600, 
                backgroundColor: '#ffffff', 
                border: '1px solid #e2e8f0', 
                color: '#334155', 
                cursor: 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)'
              }}
            >
              <Share2 style={{ width: '15px', height: '15px', color: '#64748b' }} />
              <span>Export Archive</span>
              <ChevronDown style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
            </button>

            {showExportMenu && (
              <div style={{ 
                position: 'absolute', 
                right: 0, 
                top: '100%', 
                marginTop: '0.375rem', 
                width: '180px', 
                backgroundColor: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '0.5rem', 
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', 
                zIndex: 50,
                padding: '0.375rem'
              }}>
                <button 
                  onClick={() => { setShowExportMenu(false); navigate('/reports'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.8125rem', color: '#334155', cursor: 'pointer', borderRadius: '0.375rem' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Download style={{ width: '14px', height: '14px' }} /> Export as JSON
                </button>
                <button 
                  onClick={() => { setShowExportMenu(false); navigate('/reports'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.8125rem', color: '#334155', cursor: 'pointer', borderRadius: '0.375rem' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <FileText style={{ width: '14px', height: '14px' }} /> Export PDF Summary
                </button>
              </div>
            )}
          </div>

          {/* Primary Trigger Action */}
          <button 
            onClick={() => navigate('/analyze')}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              fontSize: '0.8125rem', 
              fontWeight: 600, 
              backgroundColor: '#4f46e5', 
              color: '#ffffff', 
              border: 'none', 
              cursor: 'pointer',
              boxShadow: '0 2px 4px 0 rgba(79, 70, 229, 0.25)',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Analyze / Record Meeting</span>
          </button>
        </div>

      </div>

      {/* Filter & Utility Toolbar */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Instant Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <SlidersHorizontal style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Filter by title, speaker, tag, or key decision... (Press / to search)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                paddingLeft: '2.5rem', 
                paddingRight: '2.5rem', 
                paddingTop: '0.55rem', 
                paddingBottom: '0.55rem', 
                borderRadius: '0.5rem', 
                border: '1px solid #e2e8f0', 
                backgroundColor: '#f8fafc', 
                fontSize: '0.875rem', 
                color: '#0f172a',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#818cf8'; }}
              onBlur={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            />
            <span className="shortcut-badge" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>/</span>
          </div>

          {/* Quick Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', backgroundColor: '#f8fafc', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <button 
              className={`filter-tab-pill ${filterType === 'all' ? 'active' : 'inactive'}`}
              onClick={() => setFilterType('all')}
            >
              All ({meetings.length})
            </button>
            <button 
              className={`filter-tab-pill ${filterType === 'live' ? 'active' : 'inactive'}`}
              onClick={() => setFilterType('live')}
            >
              Live Recorded ({liveMeetingsCount})
            </button>
            <button 
              className={`filter-tab-pill ${filterType === 'upload' ? 'active' : 'inactive'}`}
              onClick={() => setFilterType('upload')}
            >
              Uploaded ({uploadMeetingsCount})
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: PINNED HIGH-IMPACT SESSIONS (2 Executive Cards) */}
      {pinnedMeetings.length > 0 && !searchTerm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bookmark style={{ width: '16px', height: '16px', color: '#4f46e5', fill: '#4f46e5' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a' }}>
                Pinned High-Impact Sessions ({pinnedMeetings.length})
              </span>
            </div>
            <button 
              onClick={() => setPinnedCollapsed(!pinnedCollapsed)}
              style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {pinnedCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            </button>
          </div>

          {!pinnedCollapsed && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
              
              {pinnedMeetings.map((meeting, index) => (
                <div key={meeting.id || index} className="pinned-card-v2">
                  
                  {/* Subtle Gradient Glow Backdrop */}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '240px', height: '120px', background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.08), transparent 70%)', pointerEvents: 'none' }} />

                  <div>
                    {/* Header Bar with Status, Type, and Pin */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.125rem 0.625rem', borderRadius: '9999px', backgroundColor: index === 0 ? '#e0e7ff' : '#f1f5f9', color: index === 0 ? '#4338ca' : '#334155', fontSize: '0.75rem', fontWeight: 700 }}>
                          {meeting.source === 'voice' ? <Mic style={{ width: '13px', height: '13px' }} /> : <Video style={{ width: '13px', height: '13px' }} />}
                          {meeting.source === 'voice' ? 'Live Audio' : 'Recorded Meeting'}
                        </span>
                        <span style={{ padding: '0.125rem 0.5rem', borderRadius: '0.25rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.6875rem', fontFamily: 'monospace', color: '#64748b' }}>
                          S{44 - index}-KICKOFF
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', padding: '0.25rem' }}>
                          <Bookmark style={{ width: '16px', height: '16px', fill: '#4f46e5' }} />
                        </button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}>
                          <MoreVertical style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>

                    {/* Meeting Title */}
                    <h3 
                      onClick={() => navigate(`/meetings/${meeting.id}`)}
                      style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer', margin: '0 0 0.5rem 0', lineHeight: 1.35 }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#4f46e5'}
                      onMouseOut={(e) => e.currentTarget.style.color = '#0f172a'}
                    >
                      {meeting.title || 'Untitled Meeting'}
                    </h3>

                    {/* Meta Stack */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar style={{ width: '14px', height: '14px' }} /> {meeting.date || meeting.meeting_date || 'Oct 24, 2024'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Clock style={{ width: '14px', height: '14px' }} /> {meeting.duration || '48 mins'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Users style={{ width: '14px', height: '14px' }} />
                        <span>{Array.isArray(meeting.participants) ? meeting.participants.length : (meeting.participants || '6')} participants</span>
                      </div>
                    </div>



                    {/* AI Executive Synthesis Box */}
                    <div style={{ backgroundColor: '#f1f5f9', borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.375rem' }}>
                        <span>AI Executive Synthesis</span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#334155', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {meeting.summary || meeting.executive_summary || 'Agreed on shipping responsive layout by Nov 12. Deprecated legacy webhooks in favor of Notion/Linear sync. Reallocated engineers to transcription latency optimization.'}
                      </p>
                    </div>

                  </div>

                  {/* Card Bottom Action Ribbon */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <button 
                      onClick={() => navigate(`/meetings/${meeting.id}`)}
                      style={{ 
                        flex: 1, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.375rem', 
                        padding: '0.5rem 0.875rem', 
                        borderRadius: '0.5rem', 
                        backgroundColor: '#4f46e5', 
                        color: '#ffffff', 
                        fontSize: '0.8125rem', 
                        fontWeight: 600, 
                        border: 'none', 
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                    >
                      <span>View Transcript & Summary</span>
                      <ArrowRight style={{ width: '15px', height: '15px' }} />
                    </button>

                    <button 
                      title="Download PDF"
                      onClick={(e) => { e.stopPropagation(); exportAsPDF(meeting); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#4f46e5', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
                    >
                      <Download style={{ width: '16px', height: '16px' }} />
                      <span>Download PDF</span>
                    </button>
                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      )}

      {/* SECTION: ALL WORKSPACE SESSIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Section Header Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a', margin: 0 }}>
              All Recorded Sessions
            </h2>
            <span style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
              Showing {startIdx}–{endIdx} of {filteredMeetings.length}
            </span>
          </div>


        </div>

        {/* Loading State */}
        {loading ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading workspace meetings...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <FileText style={{ width: '36px', height: '36px', color: '#cbd5e1', margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>No meetings found</h3>
            <p style={{ color: '#64748b', marginTop: '0.375rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              {searchTerm ? `No meetings match "${searchTerm}".` : 'No meetings created yet in your workspace.'}
            </p>
            <button 
              onClick={() => navigate('/analyze')}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
            >
              + Start New Meeting Analysis
            </button>
          </div>
        ) : (
          /* Cards Grid / List Mosaic */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(330px, 1fr))' : '1fr', 
            gap: '1.25rem' 
          }}>
            {paginatedMeetings.map((meeting, index) => {
              const isVoice = meeting.source === 'voice' || meeting.source === 'live';
              const isSelected = selectedIds.includes(meeting.id);

              return (
                <div 
                  key={meeting.id || index}
                  className="meeting-card-v2"
                  onClick={() => navigate(`/meetings/${meeting.id}`)}
                  style={{
                    borderColor: isSelected ? '#818cf8' : undefined,
                    backgroundColor: isSelected ? '#f5f3ff' : undefined
                  }}
                >
                  <div>
                    {/* Card Header Strip */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isVoice && (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            padding: '0.125rem 0.5rem', 
                            borderRadius: '9999px', 
                            fontSize: '0.7rem', 
                            fontWeight: 700, 
                            backgroundColor: '#fee2e2', 
                            color: '#dc2626' 
                          }}>
                            <Mic style={{ width: '12px', height: '12px' }} />
                            Live Voice
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: index < 2 ? '#4f46e5' : '#cbd5e1', padding: '0.2rem' }}
                        >
                          <Bookmark style={{ width: '15px', height: '15px', fill: index < 2 ? '#4f46e5' : 'none' }} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.2rem' }}
                        >
                          <MoreVertical style={{ width: '15px', height: '15px' }} />
                        </button>
                      </div>
                    </div>

                    {/* Meeting Title */}
                    <h3 
                      style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.375rem 0', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {meeting.title || 'Untitled Meeting'}
                    </h3>

                    {/* Meta Stack */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar style={{ width: '13px', height: '13px' }} /> {meeting.date || meeting.meeting_date || 'Oct 21'}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock style={{ width: '13px', height: '13px' }} /> {meeting.duration || '42m'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Users style={{ width: '13px', height: '13px' }} />
                        <span>{Array.isArray(meeting.participants) ? meeting.participants.length : (meeting.participants || '4')} attend</span>
                      </div>
                    </div>



                    {/* AI Takeaway Snippet */}
                    <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0 0 0.875rem 0', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {meeting.summary || meeting.executive_summary || 'Reviewed model benchmarks. Decreased chunk latency by 35% across live audio streams.'}
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.625rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      View Details <ArrowRight style={{ width: '14px', height: '14px' }} />
                    </span>
                    <button 
                      title="Download PDF"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportAsPDF(meeting);
                      }}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.25rem', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.375rem', 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        color: '#4f46e5', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        cursor: 'pointer' 
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e0e7ff'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                    >
                      <Download style={{ width: '13px', height: '13px' }} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Bottom Scalability & Pagination Footer */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: '#64748b' }}>
          <span>Showing <strong style={{ color: '#0f172a' }}>{startIdx}–{endIdx}</strong> of <strong style={{ color: '#0f172a' }}>{filteredMeetings.length}</strong> recorded meetings</span>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ width: '32px', height: '32px', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: currentPage === 1 ? '#f8fafc' : '#ffffff', color: currentPage === 1 ? '#94a3b8' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{ width: '32px', height: '32px', borderRadius: '0.5rem', border: 'none', backgroundColor: page === currentPage ? '#4f46e5' : 'transparent', color: page === currentPage ? '#ffffff' : '#475569', fontWeight: page === currentPage ? 700 : 600, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ width: '32px', height: '32px', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: currentPage === totalPages ? '#f8fafc' : '#ffffff', color: currentPage === totalPages ? '#94a3b8' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

