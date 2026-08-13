import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Plus, Mic, ArrowRight, Clock, Users, Award } from 'lucide-react';
import { getMeetings } from '../services/api';

export default function Meetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMeetings().then(data => {
      // Sort latest first (highest ID or newest date)
      const sorted = [...data].sort((a, b) => {
        const dateDiff = new Date(b.date || b.meeting_date || 0) - new Date(a.date || a.meeting_date || 0);
        if (dateDiff !== 0) return dateDiff;
        return (b.id || 0) - (a.id || 0);
      });
      setMeetings(sorted);
      setLoading(false);
    });
  }, []);

  const filteredMeetings = meetings.filter(m =>
    (m.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.summary || m.executive_summary || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-title">
        <div>
          <span>All Meetings</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.75rem', fontWeight: 'normal' }}>
            ({meetings.length} meeting{meetings.length !== 1 ? 's' : ''})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/voice-meeting')}>
            <Mic className="w-4 h-4" /> Record Voice
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
            <Plus className="w-4 h-4" /> New Analysis
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search meetings by title or summary..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.5rem',
              paddingRight: '1rem',
              paddingTop: '0.625rem',
              paddingBottom: '0.625rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'white',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading meetings...
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3>No meetings found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            {searchTerm ? `No meetings match "${searchTerm}".` : 'No meetings created yet.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
            <Plus className="w-4 h-4" /> Start New Meeting Analysis
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filteredMeetings.map((meeting, index) => (
            <div
              key={meeting.id || index}
              className="card"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '1.25rem',
                borderLeft: index === 0 ? '4px solid var(--primary)' : '1px solid var(--border)'
              }}
              onClick={() => navigate(`/meetings/${meeting.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {meeting.title || 'Untitled Meeting'}
                    </h3>
                    {index === 0 && (
                      <span className="badge badge-primary" style={{ fontSize: '0.6875rem', fontWeight: 600 }}>
                        LATEST
                      </span>
                    )}
                    {meeting.source === 'voice' && (
                      <span className="badge badge-danger" style={{ fontSize: '0.6875rem' }}>
                        Voice
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {meeting.summary || meeting.executive_summary || 'No summary available.'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {meeting.quality_score && (
                    <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Award className="w-3 h-3" /> {meeting.quality_score}/100
                    </span>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Calendar className="w-3.5 h-3.5" /> {meeting.date || meeting.meeting_date || 'N/A'}
                </span>
                {meeting.duration && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock className="w-3.5 h-3.5" /> {meeting.duration}
                  </span>
                )}
                {meeting.participants && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Users className="w-3.5 h-3.5" /> {Array.isArray(meeting.participants) ? meeting.participants.join(', ') : meeting.participants}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
