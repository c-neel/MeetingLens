import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Mail, Calendar, CheckCircle, Clock, User, AlertCircle, Sparkles, Send, ExternalLink, ArrowLeft } from 'lucide-react';
import { buildGoogleCalendarUrl } from '../utils/calendar';
import { sendTaskEmailNotification, updateActionItem, getActionItems, getMeetings } from '../services/api';

const KNOWN_TEAM_MEMBERS = [
  { name: 'Amit Shah', email: 'amit.shah@example.com' },
  { name: 'Priya Patel', email: 'priya.patel@example.com' },
  { name: 'Rahul Sharma', email: 'rahul.sharma@example.com' },
  { name: 'Sneha Gupta', email: 'sneha.gupta@example.com' },
  { name: 'Vikram Singh', email: 'vikram.singh@example.com' }
];

export default function TaskApproval() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [assigneeName, setAssigneeName] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Fetch task on mount
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const tasks = await getActionItems();
        const foundTask = tasks.find(t => t.id === parseInt(id));
        if (foundTask) {
          setTask(foundTask);
          setAssigneeName(foundTask.assignee || '');
          setDueDate(foundTask.dueDate || foundTask.due_date || new Date().toISOString().split('T')[0]);
          setPriority(foundTask.priority || 'Medium');
          
          if (foundTask.assignee) {
            const match = KNOWN_TEAM_MEMBERS.find(m => m.name.toLowerCase().includes(foundTask.assignee.toLowerCase()));
            if (match) {
              setAssigneeEmail(match.email);
            } else {
              setAssigneeEmail(`${foundTask.assignee.toLowerCase().replace(/\s+/g, '.')}@company.com`);
            }
          }

          // Fetch meeting details for context if meeting_id exists
          if (foundTask.meeting_id) {
            const meetings = await getMeetings();
            const foundMeeting = meetings.find(m => m.id === foundTask.meeting_id);
            if (foundMeeting) setMeeting(foundMeeting);
          }
        } else {
          setError('Task not found.');
        }
      } catch (err) {
        setError('Failed to load task details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskDetails();
  }, [id]);

  const handleTeamMemberSelect = (member) => {
    setAssigneeName(member.name);
    setAssigneeEmail(member.email);
  };

  const handleApproveAndSendEmail = async (e) => {
    if (e) e.preventDefault();
    if (!assigneeName.trim() || !assigneeEmail.trim()) {
      alert('Please specify the assignee name and valid email ID.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const payload = {
      recipient_name: assigneeName.trim(),
      recipient_email: assigneeEmail.trim(),
      task_name: task.task,
      due_date: dueDate,
      due_time: dueTime,
      priority: priority,
      meeting_id: meeting?.id || task.meeting_id || 1,
      meeting_title: meeting?.title || task.meeting_title || 'Meeting Action Item',
      executive_summary: meeting?.executive_summary || meeting?.summary || 'Assigned task details from recent meeting.'
    };

    try {
      const res = await sendTaskEmailNotification(payload);

      if (task.id) {
        await updateActionItem(task.id, {
          status: 'In Progress',
          assignee: assigneeName.trim(),
          due_date: dueDate
        });
      }

      setStatusMessage({
        type: 'success',
        text: `✓ Task Approved! Notification email & MOM report dispatched to ${assigneeEmail}. Redirecting...`
      });

      setTimeout(() => {
        navigate('/tasks');
      }, 1800);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to dispatch email. Please check network connection.'
      });
      setIsSubmitting(false);
    }
  };

  const handleOpenGoogleCalendar = () => {
    const url = buildGoogleCalendarUrl({
      title: `[Task] ${task.task}`,
      description: `Assigned Task: ${task.task}\nAssignee: ${assigneeName} (${assigneeEmail})\nMeeting: ${meeting?.title || task.meeting_title || 'Meeting'}\nNotes: ${notes}`,
      startDate: dueDate,
      startTime: dueTime,
      guestEmail: assigneeEmail
    });
    window.open(url, '_blank');
  };



  if (loading) return <div className="card" style={{ padding: '3rem', margin: '2rem auto', maxWidth: '600px', textAlign: 'center' }}>Loading task details...</div>;
  if (error) return <div className="card" style={{ padding: '3rem', margin: '2rem auto', maxWidth: '600px', textAlign: 'center', color: 'red' }}>{error}</div>;
  if (!task) return null;

  return (
    <div className="animate-fadeIn">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate(task.meeting_id ? `/meetings/${task.meeting_id}` : '/tasks')} style={{ padding: '0.5rem' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span>Approve & Delegate Task</span>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem' }}>
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <span className="badge badge-primary" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle className="w-3.5 h-3.5" /> Task Delegation & Notification Workflow
          </span>
          <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 700 }}>Finalize Task Assignment</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Review the task details, select an assignee, and automatically dispatch a notification email with the Meeting Minutes.
          </p>
        </div>

        {/* Task Name Box */}
        <div style={{ padding: '1.25rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Description</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0c4a6e', marginTop: '0.375rem' }}>{task.task}</div>
          {task.meeting_title && (
            <div style={{ fontSize: '0.8125rem', color: '#0284c7', marginTop: '0.375rem' }}>Source Meeting: {task.meeting_title}</div>
          )}
        </div>

        {statusMessage && (
          <div style={{
            padding: '1rem',
            borderRadius: '6px',
            background: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${statusMessage.type === 'success' ? '#86efac' : '#fca5a5'}`,
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            fontWeight: 500
          }}>
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleApproveAndSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Assignee Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                Assignee Full Name *
              </label>
              <input
                type="text"
                className="form-input"
                value={assigneeName}
                onChange={e => setAssigneeName(e.target.value)}
                placeholder="e.g. Priya Patel"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                Assignee Email ID *
              </label>
              <input
                type="email"
                className="form-input"
                value={assigneeEmail}
                onChange={e => setAssigneeEmail(e.target.value)}
                placeholder="priya.patel@company.com"
                required
              />
            </div>
          </div>

          {/* Date, Time & Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                Deadline Date *
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                Deadline Time *
              </label>
              <input
                type="time"
                className="form-input"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                Priority
              </label>
              <select
                className="form-input"
                value={priority}
                onChange={e => setPriority(e.target.value)}
                style={{ background: 'white' }}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Calendar Actions Bar */}
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>📅 Calendar Integration:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleOpenGoogleCalendar}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <ExternalLink className="w-4 h-4 text-primary" /> Add to Google Calendar
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate(task.meeting_id ? `/meetings/${task.meeting_id}` : '/tasks')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
              <Send className="w-5 h-5" /> {isSubmitting ? 'Sending...' : 'Approve & Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
