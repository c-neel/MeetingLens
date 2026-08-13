import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Pause, Play, Download, ArrowRight, Loader2 } from 'lucide-react';
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
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

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
        // Restart silently
        try { recognition.start(); } catch(e) {}
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording
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

  const handleSave = async () => {
    const meeting = {
      title,
      date: new Date().toISOString().split('T')[0],
      source: 'voice',
      duration: formatTime(seconds),
      transcript: transcript,
      summary: results.summary,
      executive_summary: results.executive_summary,
      detailed_summary: results.detailed_summary,
      decisions: results.decisions,
      actionItems: results.actionItems,
      quality_score: results.quality_score
    };
    const saved = await saveMeeting(meeting);
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

        <div className="card">
          <h3 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>Action Items</h3>
          <table><thead><tr><th>Task</th><th>Confidence</th></tr></thead>
            <tbody>
              {results.actionItems.map((item, i) => (
                <tr key={i}>
                  <td>{item.task}</td>
                  <td><div className="confidence-bar"><div className="confidence-track"><div className="confidence-fill" style={{ width: `${item.confidence}%` }}></div></div>{item.confidence}%</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
