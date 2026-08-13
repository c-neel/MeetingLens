import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, Loader2, Save, Check, X, Edit2, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { processTranscript, saveMeeting } from '../services/api';

export default function NewMeeting() {
  const navigate = useNavigate();
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
      alert('Could not read file. Please try a TXT file.');
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
      
      // Initialize task approval map
      const initialMap = {};
      aiResults.actionItems.forEach((_, idx) => {
        initialMap[idx] = 'approved';
      });
      setTaskStatusMap(initialMap);
      setEditedTasks([...aiResults.actionItems]);
    } catch (error) {
      // AI analysis failed — show the actual error, NOT mock data
      console.error('[NewMeeting] AI analysis failed:', error);
      setAnalysisError(error);
    }

    setProcessing(false);
  };

  const toggleTaskStatus = (idx, status) => {
    setTaskStatusMap(prev => ({ ...prev, [idx]: status }));
  };

  const handleTaskEdit = (idx, field, value) => {
    const updated = [...editedTasks];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditedTasks(updated);
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
    
    // 4. Find the matching task ID returned from backend
    if (saved && saved.actionItems) {
      // Find the specific task they approved (matching task string)
      const approvedTaskName = editedTasks[idx].task;
      const dbTask = saved.actionItems.find(t => t.task === approvedTaskName);
      if (dbTask) {
        navigate(`/tasks/approve/${dbTask.id}`);
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
                  {analysisError.api_key_found !== undefined && (
                    <div>API Key Found: {analysisError.api_key_found ? 'YES' : 'NO'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={() => { setAnalysisError(null); handleUpload(); }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Analysis Results: {title}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-info">AI Confidence: {results.quality_score}/100</span>
                  <span className="badge badge-neutral">{results.actionItems.length} Action Items</span>
                  {results.risks.length > 0 && (
                    <span className="badge badge-warning">{results.risks.length} Risks Detected</span>
                  )}
                  {results.ai_powered && (
                    <span className="badge badge-success" style={{ background: '#dcfce7', color: '#166534' }}>✓ AI Powered ({results.model})</span>
                  )}
                </div>
              </div>
              <button className="btn btn-primary btn-lg" onClick={handleSave}>
                <Save className="w-4 h-4" /> Save Meeting Data
              </button>
            </div>

            {/* Executive Summary */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>Executive Summary</h3>
              <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {results.executive_summary}
              </div>
            </div>

            {/* Key Decisions */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Key Decisions</h3>
              {results.decisions.length > 0 ? (
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
            <div style={{ marginBottom: '2rem' }}>
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
                return (
                  <div 
                    key={idx} 
                    className={`task-review-card ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={item.task} 
                          onChange={(e) => handleTaskEdit(idx, 'task', e.target.value)}
                          disabled={status === 'rejected'}
                          style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9375rem' }}
                        />



                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                          <div className="confidence-bar">
                            <span>AI Confidence:</span>
                            <div className="confidence-track"><div className="confidence-fill" style={{ width: `${item.confidence}%` }}></div></div>
                            <span style={{ fontWeight: 600 }}>{item.confidence}%</span>
                          </div>
                          {item.confidence < 90 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <AlertTriangle className="w-3 h-3" /> Needs Confirmation
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Approval Buttons */}
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          className={`btn ${status === 'approved' ? 'btn-success' : 'btn-outline'}`}
                          style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                          onClick={() => handleApproveAndDelegate(idx)}
                        >
                          <Check className="w-3.5 h-3.5" /> Approve & Delegate
                        </button>
                        <button 
                          className={`btn ${status === 'rejected' ? 'btn-danger' : 'btn-ghost'}`}
                          style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
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
                {results.risks.length > 0 ? results.risks.map((risk, i) => (
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
                {results.suggestions.length > 0 ? results.suggestions.map((sug, i) => (
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
              <button className="btn btn-outline" onClick={() => { setResults(null); setFile(null); setTitle(''); }}>Cancel</button>
              <button className="btn btn-primary btn-lg" onClick={handleSave}>
                <Save className="w-4 h-4" /> Save Meeting Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
