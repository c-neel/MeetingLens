import React, { useState, useEffect } from 'react';
import { getActionItems, updateActionItem } from '../services/api';
import { Calendar, AlertCircle, Search, User, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Tasks() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('for_me'); // 'for_me' or 'delegated'
  const [isSyncing, setIsSyncing] = useState(false);
  const [priorityOverrides, setPriorityOverrides] = useState({}); // { [taskId]: 'High'|'Medium'|'Low' }
  const navigate = useNavigate();

  const handleApproveTask = (task) => {
    navigate(`/tasks/approve/${task.id}`, {
      state: {
        from: 'tasks',
        returnUrl: '/tasks'
      }
    });
  };

  const handleTaskApproved = (updatedTask) => {
    setItems(prev => prev.map(item =>
      item.id === updatedTask.id || item.task === updatedTask.task
        ? { ...item, ...updatedTask }
        : item
    ));
  };

  // Get logged in user details from localStorage
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserName = savedUser.name || 'Amit Shah';
  const userFirstName = currentUserName.split(' ')[0] || 'Amit';

  // Real-time synchronization polling
  useEffect(() => {
    const fetchTasks = () => {
      setIsSyncing(true);
      getActionItems().then(data => {
        setItems(data);
        setIsSyncing(false);
      }).catch(() => setIsSyncing(false));
    };

    fetchTasks();

    // Poll every 3 seconds for real-time status updates across users
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  const filters = ['All', 'Pending', 'In Progress', 'Completed', 'Overdue'];

  const formatTaskDueDate = (item) => {
    const due = item?.dueDate || item?.due_date;
    if (!due || due === 'null' || due === '-' || due === 'No Deadline') return 'No Deadline';
    return due;
  };

  // Auto-compute priority from due date: <=2 days = High, <=7 days = Medium, else Low
  const computePriorityFromDueDate = (item) => {
    const due = item.dueDate || item.due_date;
    if (!due || due === 'null' || due === '-' || due === 'No Deadline') return item.priority || 'Medium';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(due);
    dueDate.setHours(0, 0, 0, 0);
    if (isNaN(dueDate.getTime())) return item.priority || 'Medium';
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return 'High';    // Due within 2 days or overdue
    if (diffDays <= 7) return 'Medium';  // Due within a week
    return 'Low';                        // Due later than a week
  };

  // Get effective priority: manual override > auto-computed from due date
  const getEffectivePriority = (item) => {
    if (priorityOverrides[item.id]) return priorityOverrides[item.id];
    return computePriorityFromDueDate(item);
  };

  // Priority sort weight (Higher priority = higher weight = appears first)
  const priorityWeight = (p) => {
    if (p === 'High') return 3;
    if (p === 'Medium') return 2;
    return 1;
  };

  const isOverdue = (item) => {
    const due = item.dueDate || item.due_date;
    if (!due || due === 'null' || due === '-' || due === 'No Deadline' || item.status === 'Completed') return false;
    const d = new Date(due);
    if (isNaN(d.getTime())) return false;
    return d < new Date();
  };

  const isMyTask = (item) => {
    if (!item.assignee) return false;
    const assignee = item.assignee.toLowerCase();
    const full = currentUserName.toLowerCase();
    const first = userFirstName.toLowerCase();
    return assignee.includes(full) || assignee.includes(first) || full.includes(assignee);
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

  // Get unique list of assignees for dropdown filter (normalized to avoid duplicates like 'Amit' & 'Amit Shah')
  const uniqueAssignees = Array.from(
    new Set(items.map(i => (isMyTask(i) ? currentUserName : i.assignee)).filter(Boolean))
  );

  const filtered = items.filter(item => {
    // 1. Tab filter
    if (activeTab === 'for_me') {
      if (!isMyTask(item)) return false;
    } else if (activeTab === 'delegated') {
      // Delegated by me: Meeting created by me, but assigned to someone else
      if (parseInt(item.meeting_owner_id) !== parseInt(savedUser.id)) return false;
      if (isMyTask(item)) return false;
    }

    // 2. Specific assignee filter dropdown
    if (assigneeFilter !== 'All') {
      if (assigneeFilter === 'My Tasks' && !isMyTask(item)) return false;
      if (assigneeFilter !== 'My Tasks') {
        const displayed = getDisplayAssignee(item);
        if (displayed !== assigneeFilter && item.assignee !== assigneeFilter) return false;
      }
    }

    // 3. Search term filter
    const matchesSearch =
      (item.task || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.assignee || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.meeting_title || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 4. Status filter
    if (filter === 'All') return true;
    if (filter === 'Overdue') return isOverdue(item);
    return item.status === filter;
  });

  const myTaskCount = items.filter(isMyTask).length;

  const updateStatus = (id, newStatus) => {
    // Optimistic UI update
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: newStatus } : item
    ));
    // Persist to backend database
    updateActionItem(id, { status: newStatus });
  };

  const updatePriority = (id, newPriority) => {
    // Store as a manual override
    setPriorityOverrides(prev => ({ ...prev, [id]: newPriority }));
    // Optimistic UI update
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, priority: newPriority } : item
    ));
    // Persist to backend database
    updateActionItem(id, { status: items.find(i => i.id === id)?.status || 'Pending', priority: newPriority });
  };

  // Sort filtered items by priority descending (High → Medium → Low)
  const sortedFiltered = [...filtered].sort((a, b) => {
    return priorityWeight(getEffectivePriority(b)) - priorityWeight(getEffectivePriority(a));
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>Task Management</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
            ({filtered.length} task{filtered.length !== 1 ? 's' : ''})
          </span>
          <span className="badge badge-success" style={{ fontSize: '0.6875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            Real-Time Sync Active
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--border)', padding: '0.25rem', borderRadius: '0.5rem', gap: '0.25rem' }}>
            <button
              className={`btn ${activeTab === 'for_me' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('for_me')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
            >
              <User className="w-4 h-4" /> Tasks for Me
            </button>
            <button
              className={`btn ${activeTab === 'delegated' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('delegated')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
            >
              <Send className="w-4 h-4" /> Delegated By Me
            </button>
        </div>
      </div>

      {/* Filter, Assignee Dropdown, and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        {activeTab === 'for_me' && (
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {filters.map(f => {
              const myTasks = items.filter(isMyTask);
              const count = f === 'All' ? myTasks.length : myTasks.filter(i => (f === 'Overdue' ? isOverdue(i) : i.status === f)).length;
              return (
                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f} {f !== 'All' && <span style={{ marginLeft: '0.25rem', opacity: 0.8 }}>({count})</span>}
                </button>
              );
            })}
          </div>
        )}

          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px', maxWidth: '100%' }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.25rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '0.875rem',
                background: 'white'
              }}
            />
          </div>
        </div>
      </div>

      
        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks found</h3>
              <p>
                {activeTab === 'for_me'
                  ? `No tasks currently assigned to ${currentUserName}.`
                  : activeTab === 'delegated'
                  ? 'No tasks delegated by you yet.'
                  : searchTerm
                  ? `No tasks match "${searchTerm}".`
                  : 'Tasks matching this filter will appear here.'}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    {activeTab === 'for_me' && <th>Priority</th>}
                    {activeTab === 'for_me' && <th>Status</th>}

                    {activeTab === 'for_me' && <th>Source</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map(item => {
                    const myTask = isMyTask(item);
                    const effectivePriority = getEffectivePriority(item);
                    const priorityColors = { High: { border: '#ef4444', bg: '#fef2f2', color: '#dc2626' }, Medium: { border: '#f59e0b', bg: '#fffbeb', color: '#d97706' }, Low: { border: '#6b7280', bg: '#f9fafb', color: '#6b7280' } };
                    const pc = priorityColors[effectivePriority] || priorityColors.Medium;
                    return (
                      <tr key={item.id} style={{ background: myTask ? 'rgba(56, 189, 248, 0.04)' : 'transparent' }}>
                        <td style={{ fontWeight: 500 }}>
                          {item.task}
                          {myTask && (
                            <span className="badge badge-primary" style={{ marginLeft: '0.5rem', fontSize: '0.6875rem' }}>
                              You
                            </span>
                          )}
                        </td>
                        <td>{getDisplayAssignee(item)}</td>
                        <td style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}>
                            {isOverdue(item) && <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#dc2626' }} title="Overdue Task" />}
                            <span style={{ whiteSpace: 'nowrap', fontWeight: 500, color: '#334155' }}>
                              {formatTaskDueDate(item)}
                            </span>
                          </div>
                        </td>
                        {activeTab === 'for_me' && (
                          <td>
                            <select
                              value={effectivePriority}
                              onChange={e => updatePriority(item.id, e.target.value)}
                              style={{
                                border: `1.5px solid ${pc.border}`,
                                borderRadius: '4px',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                background: pc.bg,
                                fontWeight: 600,
                                color: pc.color,
                                cursor: 'pointer'
                              }}
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </td>
                        )}
                        {activeTab === 'for_me' && (
                          <td>
                            {myTask ? (
                              <select
                                value={item.status}
                                onChange={e => updateStatus(item.id, e.target.value)}
                                style={{
                                  border: '1.5px solid var(--primary)',
                                  borderRadius: '4px',
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.75rem',
                                  background: '#f0f9ff',
                                  fontWeight: 500,
                                  color: '#0369a1',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            ) : (
                              <span
                                className={`badge badge-${item.status === 'Completed' ? 'success' : item.status === 'In Progress' ? 'info' : 'warning'}`}
                                title={`Only ${item.assignee} can update this status`}
                                style={{ opacity: 0.85, cursor: 'not-allowed' }}
                              >
                                {item.status}
                              </span>
                            )}
                          </td>
                        )}

                        {activeTab === 'for_me' && (
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.meeting_title || 'Meeting'}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
