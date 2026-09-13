import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
  const [task, setTask] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [assigneeName, setAssigneeName] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Fetch task on mount — or use data passed from voice meeting via navigation state
  useEffect(() => {
    // If coming from voice meeting, use task data from navigation state (no DB save happened yet)
    const voiceTaskData = location.state?.voiceTaskData;
    if (voiceTaskData) {
      const taskFromState = {
        ...voiceTaskData,
        id: null, // Not saved to DB yet
      };
      setTask(taskFromState);
      const rawAssignee = taskFromState.assignee ? String(taskFromState.assignee).trim() : '';
      const isPlaceholder = !rawAssignee || ['unassigned', 'none', 'not specified', '-'].includes(rawAssignee.toLowerCase());
      setAssigneeName(isPlaceholder ? '' : rawAssignee);
      const rawDate = taskFromState.dueDate || taskFromState.due_date;
      setDueDate(rawDate && rawDate !== 'No Deadline' && rawDate !== 'null' && rawDate !== '-' ? rawDate : '');
      setPriority(taskFromState.priority || 'Medium');

      if (!isPlaceholder && rawAssignee) {
        const match = KNOWN_TEAM_MEMBERS.find(m => m.name.toLowerCase().includes(rawAssignee.toLowerCase()));
        if (match) {
          setAssigneeEmail(match.email);
        } else {
          setAssigneeEmail(`${rawAssignee.toLowerCase().replace(/\s+/g, '.')}@company.com`);
        }
      }

      // Use meeting context from voice meeting
      const ctx = location.state?.voiceMeetingContext;
      if (ctx) {
        setMeeting({
          title: ctx.title,
          executive_summary: ctx.executive_summary
        });
      }

      setLoading(false);
      return;
    }

    // Standard DB fetch for non-voice-meeting flows
    const fetchTaskDetails = async () => {
      try {
        const tasks = await getActionItems();
        const foundTask = tasks.find(t => t.id === parseInt(id));
        if (foundTask) {
          setTask(foundTask);
          // Only pre-fill assignee if it's a real name (not a placeholder)
          const rawAssignee = foundTask.assignee ? String(foundTask.assignee).trim() : '';
          const isPlaceholder = !rawAssignee || ['unassigned', 'none', 'not specified', '-'].includes(rawAssignee.toLowerCase());
          setAssigneeName(isPlaceholder ? '' : rawAssignee);
          const rawDate = foundTask.dueDate || foundTask.due_date;
          setDueDate(rawDate && rawDate !== 'No Deadline' && rawDate !== 'null' && rawDate !== '-' ? rawDate : '');
          setPriority(foundTask.priority || 'Medium');
          
          if (!isPlaceholder && rawAssignee) {
            const match = KNOWN_TEAM_MEMBERS.find(m => m.name.toLowerCase().includes(rawAssignee.toLowerCase()));
            if (match) {
              setAssigneeEmail(match.email);
            } else {
              setAssigneeEmail(`${rawAssignee.toLowerCase().replace(/\s+/g, '.')}@company.com`);
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
      const res = await sendTaskEmailNotification(payload);

      if (task.id) {
        await updateActionItem(task.id, {
          status: 'In Progress',
          assignee: assigneeName.trim(),
          due_date: finalDueDate
        });
      }

      // Update active draft in sessionStorage so the Analyze File review page immediately shows the assigned person
      try {
        const draftStr = sessionStorage.getItem('meetai_analysis_draft');
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          if (draft && draft.editedTasks) {
            const updatedTasks = draft.editedTasks.map(t => {
              if (t.task === task.task || t.id === task.id) {
                return {
                  ...t,
                  assignee: assigneeName.trim(),
                  dueDate: finalDueDate,
                  due_date: finalDueDate,
                  status: 'In Progress'
                };
              }
              return t;
            });
            sessionStorage.setItem('meetai_analysis_draft', JSON.stringify({
              ...draft,
              editedTasks: updatedTasks
            }));
          }
        }
      } catch (e) {
        console.error('Failed to sync draft in sessionStorage', e);
      }

      // Also sync voice meeting draft if present
      try {
        const voiceDraftStr = sessionStorage.getItem('meetai_voice_draft');
        if (voiceDraftStr) {
          const voiceDraft = JSON.parse(voiceDraftStr);
          if (voiceDraft && voiceDraft.editedTasks) {
            const updatedTasks = voiceDraft.editedTasks.map(t => {
              if (t.task === task.task || t.id === task.id) {
                return {
                  ...t,
                  assignee: assigneeName.trim(),
                  dueDate: finalDueDate,
                  due_date: finalDueDate,
                  status: 'In Progress'
                };
              }
              return t;
            });
            sessionStorage.setItem('meetai_voice_draft', JSON.stringify({
              ...voiceDraft,
              editedTasks: updatedTasks
            }));
          }
        }
      } catch (e) {
        console.error('Failed to sync voice draft in sessionStorage', e);
      }

      setStatusMessage({
        type: 'success',
        text: res?.message ? `✓ ${res.message}` : `✓ Task Delegated! Notification email dispatched to ${assigneeEmail}. Returning to review...`
      });

      setTimeout(() => {
        handleReturn();
      }, 1400);
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

  const handleReturn = () => {
    // 1. If user came from voice meeting, navigate back to /voice-meeting (draft will be restored)
    if (location.state?.from === 'voice-meeting' || sessionStorage.getItem('meetai_voice_draft')) {
      navigate('/voice-meeting');
      return;
    }

    // 2. If explicit returnUrl provided in navigation state (e.g. /analyze#tasks-review-section)
    if (location.state?.returnUrl) {
      navigate(location.state.returnUrl, { 
        state: { 
          scrollTo: 'tasks', 
          meetingId: task?.meeting_id || location.state?.meetingId 
        } 
      });
      return;
    }

    // 3. If user came from analyze page or has an active analysis draft
    const hasAnalysisDraft = sessionStorage.getItem('meetai_analysis_draft');
    const meetingId = task?.meeting_id || location.state?.meetingId;

    if (location.state?.from === 'analyze' || hasAnalysisDraft) {
      navigate(meetingId ? `/analyze?meetingId=${meetingId}#tasks-review-section` : '/analyze#tasks-review-section', {
        state: { scrollTo: 'tasks', meetingId }
      });
      return;
    }

    // 4. If there is a meeting associated with this task, redirect to the AI Generated Tasks / review section
    if (meetingId) {
      navigate(`/analyze?meetingId=${meetingId}#tasks-review-section`, {
        state: { scrollTo: 'tasks', meetingId }
      });
      return;
    }

    // 5. Fallback to tasks list
    navigate('/tasks');
  };

  const handleCancel = handleReturn;

  if (loading) return <div className="card" style={{ padding: '3rem', margin: '2rem auto', maxWidth: '600px', textAlign: 'center' }}>Loading task details...</div>;
  if (error) return <div className="card" style={{ padding: '3rem', margin: '2rem auto', maxWidth: '600px', textAlign: 'center', color: 'red' }}>{error}</div>;
  if (!task) return null;

  return (
    <div className="animate-fadeIn">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-ghost" onClick={handleCancel} style={{ padding: '0.5rem' }}>
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
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

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline btn-lg" onClick={handleCancel}>
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
