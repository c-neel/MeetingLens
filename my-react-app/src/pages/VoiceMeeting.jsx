import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Pause, Play, Download, ArrowRight, Loader2, CheckCircle2, Check, X, User, UserCheck, Calendar } from 'lucide-react';
import { processTranscript, saveMeeting } from '../services/api';

export default function VoiceMeeting() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, recording, paused, processing, results
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [results, setResults] = useState(null);
  const [processStep, setProcessStep] = useState(0);
  const [taskStatusMap, setTaskStatusMap] = useState({});
  const [editedTasks, setEditedTasks] = useState([]);

  // Modal prompt state for "For Me" self-assignment
  const [assignModalTaskIdx, setAssignModalTaskIdx] = useState(null);
  const [assignModalName, setAssignModalName] = useState('');
  const [assignModalDueDate, setAssignModalDueDate] = useState('');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Helper to save current voice meeting draft to sessionStorage
  const saveVoiceDraft = (overrides = {}) => {
    try {
      const draft = {
        title,
        participants,
        seconds,
        transcript,
        results,
        taskStatusMap,
        editedTasks,
        ...overrides
      };
      sessionStorage.setItem('meetai_voice_draft', JSON.stringify(draft));
    } catch (e) {
      console.error('Failed to save voice draft', e);
    }
  };

  const clearVoiceDraft = () => {
    sessionStorage.removeItem('meetai_voice_draft');
  };

  const steps = [
    'Finalizing transcript...',
    'Understanding context...',
    'Generating summary...',
    'Extracting decisions...',
    'Finding action items...',
    'Analyzing risks...',
    'Generating recommendations...',
    'Preparing results...'
  ];

  // Restore draft from sessionStorage on mount (e.g. returning from TaskApproval)
  useEffect(() => {
    const draftStr = sessionStorage.getItem('meetai_voice_draft');
    if (draftStr && status === 'idle') {
      try {
        const draft = JSON.parse(draftStr);
        if (draft && draft.results) {
          setTitle(draft.title || '');
          setParticipants(draft.participants || '');
          setSeconds(draft.seconds || 0);
          setTranscript(draft.transcript || '');
          setResults(draft.results);
          setTaskStatusMap(draft.taskStatusMap || {});
          setEditedTasks(draft.editedTasks || []);
          setStatus('results');
        }
      } catch (e) {
        console.error('Failed to restore voice draft', e);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserName = savedUser.name || 'Amit Shah';
  const userFirstName = currentUserName.split(' ')[0] || 'Amit';

  const isTaskAssignedToMe = (item) => {
    if (!item || !item.assignee) return false;
    const a = String(item.assignee).trim();
    if (a === '-' || a.toLowerCase() === 'unassigned' || a.toLowerCase() === 'none' || a.toLowerCase() === 'not specified') {
      return false;
    }
    const full = currentUserName.toLowerCase();
    const first = userFirstName.toLowerCase();
    const aLower = a.toLowerCase();
    return aLower.includes(full) || aLower.includes(first) || full.includes(aLower);
  };

  const formatTime = (s) => {
    const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
    const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const startRecording = () => {
    if (!title) return alert('Please enter a meeting title.');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + ' ';
        } else {
          interimTranscript += t;
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognition.onend = () => {
      if (status === 'recording') {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    timerRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    setStatus('recording');
  };

  const pauseRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('paused');
  };

  const resumeRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch(e) {}
    }
    timerRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    setStatus('recording');
  };

  const stopRecording = async () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    if (!transcript.trim()) {
      alert('No speech was detected. Please try again.');
      setStatus('idle');
      setSeconds(0);
      return;
    }

    setStatus('processing');

    for (let i = 0; i < steps.length; i++) {
      setProcessStep(i);
      await new Promise(r => setTimeout(r, 400));
    }

    const aiResults = await processTranscript(transcript, title);
    setResults(aiResults);

    const initialMap = {};
    const tasks = (aiResults.actionItems || []).map((t, idx) => {
      initialMap[idx] = 'approved';
      return {
        ...t,
        assignee: t.assignee || '-',
        dueDate: t.dueDate || t.due_date || null,
        due_date: t.dueDate || t.due_date || null
      };
    });
    setTaskStatusMap(initialMap);
    setEditedTasks(tasks);

    setStatus('results');
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTaskEdit = (idx, field, value) => {
    const updated = [...editedTasks];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditedTasks(updated);
  };

  const toggleTaskStatus = (idx, newStatus) => {
    setTaskStatusMap(prev => ({ ...prev, [idx]: newStatus }));
  };

  const handleOpenAssignModal = (idx) => {
    const item = editedTasks[idx];
    const existingDate = item.dueDate || item.due_date;

    setAssignModalTaskIdx(idx);
    setAssignModalName(currentUserName);
    setAssignModalDueDate(existingDate && existingDate !== 'null' && existingDate !== '-' && existingDate !== 'No Deadline' ? existingDate : '');
  };

  const handleConfirmAssignModal = (e) => {
    if (e) e.preventDefault();
    if (assignModalTaskIdx === null) return;

    const idx = assignModalTaskIdx;
    const updated = [...editedTasks];
    const item = updated[idx];
    const finalDueDate = assignModalDueDate.trim() ? assignModalDueDate.trim() : 'No Deadline';

    updated[idx] = {
      ...item,
      assignee: assignModalName.trim() || currentUserName,
      dueDate: finalDueDate,
      due_date: finalDueDate
    };

    const updatedMap = { ...taskStatusMap, [idx]: 'approved' };
    setTaskStatusMap(updatedMap);
    setEditedTasks(updated);

    setAssignModalTaskIdx(null);
  };

  const handleUnassignModalTask = () => {
    if (assignModalTaskIdx === null) return;
    const idx = assignModalTaskIdx;
    const updated = [...editedTasks];
    updated[idx] = {
      ...updated[idx],
      assignee: '-'
    };
    setEditedTasks(updated);
    setAssignModalTaskIdx(null);
  };

  const handleApproveAndDelegate = (idx) => {
    const taskToDelegate = editedTasks[idx];
    const updatedStatusMap = { ...taskStatusMap, [idx]: 'approved' };
    setTaskStatusMap(updatedStatusMap);

    // Save voice meeting draft so we can restore state when returning from TaskApproval
    saveVoiceDraft({
      taskStatusMap: updatedStatusMap,
      editedTasks
    });

    // Navigate to TaskApproval with task data in state — do NOT save the meeting yet.
    // The meeting should only be saved when the user explicitly clicks "Save Meeting".
    navigate('/tasks/approve/voice-draft', {
      state: {
        from: 'voice-meeting',
        returnUrl: '/voice-meeting',
        voiceTaskData: {
          task: taskToDelegate.task,
          assignee: taskToDelegate.assignee || '-',
          dueDate: taskToDelegate.dueDate || taskToDelegate.due_date || null,
          due_date: taskToDelegate.dueDate || taskToDelegate.due_date || null,
          priority: taskToDelegate.priority || 'Medium',
          meeting_title: title
        },
        voiceMeetingContext: {
          title,
          executive_summary: results.executive_summary || results.summary
        }
      }
    });
  };

  const handleSave = async () => {
    const approvedActionItems = editedTasks.filter((_, idx) => taskStatusMap[idx] !== 'rejected');

    const meeting = {
      title,
      date: new Date().toISOString().split('T')[0],
      source: 'voice',
      duration: formatTime(seconds),
      transcript,
      summary: results.summary,
      executive_summary: results.executive_summary,
      detailed_summary: results.detailed_summary,
      decisions: results.decisions,
      actionItems: approvedActionItems,
      quality_score: results.quality_score
    };
    const saved = await saveMeeting(meeting);
    clearVoiceDraft();
    navigate(`/meetings/${saved.id || 1}`);
  };

  // ============ IDLE STATE ============
  if (status === 'idle') {
    return (
      <div>
        <div className="page-title"><span>Start Voice Meeting</span></div>
        <div className="card voice-container" style={{ padding: '2.5rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Mic className="w-8 h-8" style={{ color: 'var(--danger)' }} />
          </div>
          <h2 style={{ fontSize: '1.375rem', marginBottom: '0.5rem' }}>New Voice Meeting</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>Record your meeting and let AI generate minutes, tasks, and insights.</p>
          
          <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label">Meeting Title *</label>
              <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly Standup" />
            </div>
            <div className="form-group">
              <label className="form-label">Participants (optional)</label>
              <input type="text" className="form-input" value={participants} onChange={e => setParticipants(e.target.value)} placeholder="e.g. Amit, Priya, Rahul" />
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem' }} onClick={startRecording}>
            <Mic className="w-5 h-5" /> Start Recording
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '1rem' }}>Uses your browser microphone. Works best in Google Chrome.</p>
        </div>
      </div>
    );
  }

  // ============ RECORDING / PAUSED STATE ============
  if (status === 'recording' || status === 'paused') {
    return (
      <div>
        <div className="page-title"><span>{title}</span></div>
        <div className="card voice-container" style={{ padding: '2.5rem' }}>
          {status === 'recording' && (
            <div className="recording-indicator">
              <span className="recording-dot"></span> RECORDING
            </div>
          )}
          {status === 'paused' && (
            <div className="recording-indicator" style={{ color: 'var(--warning)' }}>
              <Pause className="w-4 h-4" /> PAUSED
            </div>
          )}

          <div className="timer">{formatTime(seconds)}</div>

          <div className="recording-controls">
            {status === 'recording' ? (
              <button className="rec-btn rec-btn-pause" onClick={pauseRecording} title="Pause">
                <Pause className="w-6 h-6" />
              </button>
            ) : (
              <button className="rec-btn rec-btn-start" onClick={resumeRecording} title="Resume">
                <Play className="w-6 h-6" />
              </button>
            )}
            <button className="rec-btn rec-btn-stop" onClick={stopRecording} title="Stop & Process">
              <Square className="w-6 h-6" />
            </button>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div className="section-header">
              <span className="section-title">Live Transcript</span>
              {transcript && (
                <button className="btn btn-ghost btn-sm" onClick={downloadTranscript}>
                  <Download className="w-4 h-4" /> Download
                </button>
              )}
            </div>
            <div className="transcript-live">
              {transcript || 'Speak into your microphone. Transcript will appear here...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ PROCESSING STATE ============
  if (status === 'processing') {
    return (
      <div>
        <div className="page-title"><span>Processing Meeting</span></div>
        <div className="card voice-container" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 className="w-12 h-12 animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI is analyzing your meeting</h3>
          <div className="processing-steps">
            {steps.map((step, i) => (
              <div key={i} className={`process-step ${i === processStep ? 'active' : ''} ${i < processStep ? 'done' : ''}`}>
                {i < processStep ? '✓' : i === processStep ? '●' : '○'} {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ RESULTS STATE ============
  if (status === 'results' && results) {
    return (
      <div>
        <div className="page-title">
          <span>Meeting Analysis Complete</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={downloadTranscript}><Download className="w-4 h-4" /> Transcript</button>
            <button className="btn btn-outline" onClick={handleReset}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Meeting <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Executive Summary</h3>
          <p style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>{results.executive_summary}</p>
        </div>

        <div className="grid-2">
          <div className="card">
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>Key Decisions</h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem' }}>
              {results.decisions.map((d, i) => <li key={i} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>{d}</li>)}
            </ul>
          </div>
          <div className="card">
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>Risks & Concerns</h3>
            {results.risks.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className={`badge badge-${r.severity === 'High' ? 'danger' : 'warning'}`}>{r.severity}</span>
                <span style={{ fontSize: '0.875rem' }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Human-in-the-Loop AI Task Review */}
        <div id="tasks-review-section" style={{ marginBottom: '2rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 className="w-5 h-5" /> Action Items (Review & Approve)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Approve, edit, or reject tasks before saving
            </span>
          </div>

          {editedTasks.length === 0 && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No action items were extracted from this voice meeting.</p>
          )}

          {editedTasks.map((item, idx) => {
            const taskStatus = taskStatusMap[idx] || 'approved';
            const isAssignedToMe = isTaskAssignedToMe(item);
            return (
              <div 
                key={idx} 
                className={`task-review-card ${taskStatus === 'approved' ? 'approved' : taskStatus === 'rejected' ? 'rejected' : ''}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={item.task} 
                      onChange={(e) => handleTaskEdit(idx, 'task', e.target.value)}
                      disabled={taskStatus === 'rejected'}
                      style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9375rem' }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {item.assignee && !['unassigned', 'none', 'not specified', '-', ''].includes(String(item.assignee).trim().toLowerCase()) ? (
                        <span 
                          className={`badge ${isAssignedToMe ? 'badge-primary' : 'badge-neutral'}`}
                          style={{ 
                            fontSize: '0.75rem', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            padding: '0.2rem 0.5rem',
                            backgroundColor: isAssignedToMe ? '#eff6ff' : '#f8fafc',
                            color: isAssignedToMe ? '#2563eb' : '#64748b',
                            border: isAssignedToMe ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                            fontWeight: 500
                          }}
                        >
                          <User className="w-3 h-3" />
                          {isAssignedToMe ? `Assigned to You (${userFirstName})` : `Assignee: ${item.assignee}`}
                        </span>
                      ) : (
                        <span 
                          className="badge badge-neutral"
                          style={{ 
                            fontSize: '0.75rem', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            padding: '0.2rem 0.5rem',
                            backgroundColor: '#f8fafc',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            fontWeight: 500
                          }}
                        >
                          <User className="w-3 h-3" />
                          Assignee: -
                        </span>
                      )}

                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          padding: '0.2rem 0.5rem',
                          backgroundColor: (item.dueDate && item.dueDate !== 'null' && item.dueDate !== '-' && item.dueDate !== 'No Deadline') || (item.due_date && item.due_date !== 'null' && item.due_date !== '-' && item.due_date !== 'No Deadline') ? '#f0fdf4' : '#f8fafc',
                          color: (item.dueDate && item.dueDate !== 'null' && item.dueDate !== '-' && item.dueDate !== 'No Deadline') || (item.due_date && item.due_date !== 'null' && item.due_date !== '-' && item.due_date !== 'No Deadline') ? '#16a34a' : '#64748b',
                          border: '1px solid ' + ((item.dueDate && item.dueDate !== 'null' && item.dueDate !== '-' && item.dueDate !== 'No Deadline') || (item.due_date && item.due_date !== 'null' && item.due_date !== '-' && item.due_date !== 'No Deadline') ? '#bbf7d0' : '#e2e8f0'),
                          borderRadius: '4px',
                          fontWeight: 500
                        }}
                      >
                        <Calendar className="w-3 h-3" />
                        Due: {(item.dueDate && item.dueDate !== 'null' && item.dueDate !== '-' && item.dueDate !== 'No Deadline') ? item.dueDate : (item.due_date && item.due_date !== 'null' && item.due_date !== '-' && item.due_date !== 'No Deadline') ? item.due_date : 'No Deadline'}
                      </span>
                    </div>
                  </div>

                  {/* Approval & Delegation Buttons */}
                  <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexShrink: 0 }}>
                    <button 
                      type="button"
                      className={`btn ${taskStatus === 'approved' ? 'btn-success' : 'btn-outline'}`}
                      style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      onClick={() => handleApproveAndDelegate(idx)}
                    >
                      <Check className="w-3.5 h-3.5" /> Approve & Delegate
                    </button>

                    <button 
                      type="button"
                      className={`btn ${isAssignedToMe ? 'btn-primary' : 'btn-outline'}`}
                      style={{ 
                        padding: '0.375rem 0.625rem', 
                        fontSize: '0.75rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        backgroundColor: isAssignedToMe ? 'var(--primary)' : 'white',
                        color: isAssignedToMe ? 'white' : 'var(--primary)',
                        borderColor: 'var(--primary)',
                        fontWeight: 500
                      }}
                      onClick={() => handleOpenAssignModal(idx)}
                      title={isAssignedToMe ? "Assigned to yourself (click to view/edit due date)" : "Assign task to myself & set due date"}
                    >
                      {isAssignedToMe ? <UserCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      For Me
                    </button>

                    <button 
                      type="button"
                      className={`btn ${taskStatus === 'rejected' ? 'btn-danger' : 'btn-ghost'}`}
                      style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      onClick={() => toggleTaskStatus(idx, 'rejected')}
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Post-analysis Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-outline" onClick={handleReset}>Cancel</button>
            <button className="btn btn-primary btn-lg" onClick={handleSave} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save className="w-4 h-4" /> Save Meeting Data
            </button>
          </div>
        </div>

        {/* Assign Task to Me Modal */}
        {assignModalTaskIdx !== null && editedTasks[assignModalTaskIdx] && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}>
            <div 
              className="animate-fadeIn"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                maxWidth: '500px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e2e8f0',
                position: 'relative'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Assign Task to Myself</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Specify completion date and confirm assignment</div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setAssignModalTaskIdx(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Task Title Card */}
              <div style={{
                padding: '0.875rem 1rem',
                background: '#f8fafc',
                borderLeft: '4px solid var(--primary)',
                borderRadius: '0 8px 8px 0',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  Selected Action Item
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>
                  {editedTasks[assignModalTaskIdx].task}
                </div>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleConfirmAssignModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Assignee Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Assignee Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={assignModalName}
                      onChange={(e) => setAssignModalName(e.target.value)}
                      style={{ width: '100%', paddingLeft: '2.25rem', background: '#f8fafc', fontWeight: 600, color: '#0f172a' }}
                      required
                    />
                    <User className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                  </div>
                </div>

                {/* Completion Due Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Complete Task By (Due Date) (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      className="form-input"
                      value={assignModalDueDate}
                      onChange={(e) => setAssignModalDueDate(e.target.value)}
                      style={{ width: '100%', paddingLeft: '2.25rem' }}
                    />
                    <Calendar className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Select the deadline date by which you will complete this task (optional).
                  </div>
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  {isTaskAssignedToMe(editedTasks[assignModalTaskIdx]) ? (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleUnassignModalTask}
                      style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                    >
                      Unassign Task
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setAssignModalTaskIdx(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <Check className="w-4 h-4" /> Save & Assign
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
