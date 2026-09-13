import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Upload, Mic, CheckSquare, BarChart3, FileText, Shield, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="MeetingLens Logo" style={{ height: '52px', width: 'auto', objectFit: 'contain', cursor: 'pointer' }} />
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Log In</button>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </nav>

      <section className="landing-hero">
        <h1>Turn Every Meeting<br />Into <span>Action</span></h1>
        <p>AI-powered meeting intelligence that transforms conversations and documents into structured minutes, actionable tasks, smart recommendations, and automated reminders.</p>
        <div className="landing-cta">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
            <Upload className="w-5 h-5" /> Get Started
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/voice-meeting')}>
            <Mic className="w-5 h-5" /> Start Voice Meeting
          </button>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-row">
          <div className="step-item">
            <div className="step-number">1</div>
            <h4>Upload or Record</h4>
            <p>Upload a transcript or start a live voice meeting</p>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <h4>AI Analyzes</h4>
            <p>Our AI extracts summaries, decisions, tasks, and risks</p>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <h4>Review & Approve</h4>
            <p>Review AI-generated tasks and set completion deadlines</p>
          </div>
          <div className="step-item">
            <div className="step-number">4</div>
            <h4>Track & Execute</h4>
            <p>Manage tasks, set reminders, and track progress</p>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <FileText className="w-7 h-7" />
          </div>
          <h3>Smart File Analysis</h3>
          <p>Upload TXT, PDF, or DOCX files. AI extracts meeting minutes, decisions, and action items automatically.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <Mic className="w-7 h-7" />
          </div>
          <h3>Live Voice Meeting</h3>
          <p>Record meetings directly in your browser with real-time transcription powered by Web Speech API.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <CheckSquare className="w-7 h-7" />
          </div>
          <h3>Task Automation</h3>
          <p>AI detects action items with assignees, deadlines, and priorities. Review and approve before saving.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
            <Shield className="w-7 h-7" />
          </div>
          <h3>Deadline Management</h3>
          <p>Assign tasks to team members or yourself with custom deadlines and priority levels.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
            <ArrowRight className="w-7 h-7" />
          </div>
          <h3>Complete Workflow</h3>
          <p>From capture to execution — summaries, tasks, reminders, exports, and sharing in one platform.</p>
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--primary)', color: 'white' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Ready to Transform Your Meetings?</h2>
        <p style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '2rem' }}>Start analyzing your first meeting in under 60 seconds.</p>
        <button className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)', fontWeight: 600 }} onClick={() => navigate('/login')}>
          Get Started Free <ArrowRight className="w-5 h-5" />
        </button>
      </section>
    </div>
  );
}
