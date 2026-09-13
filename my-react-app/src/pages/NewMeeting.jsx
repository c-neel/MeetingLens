import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { UploadCloud, FileText, Loader2, Save, Check, X, Edit2, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, XCircle, User, UserCheck, ArrowLeft, RefreshCw, Calendar, Clock } from 'lucide-react';
import { processTranscript, saveMeeting, getMeetingById } from '../services/api';

export default function NewMeeting() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [processStep, setProcessStep] = useState(0);
  const [taskStatusMap, setTaskStatusMap] = useState({});
  const [editedTasks, setEditedTasks] = useState([]);
  const [transcriptText, setTranscriptText] = useState('');

  // Modal prompt state for "For Me" assignment
  const [assignModalTaskIdx, setAssignModalTaskIdx] = useState(null);
  const [assignModalName, setAssignModalName] = useState('');
  const [assignModalDueDate, setAssignModalDueDate] = useState('');

  const updateStoredDraft = (updates) => {
    try {
      const current = JSON.parse(sessionStorage.getItem('meetai_analysis_draft') || '{}');
      sessionStorage.setItem('meetai_analysis_draft', JSON.stringify({ ...current, ...updates }));
    } catch (e) {}
  };

  // Restore draft or load meeting by meetingId
  useEffect(() => {
    const savedDraftStr = sessionStorage.getItem('meetai_analysis_draft');
    if (savedDraftStr) {
      try {
        const draft = JSON.parse(savedDraftStr);
        if (draft && draft.results) {
          setTitle(draft.title || '');
          setDate(draft.date || '');
          setTranscriptText(draft.transcriptText || '');
          setResults(draft.results);
          setTaskStatusMap(draft.taskStatusMap || {});
          setEditedTasks(draft.editedTasks || draft.results.actionItems || []);
          return;
        }
      } catch (e) {
        console.error('Failed to parse draft from sessionStorage', e);
      }
    }

    const meetingId = searchParams.get('meetingId') || location.state?.meetingId;
    if (meetingId && !results) {
      setProcessing(true);
      getMeetingById(meetingId).then(m => {
        if (m) {
          setTitle(m.title || 'Meeting Analysis');
          setDate(m.date || m.meeting_date || '');
          setTranscriptText(m.transcript || '');
          const reconstructedResults = {
            summary: m.summary || m.executive_summary,
            executive_summary: m.executive_summary || m.summary,
            detailed_summary: m.detailed_summary || m.summary,
            decisions: m.decisions || [],
            actionItems: m.actionItems || [],
            risks: m.risks || [],
            suggestions: m.suggestions || [],
            quality_score: m.quality_score || 85,
            ai_powered: true,
            model: 'Gemini 1.5'
          };
          setResults(reconstructedResults);
          const initialMap = {};
          const tasks = (m.actionItems || []).map((t, idx) => {
            initialMap[idx] = 'approved';
            return t;
          });
          setTaskStatusMap(initialMap);
          setEditedTasks(tasks);

          sessionStorage.setItem('meetai_analysis_draft', JSON.stringify({
            title: m.title,
            date: m.date || m.meeting_date,
            transcriptText: m.transcript || '',
            results: reconstructedResults,
            taskStatusMap: initialMap,
            editedTasks: tasks,
            savedMeetingId: m.id
          }));
        }
      }).catch(err => {
        console.error('Failed to load meeting for review:', err);
      }).finally(() => {
        setProcessing(false);
      });
    }
  }, [searchParams, location.state]);

  // Smooth scroll to targeted section
  useEffect(() => {
    if (results) {
      const hash = window.location.hash;
      const shouldScrollToTasks = hash === '#tasks-review-section' || hash === '#tasks' || location.state?.scrollTo === 'tasks';
      const shouldScrollToSummary = hash === '#summary-section' || hash === '#summary' || location.state?.scrollTo === 'summary';
      
      const targetId = shouldScrollToTasks ? 'tasks-review-section' : (shouldScrollToSummary ? 'summary-section' : (hash ? hash.replace('#', '') : null));

      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    }
  }, [results, location.hash, location.state]);

  const steps = [
    'Reading document content...',
    'Extracting transcript text...',
    'Sending to Gemini AI...',
    'Generating executive summary...',
    'Extracting decisions...',
    'Detecting action items & assignees...',
    'Evaluating risks & dependencies...',
    'Finalizing AI analysis results...'
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        setTitle(baseName);
      }
    }
  };

  const handleUpload = async () => {
    if (!title || !file) return alert('Title and transcript file are required.');
    
    setProcessing(true);
    setAnalysisError(null);
    setResults(null);
    
    // Read the file content
    let fileText = '';
    try {
      fileText = await file.text();
    } catch (err) {
      alert('Could not read file. Please try a TXT or Markdown file.');
      setProcessing(false);
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    // Check if the uploaded file is binary (e.g. PDF / Word document)
    if (fileText.startsWith('%PDF') || fileText.includes('\x00')) {
      alert(`The file "${file.name}" is a binary document. MeetAI requires a text-based transcript. Please upload a .txt or .md transcript file.`);
      setProcessing(false);
      return;
    }

    if (!fileText.trim()) {
      alert('The uploaded file appears to be empty.');
      setProcessing(false);
      return;
    }

    console.log('[NewMeeting] File:', file.name, '| Size:', file.size, 'bytes');
    console.log('[NewMeeting] Extracted text length:', fileText.length, 'chars');

    // Run processing steps animation concurrently with real AI call
    const stepsAnimation = (async () => {
      for (let i = 0; i < steps.length; i++) {
        setProcessStep(i);
        await new Promise(r => setTimeout(r, 600));
      }
    })();

    try {
      const aiCall = processTranscript(fileText, title);
      const [, aiResults] = await Promise.all([stepsAnimation, aiCall]);
      
      setTranscriptText(fileText);
      setResults(aiResults);
      
      // Initialize task approval map - all tasks start unassigned as "-"
      const initialMap = {};
      const normalizedTasks = (aiResults.actionItems || []).map((item, idx) => {
        initialMap[idx] = 'approved';
        return {
          ...item,
          assignee: '-'
        };
      });
      setTaskStatusMap(initialMap);
      setEditedTasks(normalizedTasks);

      // Save initial draft to sessionStorage
      sessionStorage.setItem('meetai_analysis_draft', JSON.stringify({
        title,
        date: date || new Date().toISOString().split('T')[0],
        transcriptText: fileText,
        results: aiResults,
        taskStatusMap: initialMap,
        editedTasks: normalizedTasks,
        savedMeetingId: null
      }));
    } catch (error) {
      // AI analysis failed — show the actual error, NOT mock data
      console.error('[NewMeeting] AI analysis failed:', error);
      setAnalysisError(error);
    }

    setProcessing(false);
  };

  const toggleTaskStatus = (idx, status) => {
    const updatedMap = { ...taskStatusMap, [idx]: status };
    setTaskStatusMap(updatedMap);
    updateStoredDraft({ taskStatusMap: updatedMap });
  };

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
    updateStoredDraft({
      editedTasks: updated,
      taskStatusMap: updatedMap
    });

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
    updateStoredDraft({ editedTasks: updated });
    setAssignModalTaskIdx(null);
  };

  const handleClearAnalysis = () => {
    sessionStorage.removeItem('meetai_analysis_draft');
    setResults(null);
    setAnalysisError(null);
    setFile(null);
    setTitle('');
    setEditedTasks([]);
    setTaskStatusMap({});
  };

  const handleSave = async () => {
    const approvedActionItems = editedTasks.filter((_, idx) => taskStatusMap[idx] !== 'rejected');

    const meetingData = {
      title,
      date: date || new Date().toISOString().split('T')[0],
      source: 'file',
      transcript: transcriptText,
      summary: results.summary,
      executive_summary: results.executive_summary,
      detailed_summary: results.detailed_summary,
      decisions: results.decisions,
      actionItems: approvedActionItems,
      risks: results.risks,
      suggestions: results.suggestions,
      quality_score: results.quality_score
    };

    const saved = await saveMeeting(meetingData);
    sessionStorage.removeItem('meetai_analysis_draft');
    navigate(`/meetings/${saved.id || 1}`);
  };

  const handleApproveAndDelegate = async (idx) => {
    // 1. Mark task as approved
    toggleTaskStatus(idx, 'approved');
    const approvedActionItems = editedTasks.filter((_, i) => (i === idx || taskStatusMap[i] !== 'rejected'));

    // 2. Prepare payload
    const meetingData = {
      title,
      date: date || new Date().toISOString().split('T')[0],
      source: 'file',
      transcript: transcriptText,
      summary: results.summary,
      executive_summary: results.executive_summary,
      detailed_summary: results.detailed_summary,
      decisions: results.decisions,
      actionItems: approvedActionItems,
      risks: results.risks,
      suggestions: results.suggestions,
      quality_score: results.quality_score
    };

    // 3. Save meeting to database
    const saved = await saveMeeting(meetingData);

    // Save active draft to sessionStorage with saved meeting ID
    sessionStorage.setItem('meetai_analysis_draft', JSON.stringify({
      title,
      date: date || new Date().toISOString().split('T')[0],
      transcriptText,
      results,
      taskStatusMap: { ...taskStatusMap, [idx]: 'approved' },
      editedTasks,
      savedMeetingId: saved?.id
    }));
    
    // 4. Find the matching task ID returned from backend
    if (saved && saved.actionItems) {
      // Find the specific task they approved (matching task string)
      const approvedTaskName = editedTasks[idx].task;
      const dbTask = saved.actionItems.find(t => t.task === approvedTaskName);
      if (dbTask) {
        navigate(`/tasks/approve/${dbTask.id}`, {
          state: {
            from: 'analyze',
            meetingId: saved.id,
            returnUrl: `/analyze?meetingId=${saved.id}#tasks-review-section`,
            scrollTo: 'tasks'
          }
        });
        return;
      }
    }
    
    // Fallback if task ID not found
    navigate(`/tasks`);
  };

  // Helper to get user-friendly error title
  const getErrorTitle = (error) => {
    const type = error?.error_type || '';
    if (type === 'BACKEND_UNREACHABLE') return '🔌 Backend Server Not Running';
    if (type.startsWith('API_KEY')) return '🔑 API Key Problem';
    if (type.includes('401') || type.includes('403')) return '🔑 API Key Authentication Failed';
    if (type.includes('404')) return '⚠️ Gemini Model Not Found';
    if (type.includes('429')) return '⏳ Rate Limit Exceeded';
    if (type.includes('500') || type.includes('503')) return '🌐 Gemini Service Unavailable';
    if (type === 'INVALID_JSON') return '⚠️ AI Response Parse Error';
    return '❌ AI Analysis Failed';
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-title">
        <span>Analyze Meeting or Document</span>
      </div>

      {/* ==================== UPLOAD FORM ==================== */}
      {!processing && !results && !analysisError && (
        <div className="card" style={{ maxWidth: '650px', margin: '0 auto', padding: '2rem' }}>
          <div className="form-group">
            <label className="form-label">Meeting / Document Title *</label>
            <input 
              type="text" 
              className="form-input" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Q3 Sprint Planning Review" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date (Optional)</label>
            <input 
              type="date" 
              className="form-input" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload File (TXT, PDF, DOCX, MD, CSV)</label>
            <div className="upload-area" onClick={() => document.getElementById('file-upload').click()}>
              <input 
                type="file" 
                id="file-upload" 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
                accept=".txt,.pdf,.docx,.doc,.md,.csv" 
              />
              <UploadCloud className="w-12 h-12 text-muted" style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
              {file ? (
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1rem' }}>{file.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Drag and drop your file here, or browse</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports TXT, PDF, DOCX, Markdown, and CSV</p>
                </div>
              )}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleUpload}>
            <Sparkles className="w-5 h-5" /> Analyze Content
          </button>
        </div>
      )}

      {/* ==================== PROCESSING ANIMATION ==================== */}
      {processing && (
        <div className="card" style={{ maxWidth: '550px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
          <Loader2 className="w-12 h-12 animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>AI Meeting Analysis Engine</h3>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Sending your transcript to Gemini AI for analysis...</p>
          
          <div className="processing-steps">
            {steps.map((step, i) => (
              <div key={i} className={`process-step ${i === processStep ? 'active' : ''} ${i < processStep ? 'done' : ''}`}>
                <span style={{ minWidth: '1.25rem' }}>{i < processStep ? '✓' : i === processStep ? '●' : '○'}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== ERROR STATE ==================== */}
      {analysisError && (
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '0.5rem', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <XCircle style={{ color: '#dc2626', flexShrink: 0, marginTop: '0.125rem' }} className="w-6 h-6" />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
                  {getErrorTitle(analysisError)}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#991b1b', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {analysisError.message}
                </p>

                {/* Technical details */}
                <div style={{ 
                  backgroundColor: '#fee2e2', 
                  padding: '0.75rem', 
                  borderRadius: '0.375rem', 
                  fontSize: '0.8125rem', 
                  fontFamily: 'monospace',
                  color: '#7f1d1d'
                }}>
                  {analysisError.http_code > 0 && <div>HTTP Status: {analysisError.http_code}</div>}
                  {analysisError.error_type && <div>Error Type: {analysisError.error_type}</div>}
                  {analysisError.model && <div>Model: {analysisError.model}</div>}
                  {analysisError.error && <div>Details: {analysisError.error}</div>}
                  {analysisError.details && <div>Diagnostic: {typeof analysisError.details === 'string' ? analysisError.details : JSON.stringify(analysisError.details)}</div>}
                  {analysisError.api_key_found !== undefined && (
                    <div>API Key Found: {analysisError.api_key_found ? 'YES' : 'NO'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => { 
                setAnalysisError(null); 
                if (file) {
                  handleUpload();
                }
              }}
            >
              🔄 Retry Analysis
            </button>
            <button className="btn btn-outline" onClick={() => { setAnalysisError(null); setResults(null); }}>
              ← Go Back
            </button>
          </div>
        </div>
      )}

      {/* ==================== RESULTS ==================== */}
      {results && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Analysis Results: {title}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-neutral">{(results.actionItems || editedTasks)?.length || 0} Action Items</span>
                  {results.risks?.length > 0 && (
                    <span className="badge badge-warning">{results.risks.length} Risks Detected</span>
                  )}
                  {results.ai_powered && (
                    <span className="badge badge-success" style={{ background: '#dcfce7', color: '#166534' }}>✓ AI Powered ({results.model || 'Gemini'})</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-outline" onClick={handleClearAnalysis} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <RefreshCw className="w-3.5 h-3.5" /> New Analysis
                </button>
                <button className="btn btn-outline" onClick={handleClearAnalysis} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-lg" onClick={handleSave} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save className="w-4 h-4" /> Save Meeting Data
                </button>
              </div>
            </div>

            {/* Executive Summary */}
            <div id="summary-section" style={{ marginBottom: '2rem', scrollMarginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>Executive Summary</h3>
              <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {results.executive_summary || results.summary}
              </div>
            </div>

            {/* Key Decisions */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Key Decisions</h3>
              {results.decisions && results.decisions.length > 0 ? (
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                  {results.decisions.map((decision, index) => (
                    <li key={index} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      {typeof decision === 'string' ? decision : (decision.decision || decision.decision_text || JSON.stringify(decision))}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No decisions were extracted from this transcript.</p>
              )}
            </div>

            {/* Human-in-the-Loop AI Task Review */}
            <div id="tasks-review-section" style={{ marginBottom: '2rem', scrollMarginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 className="w-5 h-5" /> AI Generated Tasks (Review & Approve)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Approve, edit, or reject tasks before saving
                </span>
              </div>

              {editedTasks.length === 0 && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No action items were extracted from this transcript.</p>
              )}

              {editedTasks.map((item, idx) => {
                const status = taskStatusMap[idx] || 'approved';
                const isAssignedToMe = isTaskAssignedToMe(item);
                return (
                  <div 
                    key={idx} 
                    className={`task-review-card ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={item.task} 
                          onChange={(e) => handleTaskEdit(idx, 'task', e.target.value)}
                          disabled={status === 'rejected'}
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
                          className={`btn ${status === 'approved' ? 'btn-success' : 'btn-outline'}`}
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
                          className={`btn ${status === 'rejected' ? 'btn-danger' : 'btn-ghost'}`}
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
            </div>

            {/* Risks & Suggestions */}
            <div className="grid-2" style={{ marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--danger)', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert className="w-4 h-4" /> Detected Risks
                </h3>
                {results.risks && results.risks.length > 0 ? results.risks.map((risk, i) => (
                  <div key={i} style={{ padding: '0.625rem', background: '#fff5f5', borderRadius: '0.375rem', marginBottom: '0.5rem', border: '1px solid #fed7d7', fontSize: '0.8125rem' }}>
                    <span className={`badge badge-${risk.severity === 'High' || risk.severity === 'Critical' ? 'danger' : 'warning'}`} style={{ marginRight: '0.5rem' }}>{risk.severity}</span>
                    {risk.text}
                  </div>
                )) : (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No risks detected.</p>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles className="w-4 h-4" /> AI Recommendations
                </h3>
                {results.suggestions && results.suggestions.length > 0 ? results.suggestions.map((sug, i) => (
                  <div key={i} style={{ padding: '0.625rem', background: '#f0f5ff', borderRadius: '0.375rem', marginBottom: '0.5rem', border: '1px solid #d6e4ff', fontSize: '0.8125rem' }}>
                    💡 {sug.text}
                  </div>
                )) : (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No recommendations.</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={handleClearAnalysis}>Cancel</button>
              <button className="btn btn-primary btn-lg" onClick={handleSave}>
                <Save className="w-4 h-4" /> Save Meeting Data
              </button>
            </div>
          </div>
        </div>
      )}

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
