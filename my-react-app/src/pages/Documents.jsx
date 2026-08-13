import React, { useState, useEffect } from 'react';
import { getDocuments, getMeetings, uploadDocument, deleteDocument } from '../services/api';
import { FileText, Download, ChevronDown, FileDown, Plus, Search, Trash2, Tag, Calendar, Upload, Link as LinkIcon, X, AlertCircle } from 'lucide-react';
import { exportAsPDF, exportAsWord, downloadDocumentFile } from '../utils/exporter';
import { useNavigate } from 'react-router-dom';

const FORMAT_CONFIG = {
  PDF: { label: 'PDF (.pdf)', accept: '.pdf', exts: ['pdf'] },
  DOCX: { label: 'Word (.docx)', accept: '.docx,.doc', exts: ['docx', 'doc'] },
  PPTX: { label: 'Presentation (.pptx)', accept: '.pptx,.ppt', exts: ['pptx', 'ppt'] },
  TXT: { label: 'Text (.txt)', accept: '.txt', exts: ['txt'] },
  PNG: { label: 'Image (.png, .jpg)', accept: '.png,.jpg,.jpeg', exts: ['png', 'jpg', 'jpeg'] }
};

export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Reference Note');
  const [uploadDocType, setUploadDocType] = useState('PDF');
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [formatError, setFormatError] = useState('');

  const loadData = () => {
    getDocuments().then(setDocuments);
    getMeetings().then(setMeetings);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
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

    // Read Base64 Data URL for real download
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

  const handleUploadSubmit = async (e) => {
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

    const payload = {
      file_name: uploadFileName.trim(),
      document_type: uploadDocType,
      category: uploadCategory,
      meeting_id: selectedMeetingId ? parseInt(selectedMeetingId) : null,
      file_data: fileData
    };

    await uploadDocument(payload);
    setShowUploadModal(false);
    setUploadFileName('');
    setSelectedFile(null);
    setFileData(null);
    setFormatError('');
    setSelectedMeetingId('');
    loadData();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to remove this document?")) {
      await deleteDocument(id);
      loadData();
    }
  };

  const categories = ['All', 'MOM Export', 'Agenda', 'Reference Note', 'Specification'];

  const filteredDocuments = documents.filter(doc => {
    const categoryMatch = activeCategory === 'All' || doc.category === activeCategory;
    const searchMatch =
      (doc.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const getBadgeColor = (category) => {
    switch (category) {
      case 'Agenda': return { bg: '#fef3c7', text: '#d97706' };
      case 'Reference Note': return { bg: '#dcfce7', text: '#16a34a' };
      case 'Specification': return { bg: '#fae8ff', text: '#c026d3' };
      default: return { bg: '#e0e7ff', text: '#4338ca' }; // MOM Export
    }
  };

  return (
    <div onClick={() => setOpenDropdownId(null)} className="animate-fadeIn">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span>MOM Document History & References</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.75rem', fontWeight: 'normal' }}>
            ({filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''})
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowUploadModal(true); setFormatError(''); setSelectedFile(null); setFileData(null); }}>
          <Plus className="w-4 h-4" /> Attach Reference Document
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat} {cat !== 'All' && <span style={{ marginLeft: '0.25rem', opacity: 0.8 }}>({documents.filter(d => d.category === cat).length})</span>}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search documents or meetings..."
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

      {/* Documents Table */}
      <div className="card">
        {filteredDocuments.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3>No documents found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              {searchTerm ? `No files match "${searchTerm}".` : 'No documents attached to this category yet.'}
            </p>
            <button className="btn btn-primary" onClick={() => { setShowUploadModal(true); setFormatError(''); setSelectedFile(null); setFileData(null); }}>
              <Plus className="w-4 h-4" /> Upload First Document
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Category</th>
                  <th>Associated Meeting</th>
                  <th>Type</th>
                  <th>Date Added</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const isPdf = doc.type === 'PDF' || (doc.fileName || '').toLowerCase().endsWith('.pdf');
                  const isMomExport = doc.category === 'MOM Export' || (doc.fileName || '').includes('_Summary') || (doc.fileName || '').includes('_MOM');
                  const categoryStyle = getBadgeColor(doc.category || 'MOM Export');
                  
                  const docObj = {
                    title: doc.title || doc.meeting_title || doc.fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
                    fileName: doc.fileName,
                    date: doc.date || doc.meeting_date || new Date().toISOString().split('T')[0],
                    executive_summary: doc.executive_summary || doc.summary || doc.meeting_summary || `Meeting record for ${doc.fileName}.`,
                    decisions: (doc.decisions && doc.decisions.length > 0) ? doc.decisions : [`Meeting decisions recorded for ${doc.fileName}.`],
                    actionItems: (doc.actionItems && doc.actionItems.length > 0) ? doc.actionItems : (doc.action_items || [])
                  };

                  return (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <FileText className="w-5 h-5 text-muted" style={{ color: isPdf ? '#ef4444' : '#2563eb' }} />
                          <span style={{ fontWeight: 500 }}>{doc.fileName}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: categoryStyle.bg,
                            color: categoryStyle.text,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        >
                          {doc.category || 'MOM Export'}
                        </span>
                      </td>
                      <td>
                        {doc.meeting_id ? (
                          <span
                            style={{ color: 'var(--primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
                            onClick={() => navigate(`/meetings/${doc.meeting_id}`)}
                          >
                            <LinkIcon className="w-3 h-3" /> {doc.title || doc.meeting_title}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>General Resource</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isPdf ? '#fee2e2' : '#e0e7ff',
                            color: isPdf ? '#b91c1c' : '#4338ca',
                            fontWeight: 600
                          }}
                        >
                          {doc.type}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{doc.date}</td>
                      <td style={{ textAlign: 'right', position: 'relative' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          {!isMomExport ? (
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                              onClick={() => downloadDocumentFile(doc)}
                            >
                              <Download className="w-3.5 h-3.5" /> Download File
                            </button>
                          ) : (
                            <div style={{ position: 'relative' }}>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                                onClick={(e) => toggleDropdown(doc.id, e)}
                              >
                                <Download className="w-3.5 h-3.5" /> Export <ChevronDown className="w-3 h-3" />
                              </button>

                              {openDropdownId === doc.id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    marginTop: '0.25rem',
                                    background: 'white',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                                    zIndex: 100,
                                    minWidth: '180px',
                                    overflow: 'hidden',
                                    textAlign: 'left'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      width: '100%',
                                      padding: '0.625rem 0.875rem',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '0.8125rem',
                                      color: 'var(--text-main)'
                                    }}
                                    onClick={() => { exportAsPDF(docObj); setOpenDropdownId(null); }}
                                  >
                                    <FileText className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /> Download as PDF
                                  </button>
                                  <button
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      width: '100%',
                                      padding: '0.625rem 0.875rem',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '0.8125rem',
                                      color: 'var(--text-main)',
                                      borderTop: '1px solid #f1f5f9'
                                    }}
                                    onClick={() => { exportAsWord(docObj); setOpenDropdownId(null); }}
                                  >
                                    <FileDown className="w-3.5 h-3.5" style={{ color: '#2563eb' }} /> Download as Word (.docx)
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)', padding: '0.375rem' }}
                            title="Delete document"
                            onClick={(e) => handleDelete(doc.id, e)}
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

      {/* Attach Document Modal */}
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
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>Attach Document / Reference File</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
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

              {/* Format Type Selector & Category */}
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
                    <option value="MOM Export">MOM Export</option>
                  </select>
                </div>
              </div>

              {/* File Picker with Strict Accept Attribute */}
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

              {/* Document Title Input */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                  Document Name / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3_Product_Roadmap_Agenda.pdf"
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

              {/* Link to Meeting */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                  Link to Meeting (Optional)
                </label>
                <select
                  value={selectedMeetingId}
                  onChange={e => setSelectedMeetingId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                >
                  <option value="">General (No specific meeting)</option>
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.date || m.meeting_date})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!!formatError}>
                  <Upload className="w-4 h-4" /> Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
