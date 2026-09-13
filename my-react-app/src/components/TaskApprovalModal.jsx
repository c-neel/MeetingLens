import React, { useState, useEffect } from 'react';
import { X, Mail, Calendar, Download, CheckCircle, Clock, User, AlertCircle, Sparkles, Send, ExternalLink } from 'lucide-react';
import { buildGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { sendTaskEmailNotification, updateActionItem } from '../services/api';

const KNOWN_TEAM_MEMBERS = [
  { name: 'Amit Shah', email: 'amit.shah@example.com' },
  { name: 'Priya Patel', email: 'priya.patel@example.com' },
  { name: 'Rahul Sharma', email: 'rahul.sharma@example.com' },
  { name: 'Sneha Gupta', email: 'sneha.gupta@example.com' },
  { name: 'Vikram Singh', email: 'vikram.singh@example.com' }
];

export default function TaskApprovalModal({ task, meeting, isOpen, onClose, onApproved }) {
  const getInitialDueDate = (t) => {
    const raw = t?.dueDate || t?.due_date;
    return raw && raw !== 'No Deadline' && raw !== 'null' && raw !== '-' ? raw : '';
  };

  const [assigneeName, setAssigneeName] = useState(task?.assignee || '');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [dueDate, setDueDate] = useState(getInitialDueDate(task));
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Sync state when task changes
  useEffect(() => {
    if (task && isOpen) {
      setAssigneeName(task.assignee || '');
      setDueDate(getInitialDueDate(task));
      setPriority(task.priority || 'Medium');
      setStatusMessage(null);
      setNotes('');
      
      // Auto-suggest email based on assignee name
      if (task.assignee) {
        const match = KNOWN_TEAM_MEMBERS.find(m => m.name.toLowerCase().includes(task.assignee.toLowerCase()));
        if (match) {
          setAssigneeEmail(match.email);
        } else {
          setAssigneeEmail(`${task.assignee.toLowerCase().replace(/\s+/g, '.')}@company.com`);
        }
      } else {
        setAssigneeEmail('');
      }
    }
  }, [task, isOpen]);

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

    const finalDueDate = dueDate && dueDate.trim() ? dueDate.trim() : 'No Deadline';

    const payload = {
      recipient_name: assigneeName.trim(),
      recipient_email: assigneeEmail.trim(),
      task_name: task.task,
      due_date: finalDueDate,
      due_time: dueTime,
      priority: priority,
      meeting_id: meeting?.id || task.meeting_id || 1,
      meeting_title: meeting?.title || task.meeting_title || 'Meeting Action Item',
      executive_summary: meeting?.executive_summary || meeting?.summary || 'Assigned task details from recent meeting.'
    };

    try {
      // 1. Dispatch Email & MOM attachment via backend API
      const res = await sendTaskEmailNotification(payload);

      // 2. Update Task Status in Database
      if (task.id) {
        await updateActionItem(task.id, {
          status: 'In Progress',
          assignee: assigneeName.trim(),
          due_date: finalDueDate
        });
      }

      setStatusMessage({
        type: 'success',
        text: res?.message ? `✓ ${res.message}` : `✓ Task Approved! Notification email & MOM report dispatched to ${assigneeEmail}.`
      });

      setTimeout(() => {
        if (onApproved) {
          onApproved({
            ...task,
            assignee: assigneeName.trim(),
            dueDate: finalDueDate,
            due_date: finalDueDate,
            priority: priority,
            status: 'In Progress'
          });
        }
        setIsSubmitting(false);
        onClose();
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

  const handleDownloadIcs = () => {
    downloadIcsFile({
      title: `[Task] ${task.task}`,
      description: `Assigned Task: ${task.task}\nAssignee: ${assigneeName}\nMeeting: ${meeting?.title || task.meeting_title || 'Meeting'}`,
      startDate: dueDate,
      startTime: dueTime,
      guestEmail: assigneeEmail
    });
  };

  if (!isOpen || !task) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.75rem',
        maxWidth: '560px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle className="w-3.5 h-3.5" /> Task Delegation & Notification Workflow
            </span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.15rem', fontWeight: 700 }}>Approve & Assign Task</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Name Box */}
        <div style={{ padding: '0.875rem 1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Description</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0c4a6e', marginTop: '0.25rem' }}>{task.task}</div>
          {task.meeting_title && (
            <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.25rem' }}>Source Meeting: {task.meeting_title}</div>
          )}
        </div>

        {statusMessage && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            background: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${statusMessage.type === 'success' ? '#86efac' : '#fca5a5'}`,
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            fontWeight: 500
          }}>
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleApproveAndSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Quick Team Member Pickers */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
              Quick Select Assignee:
            </label>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {KNOWN_TEAM_MEMBERS.map(m => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => handleTeamMemberSelect(m)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    borderRadius: '9999px',
                    border: assigneeName === m.name ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: assigneeName === m.name ? '#e0f2fe' : '#f8fafc',
                    color: assigneeName === m.name ? '#0369a1' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: assigneeName === m.name ? 600 : 400
                  }}
                >
                  👤 {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
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
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                Deadline Date (Optional)
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                Deadline Time (Optional)
              </label>
              <input
                type="time"
                className="form-input"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
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

          {/* Modal Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Send className="w-4 h-4" /> {isSubmitting ? 'Sending...' : 'Approve & Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
