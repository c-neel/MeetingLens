import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Zap, ArrowRight, Play, CheckCircle2, ShieldCheck, Lock, Mic, Video, Users, 
  Calendar, CheckSquare, FileText, Search, Database, Mail, ChevronDown, ChevronUp, 
  Layers, ExternalLink, Terminal, BarChart2, Cpu, Globe, Activity, 
  Volume2, Check, ArrowUpRight
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#faf8ff', color: '#131b2e', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      
      {/* FLOATING HEADER NAVIGATION */}
      <header style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '1280px',
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
          padding: '0 1.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '9999px',
          border: '1px solid rgba(218, 226, 253, 0.8)',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
          pointerEvents: 'auto'
        }}>
          {/* Logo & Free Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="MeetingLens Logo" style={{ height: '44px', width: 'auto', objectFit: 'contain', cursor: 'pointer' }} />
            </Link>
            <span style={{ 
              padding: '2px 10px', 
              borderRadius: '9999px', 
              backgroundColor: 'rgba(0, 110, 75, 0.1)', 
              border: '1px solid rgba(0, 110, 75, 0.2)', 
              color: '#006e4b', 
              fontSize: '11px', 
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}>
              100% FREE
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="landing-nav-menu" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(242, 243, 255, 0.6)', padding: '4px', borderRadius: '9999px' }}>
            <button className="nav-link-hover" onClick={() => scrollToSection('features')} style={{ border: 'none', background: 'none', padding: '6px 14px', color: '#464555', fontSize: '13px', fontWeight: 500, cursor: 'pointer', borderRadius: '9999px' }}>Product</button>
            <button className="nav-link-hover" onClick={() => scrollToSection('how-it-works')} style={{ border: 'none', background: 'none', padding: '6px 14px', color: '#464555', fontSize: '13px', fontWeight: 500, cursor: 'pointer', borderRadius: '9999px' }}>How It Works</button>
            <button className="nav-link-hover" onClick={() => scrollToSection('features')} style={{ border: 'none', background: 'none', padding: '6px 14px', color: '#464555', fontSize: '13px', fontWeight: 500, cursor: 'pointer', borderRadius: '9999px' }}>Features</button>
            <button className="nav-link-hover" onClick={() => scrollToSection('free-forever')} style={{ border: 'none', background: 'none', padding: '6px 14px', color: '#464555', fontSize: '13px', fontWeight: 500, cursor: 'pointer', borderRadius: '9999px' }}>Why Free?</button>
            <button className="nav-link-hover" onClick={() => scrollToSection('faq')} style={{ border: 'none', background: 'none', padding: '6px 14px', color: '#464555', fontSize: '13px', fontWeight: 500, cursor: 'pointer', borderRadius: '9999px' }}>FAQ</button>
          </nav>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={() => navigate('/login')}
              style={{ padding: '8px 18px', border: '1px solid #c7c4d8', background: '#ffffff', color: '#131b2e', fontSize: '13px', fontWeight: 600, borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/login')}
              style={{ padding: '8px 20px', border: 'none', background: '#3525cd', color: '#ffffff', fontSize: '13px', fontWeight: 600, borderRadius: '9999px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(53, 37, 205, 0.3)', transition: 'all 0.2s' }}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH AMBIENT GLOW */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '100px', overflow: 'hidden' }}>
        {/* Top Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '380px',
          background: 'radial-gradient(ellipse at top, rgba(195, 192, 255, 0.5) 0%, rgba(79, 70, 229, 0.1) 45%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0
        }}></div>

        <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem 3rem 1.5rem', position: 'relative', zIndex: 1 }}>
          <div className="hero-grid-2col">
            
            {/* Left Hero Content */}
            <div>
              
              {/* Badge */}
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '6px 14px', 
                borderRadius: '9999px', 
                backgroundColor: 'rgba(218, 226, 253, 0.7)', 
                border: '1px solid rgba(199, 196, 216, 0.6)', 
                fontSize: '13px', 
                color: '#3525cd',
                marginBottom: '1.25rem',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#006e4b', display: 'inline-block' }}></span>
                <span style={{ fontWeight: 600 }}>Free Forever • Linear, Notion & Calendar Autonomous Sync</span>
              </div>

              {/* Headline */}
              <h1 style={{ 
                fontSize: 'clamp(2.5rem, 4.5vw, 3.5rem)', 
                fontWeight: 800, 
                lineHeight: 1.12, 
                letterSpacing: '-0.03em', 
                color: '#131b2e', 
                marginBottom: '1.25rem' 
              }}>
                Turn Every Meeting <br />
                <span style={{ background: 'linear-gradient(135deg, #3525cd, #4f46e5, #0058be)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Into Action. 100% Free.
                </span>
              </h1>

              {/* Subheadline */}
              <p style={{ fontSize: '1.125rem', lineHeight: 1.6, color: '#464555', maxWidth: '560px', marginBottom: '2rem' }}>
                AI automatically generates minutes, extracts high-conviction action items, assigns ownership, and syncs tasks into your sprint pipelines. No paid tiers, no trials—completely free for everyone.
              </p>

              {/* CTA Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                  onClick={() => navigate('/login')}
                  style={{ 
                    padding: '14px 28px', 
                    borderRadius: '0.75rem', 
                    backgroundColor: '#4f46e5', 
                    color: '#ffffff', 
                    fontSize: '15px', 
                    fontWeight: 700, 
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>Get Started Free — Forever</span>
                  <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => navigate('/voice-meeting')}
                  style={{ 
                    padding: '14px 24px', 
                    borderRadius: '0.75rem', 
                    backgroundColor: '#ffffff', 
                    color: '#131b2e', 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    border: '1px solid #c7c4d8',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <Play size={18} color="#3525cd" />
                  <span>Start Live Voice Meeting</span>
                </button>
              </div>

              {/* Trust Microcopy */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', fontSize: '13px', color: '#464555' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <ShieldCheck size={16} color="#006e4b" />
                  <span style={{ fontWeight: 600, color: '#131b2e' }}>Zero cost • No credit card</span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Video size={16} color="#3525cd" />
                  <span>Zoom, Meet & Teams</span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Lock size={16} color="#0058be" />
                  <span>Private & SOC-2 Ready</span>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Mockup Container (LIVE SESSION MOCKUP) */}
            <div>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.12)',
                border: '1px solid rgba(218, 226, 253, 0.8)',
                overflow: 'hidden'
              }}>
                
                {/* Mockup Top Header */}
                <div style={{ padding: '12px 18px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                    <span style={{ marginLeft: '8px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#64748b', fontWeight: 600 }}>Live Session #STRAT-924</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 12px', borderRadius: '9999px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#991b1b' }}>REC • 34:12</span>
                  </div>
                </div>

                {/* Session Title & Participants Row */}
                <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>Q3 Product Strategy & Alignment</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '13px', color: '#64748b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 600, fontSize: '12px' }}>
                        <Mic size={12} /> Sarah speaking
                      </span>
                      <span>•</span>
                      <span>6 participants</span>
                    </div>
                  </div>

                  {/* Avatars */}
                  <div style={{ display: 'flex', alignItems: 'center', margin: '0 -4px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>SC</div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', marginLeft: '-8px' }}>AM</div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', marginLeft: '-8px' }}>+4</div>
                  </div>
                </div>

                {/* Multi-Pane Live Acoustic & Auto-Tasks Body */}
                <div style={{ padding: '18px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Live Acoustic Stream Card */}
                  <div style={{ padding: '14px 16px', borderRadius: '0.875rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Live Acoustic Stream</span>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '14px' }}>
                        <span className="eq-bar-1" style={{ width: '3px', backgroundColor: '#4f46e5', borderRadius: '2px' }}></span>
                        <span className="eq-bar-2" style={{ width: '3px', backgroundColor: '#4f46e5', borderRadius: '2px' }}></span>
                        <span className="eq-bar-3" style={{ width: '3px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></span>
                        <span className="eq-bar-4" style={{ width: '3px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></span>
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f1f5f9', fontSize: '13.5px', color: '#0f172a', lineHeight: 1.5 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#4f46e5', fontWeight: 700, marginRight: '6px' }}>[34:04] Sarah:</span>
                      "Dave will own the schema migration and ship by Thursday."
                    </div>
                  </div>

                  {/* Auto-Extracted Tasks Card */}
                  <div style={{ padding: '14px 16px', borderRadius: '0.875rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckSquare size={16} color="#4f46e5" /> AUTO-EXTRACTED TASKS
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '9999px' }}>
                        100% Free Sync
                      </span>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#eef2ff', border: '1px solid #e0e7ff', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '5px', backgroundColor: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0 }}>
                          <Check size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Migrate enterprise billing database schema</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '11px', fontWeight: 700 }}>P1 Urgent</span>
                            <span style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={13} /> Thu, Oct 24 • Dave K.
                            </span>
                          </div>
                        </div>
                      </div>

                      <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0, border: '1px solid #bfdbfe' }}>
                        Linear #ENG-402
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* TRUSTED BY TEAMS STRIP */}
      <section style={{ width: '100%', backgroundColor: '#ffffff', padding: '2.5rem 1.5rem', borderTop: '1px solid #e2e7ff', borderBottom: '1px solid #e2e7ff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '1.5rem' }}>
            Powering productivity across modern teams worldwide
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '2.5rem', opacity: 0.75 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 800, color: '#334155' }}><Zap size={20} color="#4f46e5" /> Stripe</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 700, color: '#334155' }}><BarChart2 size={20} color="#3525cd" /> Linear</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 800, color: '#334155' }}><Activity size={20} color="#006e4b" /> Ramp</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 700, color: '#334155' }}><Layers size={20} color="#ef4444" /> Figma</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 700, color: '#334155' }}><Cpu size={20} color="#0058be" /> Retool</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 700, color: '#334155' }}><Globe size={20} color="#4f46e5" /> Datadog</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 800, color: '#334155' }}><Terminal size={20} color="#ba1a1a" /> BREX</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 700, color: '#334155' }}><FileText size={20} color="#0f172a" /> Notion</div>
          </div>
        </div>
      </section>

      {/* 100% FREE FOREVER CALLOUT */}
      <section id="free-forever" style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <div style={{ 
          padding: '2.5rem', 
          borderRadius: '1.5rem', 
          background: 'linear-gradient(135deg, rgba(226,231,255,0.7), rgba(242,243,255,0.5), rgba(216,226,255,0.7))', 
          border: '1px solid rgba(79, 70, 229, 0.25)', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)' 
        }}>
          <div className="free-banner-2col">
            <div>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '4px 12px', 
                borderRadius: '9999px', 
                backgroundColor: '#006e4b', 
                color: '#ffffff', 
                fontSize: '11px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                marginBottom: '1rem'
              }}>
                <Lock size={13} /> Zero Paywalls • 100% Free Forever
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#131b2e', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
                No Subscriptions. No Per-Seat Fees. No Catch.
              </h2>
              <p style={{ fontSize: '15px', color: '#464555', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                MeetingLens believes foundational team alignment should be freely accessible. Enjoy unlimited meeting transcriptions, autonomous Linear and Notion syncing, and executive briefs with no credit card required—ever.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#131b2e' }}>
                  <CheckCircle2 size={18} color="#006e4b" /> Unlimited meetings
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#131b2e' }}>
                  <CheckCircle2 size={18} color="#006e4b" /> Unlimited integrations
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#131b2e' }}>
                  <CheckCircle2 size={18} color="#006e4b" /> Zero data retention
                </div>
              </div>
            </div>
            <div>
              <button 
                onClick={() => navigate('/login')}
                style={{ 
                  width: '100%', 
                  padding: '16px 24px', 
                  borderRadius: '0.75rem', 
                  backgroundColor: '#3525cd', 
                  color: '#ffffff', 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  border: 'none', 
                  cursor: 'pointer', 
                  boxShadow: '0 8px 24px rgba(53, 37, 205, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Start Using Free Now</span>
                <ArrowRight size={18} />
              </button>
              <span style={{ fontSize: '12px', color: '#464555', marginTop: '8px', textAlign: 'center', display: 'block' }}>
                Instant setup • Works on Chrome, Mac, Windows
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (4-STEP FLOW) */}
      <section id="how-it-works" style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
          <span style={{ padding: '4px 14px', borderRadius: '9999px', backgroundColor: '#e2e7ff', color: '#3525cd', fontSize: '13px', fontWeight: 600, display: 'inline-block', marginBottom: '0.75rem' }}>
            Autonomous Flow
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#131b2e', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
            From Live Audio to Solved Tickets
          </h2>
          <p style={{ fontSize: '16px', color: '#464555' }}>
            MeetingLens operates invisibly in the background so you can stay fully present.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          
          {/* Step 1 */}
          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '0.75rem', backgroundColor: '#e2dfff', color: '#3525cd', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                01
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#131b2e', marginBottom: '0.375rem' }}>Capture Audio</h3>
              <p style={{ fontSize: '13px', color: '#464555', lineHeight: 1.6 }}>
                Bot-free native browser or client capture joins Zoom, Meet, or Teams silently.
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f2f3ff', fontSize: '12px', color: '#006e4b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} /> Zero intrusive bots
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '0.75rem', backgroundColor: '#e2dfff', color: '#3525cd', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                02
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#131b2e', marginBottom: '0.375rem' }}>AI Diarization</h3>
              <p style={{ fontSize: '13px', color: '#464555', lineHeight: 1.6 }}>
                Voiceprint recognition detects speaker identity, intent, sentiment, and key decisions.
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f2f3ff', fontSize: '12px', color: '#3525cd', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mic size={15} /> 16kHz Neural Net
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '0.75rem', backgroundColor: '#e2dfff', color: '#3525cd', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                03
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#131b2e', marginBottom: '0.375rem' }}>Extract & Assign</h3>
              <p style={{ fontSize: '13px', color: '#464555', lineHeight: 1.6 }}>
                Verbal promises are resolved to team member handles, priorities, and deadlines.
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f2f3ff', fontSize: '12px', color: '#006e4b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              99.2% accuracy
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '0.75rem', backgroundColor: '#e2dfff', color: '#3525cd', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                04
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#131b2e', marginBottom: '0.375rem' }}>Auto Workspace Sync</h3>
              <p style={{ fontSize: '13px', color: '#464555', lineHeight: 1.6 }}>
                Action items and briefs push directly into Linear, Notion docs, Calendar blocks, and clean Markdown.
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f2f3ff', fontSize: '12px', color: '#0058be', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} /> Instant 2-way sync
            </div>
          </div>

        </div>
      </section>

      {/* CORE CAPABILITIES SHOWCASE */}
      <section id="features" style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
          <span style={{ padding: '4px 14px', borderRadius: '9999px', backgroundColor: '#e2e7ff', color: '#3525cd', fontSize: '13px', fontWeight: 600, display: 'inline-block', marginBottom: '0.75rem' }}>
            Core Capabilities
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#131b2e', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
            Two Powerful Engines in One Free App
          </h2>
          <p style={{ fontSize: '16px', color: '#464555' }}>
            Precision voice intelligence meets autonomous project management.
          </p>
        </div>

        <div className="showcase-grid-2col">
          
          {/* Engine 1 */}
          <div style={{ padding: '2rem', borderRadius: '1.25rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span style={{ padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#e2dfff', color: '#3525cd', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Executive Synthesis
              </span>
            </div>
            <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#131b2e', marginBottom: '0.5rem' }}>Zero-Hallucination Executive Briefs</h3>
            <p style={{ fontSize: '14px', color: '#464555', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Generate high-density notes with consensus meters, key decisions, and timestamped audio proof in under 10 seconds.
            </p>
            
            <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#f2f3ff', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#464555', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <span>Key Decision Log</span>
                <span style={{ color: '#006e4b' }}>94% Team Consensus</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#131b2e', marginBottom: '6px' }}>
                <CheckCircle2 size={16} color="#3525cd" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>Approved: Migrate standard users to annual plans with 15% discount.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#131b2e' }}>
                <CheckCircle2 size={16} color="#3525cd" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>Architecture: Shift workloads to Graviton3; 28% infrastructure savings.</span>
              </div>
            </div>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '13px', color: '#464555' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#006e4b" /> Every bullet links to exact audio timestamp</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#006e4b" /> Department-specific executive summaries (Eng, Sales, Exec)</li>
            </ul>
          </div>

          {/* Engine 2 */}
          <div style={{ padding: '2rem', borderRadius: '1.25rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span style={{ padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#e2dfff', color: '#3525cd', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Task & Workspace Automation
              </span>
              <Layers size={22} color="#3525cd" />
            </div>
            <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#131b2e', marginBottom: '0.5rem' }}>Instant Sync to Linear & Notion</h3>
            <p style={{ fontSize: '14px', color: '#464555', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Spoken commitments auto-resolve to assignee handles, file backlog tasks, and export structured docs before calls conclude.
            </p>

            <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#f2f3ff', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#131b2e' }}>Auto-Dispatched Ticket</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e2dfff', color: '#3525cd', fontSize: '11px', fontWeight: 800 }}>Linear Synced</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#131b2e', marginBottom: '4px' }}>Schema migration for enterprise billing tier</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#464555' }}>
                <span style={{ padding: '1px 6px', borderRadius: '4px', backgroundColor: '#ffdad6', color: '#ba1a1a', fontSize: '10px', fontWeight: 700 }}>P1 Urgent</span>
                <span>• Due Thursday • Assigned to Dave K.</span>
              </div>
            </div>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '13px', color: '#464555' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#006e4b" /> Two-way sync: Closing PR in GitHub closes meeting action item</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#006e4b" /> Automated email & calendar reminders before due dates</li>
            </ul>
          </div>

        </div>
      </section>

      {/* 6 HIGH-IMPACT FEATURE CARDS GRID */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem 3.5rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e2dfff', color: '#3525cd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <FileText size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e', marginBottom: '0.375rem' }}>Instant Structured Minutes</h3>
              <p style={{ fontSize: '13px', color: '#464555', lineHeight: 1.5 }}>
                Full markdown minutes with synthesis, key debates, and open loops exported to Notion in 1 click.
              </p>
            </div>
            <span style={{ marginTop: '1rem', fontSize: '12px', fontWeight: 600, color: '#3525cd', display: 'flex', alignItems: 'center', gap: '4px' }}>Markdown & Notion Ready →</span>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e2dfff', color: '#3525cd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Users size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e', marginBottom: '0.375rem' }}>Auto-Owner Resolution</h3>
              <p style={{ fontSize: '13px', color: '#464555', lineHeight: 1.5 }}>
                Verbal promises match directly to company roster emails and Linear project teams automatically.
              </p>
            </div>
            <span style={{ marginTop: '1rem', fontSize: '12px', fontWeight: 600, color: '#3525cd', display: 'flex', alignItems: 'center', gap: '4px' }}>Auto-Roster Match →</span>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(0,110,75,0.1)', color: '#006e4b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Search size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e', marginBottom: '0.375rem' }}>Instant Global Search</h3>
              <p style={{ fontSize: '13px', color: '#464555', lineHeight: 1.5 }}>
                Search across all past meeting transcripts, decisions, and action items in milliseconds with AI semantic lookup.
              </p>
            </div>
            <span style={{ marginTop: '1rem', fontSize: '12px', fontWeight: 600, color: '#006e4b', display: 'flex', alignItems: 'center', gap: '4px' }}>Sub-50ms Query Speed →</span>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#d8e2ff', color: '#0058be', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Calendar size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e', marginBottom: '0.375rem' }}>Bi-Directional Calendar</h3>
              <p style={{ fontSize: '13px', color: '#464555', lineHeight: 1.5 }}>
                Detects follow-up intervals ("Let's check in 2 weeks") and auto-books slots directly on Google Calendar.
              </p>
            </div>
            <span style={{ marginTop: '1rem', fontSize: '12px', fontWeight: 600, color: '#0058be', display: 'flex', alignItems: 'center', gap: '4px' }}>Focus Block Sync →</span>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e2dfff', color: '#3525cd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e', marginBottom: '0.375rem' }}>Privacy-First & Bot-Free</h3>
              <p style={{ fontSize: '13px', color: '#464555', lineHeight: 1.5 }}>
                Runs privately via browser extension or native client. No intrusive bots and zero model training.
              </p>
            </div>
            <span style={{ marginTop: '1rem', fontSize: '12px', fontWeight: 600, color: '#006e4b', display: 'flex', alignItems: 'center', gap: '4px' }}>Zero Data Retention →</span>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e2dfff', color: '#3525cd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Mail size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e', marginBottom: '0.375rem' }}>Customized Daily Digests</h3>
              <p style={{ fontSize: '13px', color: '#464555', lineHeight: 1.5 }}>
                Attendees receive tailored summaries displaying only the exact commitments pertinent to them.
              </p>
            </div>
            <span style={{ marginTop: '1rem', fontSize: '12px', fontWeight: 600, color: '#3525cd', display: 'flex', alignItems: 'center', gap: '4px' }}>Sent within 60s →</span>
          </div>

        </div>
      </section>

      {/* METRICS & TESTIMONIALS */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        {/* 3 Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          
          <div style={{ padding: '1.75rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #3525cd, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>95%</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e', marginTop: '0.5rem' }}>Less Manual Note-Taking</div>
            <p style={{ fontSize: '13px', color: '#464555', marginTop: '0.25rem' }}>Engineers stay present in conversations while AI captures high-fidelity tasks.</p>
          </div>

          <div style={{ padding: '1.75rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #3525cd, #0058be)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>3.2x</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e', marginTop: '0.5rem' }}>Faster Task Dispatch</div>
            <p style={{ fontSize: '13px', color: '#464555', marginTop: '0.25rem' }}>Architecture decisions land in Linear issue queues before calls conclude.</p>
          </div>

          <div style={{ padding: '1.75rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '2.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #006e4b, #3525cd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>$0</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#131b2e', marginTop: '0.5rem' }}>Completely Free Forever</div>
            <p style={{ fontSize: '13px', color: '#464555', marginTop: '0.25rem' }}>All features completely unlocked for every individual and team.</p>
          </div>

        </div>

        {/* Testimonials Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '14px', color: '#131b2e', fontStyle: 'italic', lineHeight: 1.6 }}>"MeetingLens eliminated 4 hours of weekly status alignment. Having this 100% free is game changing."</p>
            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f2f3ff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#3525cd', color: '#ffffff', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>MS</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#131b2e' }}>Marcus Sterling</div>
                <div style={{ fontSize: '11px', color: '#464555', fontFamily: 'monospace' }}>Head of Product, Ramp</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '14px', color: '#131b2e', fontStyle: 'italic', lineHeight: 1.6 }}>"The Linear integration is pure magic. Action items discussed on Tuesday are deployed by Thursday."</p>
            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f2f3ff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#0058be', color: '#ffffff', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ER</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#131b2e' }}>Elena Rostova</div>
                <div style={{ fontSize: '11px', color: '#464555', fontFamily: 'monospace' }}>VP of Engineering, Datadog</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '14px', color: '#131b2e', fontStyle: 'italic', lineHeight: 1.6 }}>"The automated synthesis is flawless and zero data retention satisfies our strict compliance standards."</p>
            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f2f3ff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#006e4b', color: '#ffffff', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>DV</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#131b2e' }}>David Vance</div>
                <div style={{ fontSize: '11px', color: '#464555', fontFamily: 'monospace' }}>Chief of Staff, Brex</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* COMPACT FAQ ACCORDION */}
      <section id="faq" style={{ maxWidth: '800px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ padding: '4px 14px', borderRadius: '9999px', backgroundColor: '#e2e7ff', color: '#3525cd', fontSize: '13px', fontWeight: 600, display: 'inline-block', marginBottom: '0.75rem' }}>
            Common Questions
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#131b2e', letterSpacing: '-0.025em' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* FAQ 1 */}
          <div style={{ borderRadius: '0.75rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
            <button 
              onClick={() => toggleFaq(0)}
              style={{ width: '100%', padding: '1.25rem 1.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#131b2e', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span>Is MeetingLens really 100% free forever?</span>
              {openFaq === 0 ? <ChevronUp size={20} color="#3525cd" /> : <ChevronDown size={20} color="#64748b" />}
            </button>
            {openFaq === 0 && (
              <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', fontSize: '14px', color: '#464555', lineHeight: 1.6 }}>
                Yes! MeetingLens is 100% free for all users and teams. There are no credit cards required, no trial limits, no hidden fees, and no per-seat subscription paywalls. All features including Linear and Notion integrations are fully unlocked.
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div style={{ borderRadius: '0.75rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
            <button 
              onClick={() => toggleFaq(1)}
              style={{ width: '100%', padding: '1.25rem 1.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#131b2e', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span>Does MeetingLens require an annoying recording bot?</span>
              {openFaq === 1 ? <ChevronUp size={20} color="#3525cd" /> : <ChevronDown size={20} color="#64748b" />}
            </button>
            {openFaq === 1 && (
              <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', fontSize: '14px', color: '#464555', lineHeight: 1.6 }}>
                No. MeetingLens captures audio bot-free via direct system audio in our desktop app or lightweight browser extension. No bot will ever intrude or join participant grids unless you specifically opt into calendar auto-joining.
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div style={{ borderRadius: '0.75rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
            <button 
              onClick={() => toggleFaq(2)}
              style={{ width: '100%', padding: '1.25rem 1.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#131b2e', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span>Is our meeting audio and transcript data private?</span>
              {openFaq === 2 ? <ChevronUp size={20} color="#3525cd" /> : <ChevronDown size={20} color="#64748b" />}
            </button>
            {openFaq === 2 && (
              <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', fontSize: '14px', color: '#464555', lineHeight: 1.6 }}>
                Strictly private. We operate on strict Zero Data Retention policies. Your transcripts and recordings are encrypted in transit and at rest and are never used to train any AI foundation models.
              </div>
            )}
          </div>

          {/* FAQ 4 */}
          <div style={{ borderRadius: '0.75rem', backgroundColor: '#ffffff', border: '1px solid rgba(199, 196, 216, 0.6)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
            <button 
              onClick={() => toggleFaq(3)}
              style={{ width: '100%', padding: '1.25rem 1.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#131b2e', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span>Which tools does MeetingLens integrate with?</span>
              {openFaq === 3 ? <ChevronUp size={20} color="#3525cd" /> : <ChevronDown size={20} color="#64748b" />}
            </button>
            {openFaq === 3 && (
              <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', fontSize: '14px', color: '#464555', lineHeight: 1.6 }}>
                MeetingLens connects directly with Linear, Notion, Google Calendar, and Google Docs, alongside native export to Markdown and automated email digests. Tasks automatically map to assignee handles with priority and deadline metadata.
              </div>
            )}
          </div>

        </div>
      </section>

      {/* FINAL PUNCHY CTA BANNER */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <div style={{ 
          padding: '4rem 2rem', 
          borderRadius: '1.75rem', 
          background: 'linear-gradient(135deg, #3525cd, #4f46e5, #0058be)', 
          color: '#ffffff', 
          boxShadow: '0 20px 40px rgba(53, 37, 205, 0.3)', 
          textAlign: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}>
          <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <span style={{ padding: '4px 14px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
              Free Forever • Ready in 2 minutes
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15 }}>
              Stop Losing Action Items After Meetings.
            </h2>
            <p style={{ fontSize: '1.125rem', opacity: 0.95, lineHeight: 1.6 }}>
              Transform meetings into automated, tracked sprint velocity. 100% free for everyone, forever.
            </p>
            <div style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => navigate('/login')}
                style={{ 
                  padding: '16px 36px', 
                  borderRadius: '0.75rem', 
                  backgroundColor: '#ffffff', 
                  color: '#3525cd', 
                  fontSize: '16px', 
                  fontWeight: 800, 
                  border: 'none', 
                  cursor: 'pointer', 
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s'
                }}
              >
                Get Started Free — Forever
              </button>
            </div>
            <span style={{ fontSize: '13px', opacity: 0.8, marginTop: '0.5rem' }}>
              No credit card required • Unlimited access • Works with Google Meet, Teams & Notion
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ width: '100%', backgroundColor: '#ffffff', borderTop: '1px solid #e2e7ff', paddingTop: '3.5rem', paddingBottom: '2.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', paddingBottom: '2.5rem' }}>
            
            {/* Column 1: Brand */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <img src="/logo.png" alt="MeetingLens Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#464555', maxWidth: '320px', lineHeight: 1.6, marginBottom: '1rem' }}>
                Enterprise-grade meeting intelligence and autonomous execution, 100% free for everyone.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#faf8ff', border: '1px solid #e2e7ff' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#464555' }}>All systems operational</span>
              </div>
            </div>

            {/* Column 2: Product */}
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#131b2e', marginBottom: '1rem' }}>Product</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '13px', color: '#464555' }}>
                <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('features')}>Real-time Diarization</li>
                <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('features')}>Linear & Notion Sync</li>
                <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('features')}>Action Extraction</li>
                <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('features')}>Calendar Integration</li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#131b2e', marginBottom: '1rem' }}>Resources</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '13px', color: '#464555' }}>
                <li style={{ cursor: 'pointer' }}>Documentation</li>
                <li style={{ cursor: 'pointer' }}>API Reference</li>
                <li style={{ cursor: 'pointer' }}>Privacy & Security</li>
                <li style={{ cursor: 'pointer' }}>Community</li>
              </ul>
            </div>

            {/* Column 4: Company */}
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#131b2e', marginBottom: '1rem' }}>Company</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '13px', color: '#464555' }}>
                <li style={{ cursor: 'pointer' }}>About Us</li>
                <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('free-forever')}>Why Free?</li>
                <li style={{ cursor: 'pointer' }}>Privacy Policy</li>
                <li style={{ cursor: 'pointer' }}>Terms of Service</li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #e2e7ff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '13px', color: '#464555' }}>
            <p>© 2026 MeetingLens Inc. 100% Free Forever.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span>SOC-2 Type II</span>
              <span>HIPAA Compliant</span>
              <span>GDPR Ready</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
