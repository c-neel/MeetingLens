import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Copy, Check, Bot, User, RefreshCw } from 'lucide-react';
import { sendMeetingChatMessage } from '../services/api';

export default function MeetingAIChat({ meeting }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I am your AI Assistant for **"${meeting?.title || 'this meeting'}"**.\n\nI have reviewed the transcript, decisions, action items, and risks. Ask me anything about this meeting, or request follow-up drafts!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || isTyping) return;

    const userMessage = {
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setInputPrompt('');
    setIsTyping(true);

    try {
      const res = await sendMeetingChatMessage(meeting, textToSend);
      const aiReply = {
        sender: 'ai',
        text: res.reply || 'No response generated.',
        aiPowered: res.ai_powered,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Sorry, I encountered an issue fetching AI suggestions. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickPrompts = [
    "💡 What were the key decisions?",
    "📩 Draft a follow-up email to participants",
    "⚠️ What are the top risks & blockers?",
    "📋 Summarize all action items and assignees",
    "🚀 Give 3 recommendations for next sprint"
  ];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: 0, overflow: 'hidden' }}>
      {/* Chat Header */}
      <div style={{ padding: '1rem 1.25rem', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>AI Meeting Copilot</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Context-Aware Assistant • {meeting?.title}</div>
          </div>
        </div>
        <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>Gemini 3.6 Active</span>
      </div>

      {/* Suggestion Chips */}
      <div style={{ padding: '0.625rem 1rem', background: '#f8fafc', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.375rem', overflowX: 'auto' }}>
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(qp)}
            style={{
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              borderRadius: '9999px',
              border: '1px solid #cbd5e1',
              background: 'white',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              color: '#334155',
              fontWeight: 500
            }}
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, idx) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                flexDirection: isAi ? 'row' : 'row-reverse'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isAi ? '#0058be' : '#475569',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div style={{
                maxWidth: '80%',
                background: isAi ? 'white' : '#0058be',
                color: isAi ? '#0f172a' : 'white',
                padding: '0.875rem 1.125rem',
                borderRadius: isAi ? '0 12px 12px 12px' : '12px 0 12px 12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                position: 'relative'
              }}>
                {msg.text}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.375rem', borderTop: isAi ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.2)', fontSize: '0.6875rem', opacity: 0.8 }}>
                  <span>{msg.timestamp}</span>
                  {isAi && (
                    <button
                      onClick={() => copyToClipboard(msg.text, idx)}
                      style={{ background: 'none', border: 'none', color: '#0058be', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', fontWeight: 600 }}
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                      {copiedIndex === idx ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0058be', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot className="w-4 h-4" />
            </div>
            <div style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '0 12px 12px 12px', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> MeetAI is analyzing and generating response...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ padding: '0.875rem 1rem', background: 'white', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Ask MeetAI anything about this meeting..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          style={{
            flex: 1,
            padding: '0.625rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={isTyping || !inputPrompt.trim()}>
          <Send className="w-4 h-4" /> Send
        </button>
      </form>
    </div>
  );
}
