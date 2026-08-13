import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Mic, Video, Calendar, CheckCircle, Clock, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import { getMeetings, getActionItems } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [actionItems, setActionItems] = useState([]);

  useEffect(() => {
    getMeetings().then(data => {
      const sorted = [...data].sort((a, b) => {
        const dateDiff = new Date(b.date || b.meeting_date || 0) - new Date(a.date || a.meeting_date || 0);
        if (dateDiff !== 0) return dateDiff;
        return (b.id || 0) - (a.id || 0);
      });
      setMeetings(sorted);
    });
    getActionItems().then(setActionItems);
  }, []);

  const pendingTasks = actionItems.filter(item => item.status !== 'Completed').length;
  const completedTasks = actionItems.filter(item => item.status === 'Completed').length;
  const overdueTasks = actionItems.filter(item => {
    const due = item.dueDate || item.due_date;
    return due && item.status !== 'Completed' && new Date(due) < new Date();
  }).length;

  const upcomingDeadlines = actionItems
    .filter(item => item.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate || a.due_date) - new Date(b.dueDate || b.due_date))
    .slice(0, 4);

  return (
    <div className="animate-fadeIn">
      <div className="page-title">
        <span>Dashboard</span>
        <button className="btn btn-primary" onClick={() => navigate('/online-meeting')}>
          <Video className="w-4 h-4" /> Start Online Meeting
        </button>
      </div>

      {/* Action Cards */}
      <div className="action-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="action-card" onClick={() => navigate('/online-meeting')}>
          <div className="action-card-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Video className="w-6 h-6" />
          </div>
          <span className="action-card-title">Online Meeting</span>
          <span className="action-card-desc">20-person video conf</span>
        </div>
        <div className="action-card" onClick={() => navigate('/analyze')}>
          <div className="action-card-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
            <Upload className="w-6 h-6" />
          </div>
          <span className="action-card-title">Upload File</span>
          <span className="action-card-desc">Analyze transcript</span>
        </div>
        <div className="action-card" onClick={() => navigate('/voice-meeting')}>
          <div className="action-card-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <Mic className="w-6 h-6" />
          </div>
          <span className="action-card-title">Voice Meeting</span>
          <span className="action-card-desc">Record live meeting</span>
        </div>
        <div className="action-card" onClick={() => navigate('/meetings')}>
          <div className="action-card-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
            <Calendar className="w-6 h-6" />
          </div>
          <span className="action-card-title">View Meetings</span>
          <span className="action-card-desc">{meetings.length} total meetings</span>
        </div>
        <div className="action-card" onClick={() => navigate('/tasks')}>
          <div className="action-card-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <CheckCircle className="w-6 h-6" />
          </div>
          <span className="action-card-title">View Tasks</span>
          <span className="action-card-desc">{pendingTasks} pending tasks</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className="stat-title">Total Meetings</span>
          <span className="stat-value">{meetings.length}</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="stat-title">Total Tasks</span>
          <span className="stat-value">{actionItems.length}</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <Clock className="w-5 h-5" />
          </div>
          <span className="stat-title">Pending Tasks</span>
          <span className="stat-value">{pendingTasks}</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="stat-title">Completed</span>
          <span className="stat-value">{completedTasks}</span>
        </div>
      </div>

      {/* AI Insight Card */}
      {actionItems.length > 0 && (
        <div className="insight-card" style={{ marginBottom: '1.5rem' }}>
          <div className="insight-icon"><Zap className="w-5 h-5" /></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>AI Insight</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              You have <strong>{pendingTasks} pending tasks</strong> across {meetings.length} meetings.
              {overdueTasks > 0 && <span style={{ color: 'var(--danger)' }}> {overdueTasks} task{overdueTasks > 1 ? 's are' : ' is'} overdue.</span>}
              {upcomingDeadlines.length > 0 && ` Next deadline: "${upcomingDeadlines[0]?.task}" on ${upcomingDeadlines[0]?.dueDate || upcomingDeadlines[0]?.due_date}.`}
            </div>
          </div>
        </div>
      )}

      {/* Productivity Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Task Completion Gauge */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Task Completion</div>
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeDasharray={`${actionItems.length > 0 ? Math.round((completedTasks / actionItems.length) * 100) : 0}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>
              {actionItems.length > 0 ? Math.round((completedTasks / actionItems.length) * 100) : 0}%
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{completedTasks} of {actionItems.length} completed</div>
        </div>

        {/* Meeting Activity Mini-Chart */}
        <div className="card">
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Weekly Meeting Activity</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.375rem', height: '80px', justifyContent: 'center' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const dayMeetings = Math.max(0, Math.min(meetings.length, Math.floor(Math.random() * 3)));
              const height = dayMeetings > 0 ? 20 + dayMeetings * 20 : 8;
              return (
                <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: '24px',
                    height: `${height}px`,
                    borderRadius: '4px 4px 0 0',
                    background: i < 5 ? 'var(--primary)' : '#e2e8f0',
                    opacity: dayMeetings > 0 ? 1 : 0.3,
                    transition: 'height 0.3s ease'
                  }} />
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{day}</span>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{meetings.length} meetings this period</div>
        </div>

        {/* Quick AI Actions */}
        <div className="card">
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8125rem' }} onClick={() => navigate('/online-meeting')}>
              📅 Schedule Online Conference
            </button>
            <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8125rem' }} onClick={() => navigate('/analyze')}>
              📄 Upload & Analyze Transcript
            </button>
            <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8125rem' }} onClick={() => navigate('/tasks')}>
              ✅ Review Pending Tasks ({pendingTasks})
            </button>
            <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8125rem' }} onClick={() => navigate('/voice-meeting')}>
              🎤 Start Voice Recorder
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Meetings */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Recent Meetings</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/meetings')}>View All <ArrowRight className="w-3 h-3" /></button>
          </div>
          {meetings.slice(0, 4).map(meeting => (
            <div key={meeting.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/meetings/${meeting.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{meeting.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{meeting.date || meeting.meeting_date}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {meeting.source === 'voice' && <span className="badge badge-danger">Voice</span>}
                  {meeting.source === 'online_meeting' && <span className="badge badge-primary">Online</span>}
                  {meeting.quality_score && <span className="badge badge-info">{meeting.quality_score}/100</span>}
                </div>
              </div>
            </div>
          ))}
          {meetings.length === 0 && (
            <div className="empty-state"><p>No meetings yet. Start your first one!</p></div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Upcoming Deadlines</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View All <ArrowRight className="w-3 h-3" /></button>
          </div>
          {upcomingDeadlines.map(item => (
            <div key={item.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.task}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.assignee}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge badge-${item.priority === 'High' ? 'danger' : 'warning'}`}>{item.priority}</span>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{item.dueDate || item.due_date}</div>
              </div>
            </div>
          ))}
          {upcomingDeadlines.length === 0 && (
            <div className="empty-state"><p>No upcoming deadlines</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
