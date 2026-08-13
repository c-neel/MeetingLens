import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMeetingById, getDocuments, uploadDocument, deleteDocument } from '../services/api';
import { ArrowLeft, Save, FileDown, Mail, Edit2, ShieldAlert, Sparkles, CheckCircle2, Clock, Calendar, FileText, AlertTriangle, ChevronDown, Paperclip, Plus, Download, Trash2, Upload, X, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { exportAsPDF, exportAsWord, downloadDocumentFile } from '../utils/exporter';
import MeetingAIChat from '../components/MeetingAIChat';

const FORMAT_CONFIG = {
  PDF: { label: 'PDF (.pdf)', accept: '.pdf', exts: ['pdf'] },
  DOCX: { label: 'Word (.docx)', accept: '.docx,.doc', exts: ['docx', 'doc'] },
  PPTX: { label: 'Presentation (.pptx)', accept: '.pptx,.ppt', exts: ['pptx', 'ppt'] },
  TXT: { label: 'Text (.txt)', accept: '.txt', exts: ['txt'] },
  PNG: { label: 'Image (.png, .jpg)', accept: '.png,.jpg,.jpeg', exts: ['png', 'jpg', 'jpeg'] }
};

export default function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // References / Attachments State
  const [attachments, setAttachments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Reference Note');
  const [uploadDocType, setUploadDocType] = useState('PDF');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [formatError, setFormatError] = useState('');

  const loadAttachments = () => {
    getDocuments().then(allDocs => {
      const meetingDocs = allDocs.filter(d => parseInt(d.meeting_id) === parseInt(id));
      setAttachments(meetingDocs);
    });
  };

  useEffect(() => {
    getMeetingById(id).then(data => {
      setMeeting(data);
      setSummary(data?.executive_summary || data?.summary || '');
    });
    loadAttachments();
  }, [id]);

  if (!meeting) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading meeting details...</div>;

  const tabs = ['Overview', 'Transcript', 'MOM', 'Tasks', 'Decisions', 'AI Assistant', 'References'];

  const handleApproveTask = (task) => {
    navigate(`/tasks/approve/${task.id}`);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExts = FORMAT_CONFIG[uploadDocType]?.exts || [];

    if (!allowedExts.includes(ext)) {
      setFormatError(`Format Mismatch! You selected "${FORMAT_CONFIG[uploadDocType].label}", but selected a ".${ext}" file. Please pick a matching file format.`);
      setSelectedFile(null);
      setFileData(null);
      e.target.value = '';
      return;
    }

    setFormatError('');
    setSelectedFile(file);
    setUploadFileName(file.name);

    // Read Base64 Data URL for real file download
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDocTypeChange = (newType) => {
    setUploadDocType(newType);
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      const allowedExts = FORMAT_CONFIG[newType]?.exts || [];
      if (!allowedExts.includes(ext)) {
        setFormatError(`Format Mismatch! File "${selectedFile.name}" does not match "${FORMAT_CONFIG[newType].label}". Please choose a matching file.`);
        setSelectedFile(null);
        setFileData(null);
      } else {
        setFormatError('');
      }
    }
  };

  const handleAttachSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      const allowedExts = FORMAT_CONFIG[uploadDocType]?.exts || [];
      if (!allowedExts.includes(ext)) {
        setFormatError(`Validation failed: Format type "${FORMAT_CONFIG[uploadDocType].label}" does not match file extension ".${ext}".`);
        return;
      }
    }

    await uploadDocument({
      file_name: uploadFileName.trim(),
      document_type: uploadDocType,
      category: uploadCategory,
      meeting_id: parseInt(id),
      file_data: fileData
    });

    setShowUploadModal(false);
    setUploadFileName('');
    setSelectedFile(null);
    setFileData(null);
    setFormatError('');
    loadAttachments();
  };

  const handleDeleteAttachment = async (docId, e) => {
    e.stopPropagation();
    if (window.confirm("Remove this reference file from meeting?")) {
      await deleteDocument(docId);
      loadAttachments();
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-start' }}>
        <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{meeting.title}</span>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span className="badge badge-neutral"><Calendar className="w-3 h-3" /> {meeting.date || meeting.meeting_date}</span>
            <span className="badge badge-neutral"><Clock className="w-3 h-3" /> {meeting.duration || '45 min'}</span>
            {meeting.source === 'voice' && <span className="badge badge-danger">Voice Meeting</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
          <button className="btn btn-outline" onClick={() => alert('Share link copied to clipboard!')}><Mail className="w-4 h-4" /> Share</button>
          
          {/* Export MOM Dropdown */}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-primary" onClick={() => setShowExportMenu(!showExportMenu)}>
              <FileDown className="w-4 h-4" /> Export MOM <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showExportMenu && (
              <div style={{ 
                position: 'absolute', 
                right: 0, 
                top: '100%', 
                marginTop: '0.5rem', 
                background: 'white', 
                border: '1px solid var(--border)', 
                borderRadius: '0.5rem', 
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
                zIndex: 100, 
                minWidth: '190px', 
                overflow: 'hidden' 
              }}>
                <button 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.625rem', 
                    width: '100%', 
                    padding: '0.75rem 1rem', 
                    border: 'none', 
                    background: 'none', 
                    textAlign: 'left', 
                    cursor: 'pointer', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-main)'
                  }} 
                  onClick={() => { exportAsPDF(meeting); setShowExportMenu(false); }}
                >
                  <FileText className="w-4 h-4 text-danger" style={{ color: '#ef4444' }} /> Export as PDF
                </button>
                <button 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.625rem', 
                    width: '100%', 
                    padding: '0.75rem 1rem', 
                    border: 'none', 
                    background: 'none', 
                    textAlign: 'left', 
                    cursor: 'pointer', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-main)',
                    borderTop: '1px solid #f1f5f9' 
                  }} 
                  onClick={() => { exportAsWord(meeting); setShowExportMenu(false); }}
                >
                  <FileDown className="w-4 h-4 text-primary" style={{ color: '#2563eb' }} /> Export as Word (.docx)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(tab => (
          <button 
            key={tab} 
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'References' ? `References (${attachments.length})` : tab}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'Overview' && (
        <div>
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700 }}>
                {meeting.quality_score || 85}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>Meeting Effectiveness</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Based on decision clarity, action item ownership, and risk detection.</div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Participants</div>
              <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{Array.isArray(meeting.participants) ? meeting.participants.join(', ') : meeting.participants || 'All Team'}</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="section-header">
              <span className="section-title">Executive Summary</span>
              {!isEditingSummary ? (
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingSummary(true)}><Edit2 className="w-3 h-3" /> Edit</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setIsEditingSummary(false)}><Save className="w-3 h-3" /> Save</button>
              )}
            </div>
            {!isEditingSummary ? (
              <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{summary}</p>
            ) : (
              <textarea 
                value={summary} 
                onChange={e => setSummary(e.target.value)}
                style={{ width: '100%', height: '120px', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.875rem' }}
              />
            )}
          </div>

          {/* Quick Action Items */}
          <div className="card">
            <div className="section-header">
              <span className="section-title">Action Items ({meeting.actionItems?.length || 0})</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('Tasks')}>View All →</button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {meeting.actionItems?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{item.task}</td>
                      <td>{item.assignee}</td>
                      <td>{item.dueDate || item.due_date}</td>
                      <td><span className={`badge badge-${item.priority === 'High' ? 'danger' : 'warning'}`}>{item.priority}</span></td>
                      <td><span className="badge badge-neutral">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TRANSCRIPT ================= */}
      {activeTab === 'Transcript' && (
        <div className="card">
          <div className="section-header">
            <span className="section-title">Meeting Transcript</span>
            <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(meeting.transcript || meeting.summary || '')}>
              Copy Transcript
            </button>
          </div>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto' }}>
            {meeting.transcript ? (
              meeting.transcript
            ) : meeting.summary ? (
              `[ Meeting Summary ]\n${meeting.summary}\n\n(Note: Full raw audio transcript was not saved for this historical meeting. All new meetings will record and display full transcript.)`
            ) : (
              'No transcript text available for this meeting.'
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: MOM ================= */}
      {activeTab === 'MOM' && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '2.5rem' }}>
          <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>MINUTES OF MEETING</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{meeting.title}</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <div><strong>Date:</strong> {meeting.date || meeting.meeting_date}</div>
              <div><strong>Duration:</strong> {meeting.duration || '45 min'}</div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: '0.5rem' }}>1. Executive Summary</h4>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{meeting.executive_summary || meeting.summary}</p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: '0.5rem' }}>2. Decisions Made</h4>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
              {meeting.decisions?.map((d, i) => <li key={i} style={{ marginBottom: '0.375rem' }}>{d.decision_text || d}</li>)}
            </ul>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: '0.5rem' }}>3. Action Items</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {meeting.actionItems?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.task}</td>
                      <td>{item.assignee}</td>
                      <td>{item.dueDate || item.due_date}</td>
                      <td>{item.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: TASKS ================= */}
      {activeTab === 'Tasks' && (
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 600 }}>Meeting Action Items ({meeting.actionItems?.length || 0})</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {meeting.actionItems?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{item.task}</td>
                    <td>{item.assignee}</td>
                    <td>{item.dueDate || item.due_date}</td>
                    <td><span className={`badge badge-${item.priority === 'High' ? 'danger' : 'warning'}`}>{item.priority}</span></td>
                    <td><span className="badge badge-neutral">{item.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleApproveTask({ ...item, meeting_title: meeting.title })}
                      >
                        <Send className="w-3 h-3" /> Approve & Delegate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: DECISIONS ================= */}
      {activeTab === 'Decisions' && (
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 600 }}>Key Decisions ({meeting.decisions?.length || 0})</h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
            {meeting.decisions?.map((d, index) => (
              <li key={index} style={{ marginBottom: '0.75rem', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                {d.decision_text || d}
              </li>
            ))}
          </ul>
        </div>
      )}



      {/* ================= TAB 7: AI ASSISTANT CHATBOT ================= */}
      {activeTab === 'AI Assistant' && (
        <MeetingAIChat meeting={meeting} />
      )}

      {/* ================= TAB 8: REFERENCES & ATTACHMENTS ================= */}
      {activeTab === 'References' && (
        <div className="card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Attached Reference Files & Documents</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Agendas, Presentation slides, Text notes, Specs, or MOM exports linked to this meeting.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowUploadModal(true); setFormatError(''); setSelectedFile(null); setFileData(null); }}>
              <Plus className="w-3.5 h-3.5" /> Attach Reference File
            </button>
          </div>

          {attachments.length === 0 ? (
            <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <Paperclip className="w-8 h-8 text-muted" style={{ margin: '0 auto 0.75rem auto', color: 'var(--text-muted)' }} />
              <h4>No reference files attached yet</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Attach agendas, slides (.pptx), specs, or notes to keep all context for this meeting in one place.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowUploadModal(true); setFormatError(''); setSelectedFile(null); setFileData(null); }}>
                <Plus className="w-3.5 h-3.5" /> Attach First File
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Category</th>
                    <th>Format</th>
                    <th>Date Added</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attachments.map((doc) => {
                    const isPdf = doc.type === 'PDF' || (doc.fileName || '').toLowerCase().endsWith('.pdf');
                    return (
                      <tr key={doc.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontWeight: 500 }}>
                            <FileText className="w-4 h-4 text-muted" style={{ color: isPdf ? '#ef4444' : '#2563eb' }} />
                            <span>{doc.fileName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                            {doc.category || 'Reference Note'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                            {doc.type}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{doc.date}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => downloadDocumentFile(doc, meeting)}
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--danger)' }}
                              onClick={(e) => handleDeleteAttachment(doc.id, e)}
                              title="Delete file attachment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.75rem',
            maxWidth: '520px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Attach File to "{meeting.title}"</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAttachSubmit}>
              {/* Format Validation Error Banner */}
              {formatError && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem'
                }}>
                  <AlertCircle className="w-4 h-4" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                  <span>{formatError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                    1. Select Format Type *
                  </label>
                  <select
                    value={uploadDocType}
                    onChange={e => handleDocTypeChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem',
                      background: 'white',
                      fontWeight: 500
                    }}
                  >
                    <option value="PDF">PDF (.pdf)</option>
                    <option value="DOCX">Word (.docx)</option>
                    <option value="PPTX">Presentation (.pptx)</option>
                    <option value="TXT">Text (.txt)</option>
                    <option value="PNG">Image (.png, .jpg)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={e => setUploadCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  >
                    <option value="Reference Note">Reference Note</option>
                    <option value="Agenda">Agenda</option>
                    <option value="Specification">Specification</option>
                  </select>
                </div>
              </div>

              {/* File Picker with Strict Format Restriction */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                  2. Choose File (Restricted to {FORMAT_CONFIG[uploadDocType]?.label}) *
                </label>
                <input
                  type="file"
                  accept={FORMAT_CONFIG[uploadDocType]?.accept}
                  onChange={handleFileSelect}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px dashed var(--primary)',
                    background: '#f0f9ff',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Restricted: File picker only accepts {FORMAT_CONFIG[uploadDocType]?.accept} files.
                </span>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                  Document Name / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Slide_Deck_v2.pdf, Meeting_Agenda.docx"
                  value={uploadFileName}
                  onChange={e => setUploadFileName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!!formatError}>
                  <Upload className="w-4 h-4" /> Save Attachment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
