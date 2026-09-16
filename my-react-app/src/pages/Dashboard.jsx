import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Upload, Mic, Video, Calendar, CheckSquare, CheckCircle, 
  Clock, Zap, ArrowRight, TrendingUp, AlertTriangle, ChevronRight, FileText, Download
} from 'lucide-react';
import { getMeetings, getActionItems } from '../services/api';
import { exportAsPDF } from '../utils/exporter';

export default function Dashboard() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [actionItems, setActionItems] = useState([]);

  // Get logged in user details from localStorage
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserName = savedUser.name || 'Amit Shah';
  const userFirstName = currentUserName.split(' ')[0] || 'Amit';

  const isMyTask = (item) => {
    if (!item || !item.assignee) return false;
    const a = String(item.assignee).trim().toLowerCase();
    if (!a || a === '-' || a === 'null' || a === 'unassigned' || a === 'none' || a === 'not specified') {
      return false;
    }
    const full = currentUserName.toLowerCase();
    const first = userFirstName.toLowerCase();
    return a === full || a === first || a.includes(first) || full.includes(a);
  };

  const getDisplayAssignee = (item) => {
    if (!item || !item.assignee) return '-';
    const a = String(item.assignee).trim();
    if (!a || a === '-' || a.toLowerCase() === 'unassigned' || a.toLowerCase() === 'none' || a.toLowerCase() === 'not specified') {
      return '-';
    }
    if (isMyTask(item)) return currentUserName;
    return a;
  };

  // Real-time synchronization: poll every 3 seconds
  useEffect(() => {
    let isMounted = true;
    const fetchData = () => {
      getMeetings().then(data => {
        if (!isMounted) return;
        const sorted = [...data].sort((a, b) => {
          const dateDiff = new Date(b.date || b.meeting_date || 0) - new Date(a.date || a.meeting_date || 0);
          if (dateDiff !== 0) return dateDiff;
          return (b.id || 0) - (a.id || 0);
        });
        setMeetings(sorted);
      }).catch(console.error);

      getActionItems().then(data => {
        if (!isMounted) return;
        setActionItems(data);
      }).catch(console.error);
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filter tasks strictly for the current logged-in user
  const myTasks = actionItems.filter(isMyTask);
  const pendingTasks = myTasks.filter(item => item.status !== 'Completed').length;
  const completedTasks = myTasks.filter(item => item.status === 'Completed').length;
  const overdueTasks = myTasks.filter(item => {
    const due = item.dueDate || item.due_date;
    return due && due !== 'No Deadline' && due !== 'null' && due !== '-' && item.status !== 'Completed' && new Date(due) < new Date();
  }).length;

  const upcomingDeadlines = myTasks
    .filter(item => item.status !== 'Completed')
    .sort((a, b) => {
      const dateA = a.dueDate || a.due_date;
      const dateB = b.dueDate || b.due_date;
      const validA = dateA && dateA !== 'No Deadline' && dateA !== 'null' && dateA !== '-';
      const validB = dateB && dateB !== 'No Deadline' && dateB !== 'null' && dateB !== '-';
      if (validA && !validB) return -1;
      if (!validA && validB) return 1;
      if (!validA && !validB) return 0;
      return new Date(dateA) - new Date(dateB);
    })
    .slice(0, 4);

  const completionPercentage = myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 0;
  const inProgressTasks = Math.max(0, pendingTasks - overdueTasks);

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Dashboard Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', fontFamily: 'var(--font-display)' }}>
              Dashboard
            </h1>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.375rem', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: '#15803d', 
              backgroundColor: '#f0fdf4', 
              border: '1px solid #bbf7d0',
              padding: '0.2rem 0.625rem', 
              borderRadius: '9999px' 
            }}>
              <span className="live-pulse-green" />
              Live Sync
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
            Welcome back, <strong style={{ color: '#334155' }}>{currentUserName}</strong>. Here is your team's real-time meeting intelligence.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/voice-meeting')}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem 0.875rem', 
              borderRadius: '0.5rem', 
              fontSize: '0.8125rem', 
              fontWeight: 600, 
              color: '#334155', 
              backgroundColor: '#ffffff', 
              border: '1px solid #e2e8f0', 
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
            }}
          >
            <Mic style={{ width: '16px', height: '16px', color: '#ef4444' }} />
            <span>Schedule Voice Meeting</span>
          </button>
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
              color: '#ffffff', 
              backgroundColor: '#4f46e5', 
              border: 'none', 
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(79, 70, 229, 0.25)'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Analyze New File</span>
          </button>
        </div>
      </div>

      {/* Action Cards Row (4 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Upload File */}
        <div className="dash-action-card-v2" onClick={() => navigate('/analyze')}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload style={{ width: '20px', height: '20px' }} />
              </div>
              <span className="shortcut-badge">⌘U</span>
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>Upload File</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Analyze meeting transcript</p>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5' }}>Start Upload</span>
            <ArrowRight className="action-card-arrow" style={{ width: '16px', height: '16px', color: '#4f46e5' }} />
          </div>
        </div>

        {/* Voice Meeting */}
        <div className="dash-action-card-v2" onClick={() => navigate('/voice-meeting')}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic style={{ width: '20px', height: '20px' }} />
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                <span className="live-pulse-red" />
                LIVE
              </span>
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>Voice Meeting</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Record live meeting</p>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444' }}>Record Now</span>
            <ArrowRight className="action-card-arrow" style={{ width: '16px', height: '16px', color: '#ef4444' }} />
          </div>
        </div>

        {/* View Meetings */}
        <div className="dash-action-card-v2" onClick={() => navigate('/meetings')}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar style={{ width: '20px', height: '20px' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                {meetings.length} Total
              </span>
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>View Meetings</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>{meetings.length} recorded sessions</p>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>Browse History</span>
            <ArrowRight className="action-card-arrow" style={{ width: '16px', height: '16px', color: '#2563eb' }} />
          </div>
        </div>

        {/* View Tasks */}
        <div className="dash-action-card-v2" onClick={() => navigate('/tasks')}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckSquare style={{ width: '20px', height: '20px' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#b45309' }}>
                {pendingTasks} Pending
              </span>
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>View Tasks</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Action items assigned to you</p>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>Manage Tasks</span>
            <ArrowRight className="action-card-arrow" style={{ width: '16px', height: '16px', color: '#059669' }} />
          </div>
        </div>

      </div>

      {/* Metrics Row (4 Columns matching reference design) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Total Meetings Metric */}
        <div className="dash-metric-card-v2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Meetings</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '0.375rem', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span className="num-mono" style={{ fontSize: '1.75rem', color: '#0f172a' }}>{meetings.length}</span>
            <span className="badge-trend-up">
              <TrendingUp style={{ width: '12px', height: '12px' }} />
              +12.5%
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Avg {(meetings.length / 4 || 3.5).toFixed(1)} meetings/week</p>
        </div>

        {/* Tasks Extracted Metric */}
        <div className="dash-metric-card-v2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks Extracted</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '0.375rem', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span className="num-mono" style={{ fontSize: '1.75rem', color: '#0f172a' }}>{myTasks.length}</span>
            <span className="badge-trend-up">
              <TrendingUp style={{ width: '12px', height: '12px' }} />
              +18%
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>{completedTasks} tasks completed</p>
        </div>

        {/* Pending Tasks Metric */}
        <div className="dash-metric-card-v2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Tasks</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '0.375rem', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span className="num-mono" style={{ fontSize: '1.75rem', color: '#0f172a' }}>{pendingTasks}</span>
            {overdueTasks > 0 ? (
              <span className="badge-trend-rose">
                <AlertTriangle style={{ width: '12px', height: '12px' }} />
                {overdueTasks} Overdue
              </span>
            ) : (
              <span className="badge-trend-amber">
                On Track
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Requires your review</p>
        </div>

        {/* Completion Rate Metric */}
        <div className="dash-metric-card-v2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Rate</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '0.375rem', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span className="num-mono" style={{ fontSize: '1.75rem', color: '#0f172a' }}>{completionPercentage}%</span>
            <span className="badge-trend-up">
              <TrendingUp style={{ width: '12px', height: '12px' }} />
              +4%
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>{completedTasks} of {myTasks.length} total tasks</p>
        </div>

      </div>

      {/* Analytics Grid (Task Completion Velocity Donut + Weekly Cadence Bar Chart) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Task Completion Velocity (Donut Chart Card) */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Task Completion Velocity</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Distribution across status & team</p>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                Real-time
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '1rem 0', flexWrap: 'wrap', gap: '1.5rem' }}>
              {/* SVG Donut Chart */}
              <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3.8"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.8"
                    strokeDasharray={`${completionPercentage}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                    {completionPercentage}%
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', uppercase: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                    Completed
                  </div>
                </div>
              </div>

              {/* Legend List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '140px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#334155' }}>Completed</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{completedTasks}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#334155' }}>In Progress</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{inProgressTasks}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#334155' }}>Overdue</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: overdueTasks > 0 ? '#ef4444' : '#0f172a' }}>{overdueTasks}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.875rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
            <span>Target: 85% weekly clear rate</span>
            <button onClick={() => navigate('/tasks')} style={{ color: '#4f46e5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View Breakdown →</button>
          </div>
        </div>

        {/* Weekly Cadence Bar Chart Card */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Weekly Cadence</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Meetings & Action Items logged</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#475569' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#4f46e5' }} /> Meetings
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#475569' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#cbd5e1' }} /> Tasks
                </span>
              </div>
            </div>

            {/* Bar Chart Visual */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem', height: '130px', padding: '1rem 0.5rem 0.5rem 0.5rem' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const heights = [60, 95, 40, 80, 110, 25, 15];
                const taskHeights = [40, 60, 20, 50, 75, 10, 10];
                const h = heights[idx];
                const th = taskHeights[idx];
                const isToday = idx === 4;

                return (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '100px' }}>
                      <div 
                        style={{ 
                          width: '12px', 
                          height: `${h}px`, 
                          backgroundColor: isToday ? '#4f46e5' : '#6366f1', 
                          borderRadius: '3px 3px 0 0',
                          opacity: isToday ? 1 : 0.85,
                          transition: 'all 0.3s ease'
                        }} 
                        title={`${day}: Meetings`}
                      />
                      <div 
                        style={{ 
                          width: '12px', 
                          height: `${th}px`, 
                          backgroundColor: '#cbd5e1', 
                          borderRadius: '3px 3px 0 0',
                          transition: 'all 0.3s ease'
                        }} 
                        title={`${day}: Tasks`}
                      />
                    </div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: isToday ? 700 : 500, color: isToday ? '#4f46e5' : '#64748b' }}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.875rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
            <span>{meetings.length} Total Meetings logged</span>
            <span>{myTasks.length} Total Action Items</span>
          </div>
        </div>

      </div>

      {/* Bottom Section (Recent Meetings Table & Upcoming Deadlines List) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Recent Meetings Card */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Recent Meetings</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Latest recorded intelligence</p>
            </div>
            <button 
              onClick={() => navigate('/meetings')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All <ArrowRight style={{ width: '12px', height: '12px' }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {meetings.slice(0, 4).map((meeting, index) => (
              <div 
                key={meeting.id || index}
                onClick={() => navigate(`/meetings/${meeting.id}`)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  border: '1px solid #f1f5f9', 
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', backgroundColor: meeting.source === 'voice' ? '#fee2e2' : '#e0e7ff', color: meeting.source === 'voice' ? '#ef4444' : '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {meeting.source === 'voice' ? <Mic style={{ width: '18px', height: '18px' }} /> : <Video style={{ width: '18px', height: '18px' }} />}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', lineHeight: '1.3' }}>
                      {meeting.title || 'Untitled Meeting'}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                      {meeting.date || meeting.meeting_date || 'Today'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
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
                  <ChevronRight style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                </div>
              </div>
            ))}

            {meetings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                <FileText style={{ width: '32px', height: '32px', color: '#cbd5e1', margin: '0 auto 0.5rem auto' }} />
                <p style={{ fontSize: '0.875rem' }}>No meetings recorded yet.</p>
                <button onClick={() => navigate('/voice-meeting')} style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}>
                  + Start your first Voice Meeting
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines Card */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Upcoming Deadlines</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Tasks requiring immediate action</p>
            </div>
            <button 
              onClick={() => navigate('/tasks')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All <ArrowRight style={{ width: '12px', height: '12px' }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingDeadlines.map((item, index) => {
              const due = item.dueDate || item.due_date;
              const isOverdue = due && due !== 'No Deadline' && due !== 'null' && due !== '-' && new Date(due) < new Date();

              return (
                <div 
                  key={item.id || index}
                  onClick={() => navigate('/tasks')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem', 
                    border: '1px solid #f1f5f9', 
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <div 
                      style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.task}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                        Assigned to: <strong style={{ color: '#334155' }}>{getDisplayAssignee(item)}</strong>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      padding: '0.125rem 0.5rem', 
                      borderRadius: '9999px', 
                      backgroundColor: isOverdue ? '#fee2e2' : '#f1f5f9', 
                      color: isOverdue ? '#dc2626' : '#475569' 
                    }}>
                      {due && due !== 'No Deadline' && due !== 'null' && due !== '-' ? due : 'No Due Date'}
                    </span>
                  </div>
                </div>
              );
            })}

            {upcomingDeadlines.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                <CheckCircle style={{ width: '32px', height: '32px', color: '#cbd5e1', margin: '0 auto 0.5rem auto' }} />
                <p style={{ fontSize: '0.875rem' }}>All caught up! No pending deadlines.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

