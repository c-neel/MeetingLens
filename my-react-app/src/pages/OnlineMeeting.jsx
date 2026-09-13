import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Video, Mic, MicOff, VideoOff, Monitor, MessageSquare, Users, PhoneOff, Copy, Check, Sparkles, AlertCircle, Loader2, Play, Square } from 'lucide-react';
import { processTranscript, saveMeeting } from '../services/api';

export default function OnlineMeeting() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Meeting states
  const [roomName, setRoomName] = useState(searchParams.get('room') || '');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [inCall, setInCall] = useState(false);
  const [copied, setCopied] = useState(false);

  // Audio recording & Speech-to-Text states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Post-meeting AI Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // User details
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = savedUser.name || 'User';

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Format recording timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Generate random room code
  const generateRoomName = () => {
    const code = 'MeetAI-' + Math.random().toString(36).substring(2, 9);
    setRoomName(code);
  };

  // Start Meeting Call
  const handleStartCall = (e) => {
    if (e) e.preventDefault();
    if (!roomName.trim()) {
      alert('Please enter or generate a meeting room name.');
      return;
    }
    const title = meetingTitle.trim() || roomName.trim();
    setMeetingTitle(title);
    setInCall(true);

    // Auto-start audio recording and speech recognition
    startAudioTranscription();
  };

  // Start Speech Recognition / Transcription
  const startAudioTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      setIsRecording(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        if (currentTranscript.trim()) {
          setTranscript(currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        if (isRecording) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
    }
  };

  // Toggle Manual Recording
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
    } else {
      startAudioTranscription();
    }
  };

  // End Meeting Call
  const handleEndCall = async () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    // If transcript exists, automatically analyze with Gemini AI
    if (transcript.trim().length > 10) {
      setInCall(false);
      setIsAnalyzing(true);
      try {
        const result = await processTranscript(transcript, meetingTitle || roomName);
        setAiResult(result);
      } catch (err) {
        setAnalysisError(err);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setInCall(false);
    }
  };

  // Save AI Meeting Results to Database
  const handleSaveMeetingData = async () => {
    if (!aiResult) return;
    const meetingData = {
      title: meetingTitle || roomName,
      date: new Date().toISOString().split('T')[0],
      source: 'online_meeting',
      transcript: transcript,
      summary: aiResult.summary,
      executive_summary: aiResult.executive_summary,
      decisions: aiResult.decisions,
      actionItems: aiResult.actionItems,
      quality_score: aiResult.quality_score
    };

    const saved = await saveMeeting(meetingData);
    navigate(`/meetings/${saved.id || 1}`);
  };

  // Copy shareable meeting link
  const copyMeetingLink = () => {
    const url = `${window.location.origin}/online-meeting?room=${encodeURIComponent(roomName)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}#userInfo.displayName="${encodeURIComponent(userName)}"&config.startWithAudioMuted=false&config.prejoinPageEnabled=false`;

  return (
    <div className="animate-fadeIn">
      {/* Title */}
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span>Online Video Meeting</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.75rem', fontWeight: 'normal' }}>
            (20 Person Capacity • Video • Audio • Screen Share • Chat)
          </span>
        </div>
        {inCall && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.75rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
              {isRecording ? `REC (${formatTime(recordingDuration)})` : 'LIVE CALL'}
            </span>
            <button className="btn btn-outline btn-sm" onClick={copyMeetingLink}>
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Link Copied!' : 'Copy Join Link'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleEndCall}>
              <PhoneOff className="w-3.5 h-3.5" /> Leave Meeting
            </button>
          </div>
        )}
      </div>

      {/* ================= Setup Form (Not in Call & Not Analyzing & No Results) ================= */}
      {!inCall && !isAnalyzing && !aiResult && (
        <div className="card" style={{ maxWidth: '650px', margin: '1rem auto', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Video className="w-8 h-8" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Start or Join Online Video Conference</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Host live HD video meetings for up to 20 participants with automatic audio recording, live speech transcript, and AI summary.
            </p>
          </div>

          <form onSubmit={handleStartCall} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                Meeting Topic / Title
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Q3 Roadmap Review with Product Team"
                value={meetingTitle}
                onChange={e => setMeetingTitle(e.target.value)}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Room Code / Name *
                </label>
                <button
                  type="button"
                  onClick={generateRoomName}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  ⚡ Generate Room Code
                </button>
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. MeetAI-ProjectSync-2026"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                required
              />
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Users className="w-4 h-4 text-primary" /> Supported Meeting Features:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                <li>Up to <strong>20 participants</strong> with multi-speaker audio/video</li>
                <li><strong>Screen Sharing</strong> (entire screen, browser tab, or app window)</li>
                <li><strong>In-Meeting Live Chat</strong> for team communication</li>
                <li><strong>Automatic Audio Recording & Speech Transcription</strong> during call</li>
                <li><strong>AI Meeting Assistant</strong> generates summary & tasks upon leaving</li>
              </ul>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              <Video className="w-5 h-5" /> Launch Video Meeting Room
            </button>
          </form>
        </div>
      )}

      {/* ================= Active Meeting Room (In Call) ================= */}
      {inCall && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', minHeight: 'calc(100vh - 160px)' }}>
          {/* Main Video Frame */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', background: '#000' }}>
            <iframe
              ref={jitsiContainerRef}
              src={jitsiUrl}
              title="Online Video Meeting Room"
              style={{ width: '100%', height: '100%', minHeight: '560px', border: 'none' }}
              allow="camera; microphone; display-capture; autoplay; clipboard-write; self; fullscreen"
            />
          </div>

          {/* Sidebar: Live Audio Transcript & AI Assistant Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Mic className="w-4 h-4 text-danger" /> Live Speech Transcript
                </div>
                <button
                  className={`btn btn-xs ${isRecording ? 'btn-danger' : 'btn-outline'}`}
                  onClick={toggleRecording}
                  style={{ fontSize: '0.75rem' }}
                >
                  {isRecording ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isRecording ? 'Pause' : 'Record'}
                </button>
              </div>

              <div style={{
                flex: 1,
                background: '#f8fafc',
                padding: '0.875rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontFamily: 'sans-serif',
                fontSize: '0.8125rem',
                lineHeight: 1.6,
                overflowY: 'auto',
                maxHeight: '380px',
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap'
              }}>
                {transcript || (
                  <span style={{ color: 'var(--text-muted)', italic: 'true' }}>
                    🎤 Audio recording active. Speak into your microphone to generate live transcript...
                  </span>
                )}
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 When you click <strong>Leave Meeting</strong>, AI will automatically analyze this transcript to generate Minutes of Meeting & Action Items.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= Analyzing State ================= */}
      {isAnalyzing && (
        <div className="card" style={{ maxWidth: '550px', margin: '3rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
          <Loader2 className="w-12 h-12 animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>AI Meeting Intelligence</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Analyzing transcript from online meeting <strong>"{meetingTitle || roomName}"</strong>...
          </p>
        </div>
      )}

      {/* ================= AI Results State ================= */}
      {aiResult && (
        <div className="card" style={{ maxWidth: '850px', margin: '1rem auto', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div>
              <span className="badge badge-success" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles className="w-3.5 h-3.5" /> Online Meeting AI Analysis
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>{meetingTitle || roomName}</h2>
            </div>
            <button className="btn btn-primary" onClick={handleSaveMeetingData}>
              Save to Workspace
            </button>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>Executive Summary</h4>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {aiResult.executive_summary}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>Key Decisions</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
              {aiResult.decisions.map((d, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{d}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>Extracted Action Items ({aiResult.actionItems?.length || 0})</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {aiResult.actionItems?.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{item.task}</td>
                      <td>{item.assignee}</td>
                      <td>{(item.dueDate && item.dueDate !== 'No Deadline' && item.dueDate !== 'null' && item.dueDate !== '-') ? item.dueDate : (item.due_date && item.due_date !== 'No Deadline' && item.due_date !== 'null' && item.due_date !== '-') ? item.due_date : 'No Deadline'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setAiResult(null)}>Close</button>
            <button className="btn btn-primary" onClick={handleSaveMeetingData}>Save to Meetings</button>
          </div>
        </div>
      )}
    </div>
  );
}
