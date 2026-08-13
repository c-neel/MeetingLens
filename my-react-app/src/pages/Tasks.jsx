import React, { useState, useEffect } from 'react';
import { getActionItems, updateActionItem } from '../services/api';
import { List, Columns, Calendar, AlertCircle, Search, User, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Tasks() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('for_me'); // 'for_me' or 'delegated'
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const handleApproveTask = (task) => {
    navigate(`/tasks/approve/${task.id}`);
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

  const isOverdue = (item) => {
    const due = item.dueDate || item.due_date;
    if (!due || item.status === 'Completed') return false;
    return new Date(due) < new Date();
  };

  const isMyTask = (item) => {
    if (!item.assignee) return false;
    const assignee = item.assignee.toLowerCase();
    const full = currentUserName.toLowerCase();
    const first = userFirstName.toLowerCase();
    return assignee.includes(full) || assignee.includes(first) || full.includes(assignee);
  };

  // Get unique list of assignees for dropdown filter
  const uniqueAssignees = Array.from(new Set(items.map(i => i.assignee).filter(Boolean)));

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
      if (assigneeFilter !== 'My Tasks' && item.assignee !== assigneeFilter) return false;
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
          
          <button className={`btn ${view === 'list' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('list')}>
            <List className="w-4 h-4" /> List
          </button>
          <button className={`btn ${view === 'kanban' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('kanban')}>
            <Columns className="w-4 h-4" /> Kanban
          </button>
        </div>
      </div>

      {/* Filter, Assignee Dropdown, and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        {activeTab === 'for_me' && (
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {filters.map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f} {f !== 'All' && <span style={{ marginLeft: '0.25rem', opacity: 0.8 }}>({items.filter(i => (f === 'Overdue' ? isOverdue(i) : i.status === f)).length})</span>}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Assignee Filter Dropdown */}
          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '0.875rem',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="All">All Assignees</option>
            <option value="My Tasks">👤 My Tasks ({currentUserName})</option>
            {uniqueAssignees.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

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

      {view === 'list' && (
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
                    {activeTab === 'for_me' && <th>Confidence</th>}
                    {activeTab === 'for_me' && <th>Source</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const myTask = isMyTask(item);
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
                        <td>{item.assignee}</td>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {isOverdue(item) && <AlertCircle className="w-3 h-3" style={{ color: 'var(--danger)' }} />}
                          <span style={{ color: isOverdue(item) ? 'var(--danger)' : 'inherit' }}>{item.dueDate || item.due_date}</span>
                        </td>
                        {activeTab === 'for_me' && (
                          <td><span className={`badge badge-${item.priority === 'High' ? 'danger' : item.priority === 'Medium' ? 'warning' : 'neutral'}`}>{item.priority}</span></td>
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
                          <td>
                            <div className="confidence-bar">
                              <div className="confidence-track"><div className="confidence-fill" style={{ width: `${item.confidence || 90}%` }}></div></div>
                              {item.confidence || 90}%
                            </div>
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
      )}

      {view === 'kanban' && (
        <div className="kanban-board">
          {['Pending', 'In Progress', 'Completed', 'Overdue'].map(col => {
            const colItems = filtered.filter(item => {
              if (col === 'Overdue') return isOverdue(item);
              if (col === 'Pending') return item.status === 'Pending' && !isOverdue(item);
              return item.status === col;
            });
            return (
              <div className="kanban-column" key={col}>
                <div className="kanban-column-header">
                  <span>{col}</span>
                  <span className="kanban-count">{colItems.length}</span>
                </div>
                {colItems.map(item => {
                  const myTask = isMyTask(item);
                  return (
                    <div className="kanban-card" key={item.id} style={{ borderLeft: myTask ? '3px solid var(--primary)' : 'none' }}>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span>{item.task}</span>
                        {myTask && <span className="badge badge-primary" style={{ fontSize: '0.625rem' }}>You</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>{item.assignee}</span>
                        <span className={`badge badge-${item.priority === 'High' ? 'danger' : 'warning'}`}>{item.priority}</span>
                      </div>
                      
                      <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar className="w-3 h-3" /> {item.dueDate || item.due_date}
                        </div>
                        {myTask && (
                          <select
                            value={item.status}
                            onChange={e => updateStatus(item.id, e.target.value)}
                            style={{
                              fontSize: '0.6875rem',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              border: '1px solid var(--primary)',
                              background: '#f0f9ff',
                              color: '#0369a1',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
                {colItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-light)' }}>No tasks</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
