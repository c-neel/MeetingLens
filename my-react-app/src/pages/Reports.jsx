import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Download, 
  ArrowDownToLine, 
  RefreshCw, 
  AlertCircle, 
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckSquare,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { getReportData, getReportPdfUrl, getReportCsvUrl } from '../services/api';

export default function Reports() {
  const navigate = useNavigate();
  const [activePreset, setActivePreset] = useState('quarter');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [changedFields, setChangedFields] = useState({});
  const [isInteracting, setIsInteracting] = useState(false);
  const [showAllConversions, setShowAllConversions] = useState(false);

  const prevReportRef = useRef(null);
  const interactionTimeoutRef = useRef(null);
  const datesRef = useRef({ startDate: '', endDate: '' });

  // Keep datesRef updated for interval callback
  useEffect(() => {
    datesRef.current = { startDate, endDate };
  }, [startDate, endDate]);

  // Compute preset dates based on calendar
  const computePresetDates = (preset) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (preset === 'week') {
      const d = new Date(today);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      const mYYYY = d.getFullYear();
      const mMM = String(d.getMonth() + 1).padStart(2, '0');
      const mDD = String(d.getDate()).padStart(2, '0');
      return { start: `${mYYYY}-${mMM}-${mDD}`, end: todayStr };
    } else if (preset === 'month') {
      return { start: `${yyyy}-${mm}-01`, end: todayStr };
    } else if (preset === 'quarter') {
      const currentMonth = today.getMonth(); // 0-11
      const qStartMonth = Math.floor(currentMonth / 3) * 3 + 1;
      const qMM = String(qStartMonth).padStart(2, '0');
      return { start: `${yyyy}-${qMM}-01`, end: todayStr };
    }
    return { start: `${yyyy}-${mm}-01`, end: todayStr };
  };

  // Fetch report data: silent = background polling without full page loading spinner
  const fetchReport = useCallback(async (sDate, eDate, preset = activePreset, isSilent = false) => {
    if (!sDate || !eDate) return;
    if (isSilent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getReportData(sDate, eDate, preset);
      if (data && data.success) {
        // Detect KPI changes to trigger pulse highlight
        if (prevReportRef.current) {
          const prev = prevReportRef.current;
          const diffs = {};
          if (prev.total_meetings !== data.total_meetings) diffs.meetings = true;
          if (prev.total_tasks !== data.total_tasks) diffs.tasks = true;
          if (prev.completed_tasks !== data.completed_tasks) diffs.completed = true;
          if (prev.pending_tasks !== data.pending_tasks) diffs.pending = true;
          if (prev.overdue_tasks !== data.overdue_tasks) diffs.overdue = true;
          if (prev.avg_confidence !== data.avg_confidence) diffs.confidence = true;

          if (Object.keys(diffs).length > 0) {
            setChangedFields(diffs);
            setTimeout(() => setChangedFields({}), 2500);
          }
        }

        prevReportRef.current = data;
        setReport(data);
        setLastUpdated(Date.now());
        setSecondsAgo(0);
      } else {
        if (!isSilent) setError(data?.message || 'Unable to fetch report data.');
      }
    } catch (err) {
      if (!isSilent) setError('Failed to connect to reports API. Please check backend connection.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activePreset]);

  // Initial load
  useEffect(() => {
    const initial = computePresetDates('quarter');
    setStartDate(initial.start);
    setEndDate(initial.end);
    fetchReport(initial.start, initial.end, 'quarter', false);
  }, [fetchReport]);

  // Real-time tick timer for "Last updated: X seconds ago"
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [lastUpdated]);

  // Real-time Background Polling (Every 35 seconds, pauses when hidden or interacting)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Skip if document is in hidden background tab (Page Visibility API)
      if (document.hidden) return;

      // 2. Skip if user is actively interacting (e.g. typing in date picker)
      if (isInteracting) return;

      // 3. Skip if no active report or date range
      const { startDate: s, endDate: e } = datesRef.current;
      if (s && e) {
        fetchReport(s, e, activePreset, true);
      }
    }, 35000);

    return () => clearInterval(interval);
  }, [fetchReport, isInteracting, activePreset]);

  // Handlers for user interaction pause
  const handleInteractionStart = () => {
    setIsInteracting(true);
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
  };

  const handleInteractionEnd = () => {
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 3000);
  };

  const handlePresetChange = (preset) => {
    handleInteractionStart();
    setActivePreset(preset);
    if (preset !== 'custom') {
      const dates = computePresetDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
      fetchReport(dates.start, dates.end, preset, false);
    }
    handleInteractionEnd();
  };

  const handleGenerateClick = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Please select both a start date and an end date.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    fetchReport(startDate, endDate, activePreset, false);
  };

  const handleManualRefresh = () => {
    if (startDate && endDate) {
      fetchReport(startDate, endDate, activePreset, true);
    }
  };

  const handleExportPDF = () => {
    handleInteractionStart();
    const url = getReportPdfUrl(startDate, endDate, activePreset);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `productivity_report_${startDate}_to_${endDate}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleInteractionEnd();
  };

  const handleExportCSV = () => {
    handleInteractionStart();
    const url = getReportCsvUrl(startDate, endDate, activePreset);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `productivity_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleInteractionEnd();
  };

  // Plain-text summary template line (no AI)
  const getSummarySentence = (rep) => {
    if (!rep) return '';
    const meetings = rep.total_meetings ?? 0;
    const tasks = rep.total_tasks ?? 0;
    const overdue = rep.overdue_tasks ?? 0;
    const completed = rep.completed_tasks ?? 0;
    const rate = rep.completion_pct ?? 0;

    if (meetings === 0 && tasks === 0) {
      return 'No meeting or task activity was recorded during this timeframe.';
    }

    const meetingStr = `${meetings} meeting${meetings === 1 ? '' : 's'}`;
    const taskStr = `${tasks} task${tasks === 1 ? '' : 's'}`;
    const overdueStr = overdue > 0 ? `, with ${overdue} currently overdue` : ', with 0 overdue tasks';
    const compStr = ` (${completed} completed, ${rate}% completion rate)`;

    return `This period had ${meetingStr} and ${taskStr} created${overdueStr}${compStr}.`;
  };

  // Comparison delta indicator
  const renderDelta = (delta, unit = '', invertColor = false) => {
    if (delta === undefined || delta === null) return null;
    const isZero = delta === 0;
    const isPositive = delta > 0;
    
    let color = 'var(--text-muted)';
    let bg = '#f1f5f9';

    if (!isZero) {
      if (invertColor) {
        color = isPositive ? '#dc2626' : '#16a34a';
        bg = isPositive ? '#fef2f2' : '#f0fdf4';
      } else {
        color = isPositive ? '#16a34a' : '#dc2626';
        bg = isPositive ? '#f0fdf4' : '#fef2f2';
      }
    }

    const arrow = isZero ? <Minus className="w-3 h-3" /> : (isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />);
    const sign = isPositive ? '+' : '';
    const text = isZero ? 'Unchanged vs prior' : `${sign}${delta}${unit} vs prior period`;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.2rem',
        fontSize: '0.6875rem',
        fontWeight: 600,
        color: color,
        background: bg,
        padding: '0.15rem 0.45rem',
        borderRadius: '4px',
        marginTop: '0.25rem'
      }}>
        {arrow}
        <span>{text}</span>
      </span>
    );
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // Productivity Trend Over Time SVG Line/Area Chart
  const renderProductivityTrendChart = (trend) => {
    if (!trend || trend.length === 0) {
      return (
        <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No historical trend activity recorded across these periods.
        </div>
      );
    }

    const width = 780;
    const height = 180;
    const padX = 45;
    const padY = 25;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;
    const n = trend.length;

    const points = trend.map((pt, i) => {
      const x = n === 1 ? width / 2 : padX + (i / (n - 1)) * chartW;
      const rate = Math.max(0, Math.min(100, pt.completion_rate || 0));
      const y = padY + chartH - (rate / 100) * chartH;
      return { 
        x, 
        y, 
        rate, 
        period: pt.period, 
        subLabel: pt.sub_label || pt.period,
        total: pt.total_tasks, 
        completed: pt.completed_tasks 
      };
    });

    const pathLine = points.length === 1
      ? `M ${padX} ${points[0].y} L ${width - padX} ${points[0].y}`
      : points.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '');

    const areaPath = points.length === 1
      ? `M ${padX} ${points[0].y} L ${width - padX} ${points[0].y} L ${width - padX} ${padY + chartH} L ${padX} ${padY + chartH} Z`
      : `${pathLine} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block', minWidth: '500px' }}>
          <defs>
            <linearGradient id="prodTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines at 100%, 75%, 50%, 25%, 0% */}
          {[1, 0.75, 0.5, 0.25, 0].map((pct, idx) => {
            const y = padY + chartH * (1 - pct);
            return (
              <g key={idx}>
                <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e2e8f0" strokeDasharray={pct === 0 ? 'none' : '3 3'} strokeWidth="1" />
                <text x={padX - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="500">
                  {Math.round(pct * 100)}%
                </text>
              </g>
            );
          })}

          {/* Gradient Shaded Area */}
          <path d={areaPath} fill="url(#prodTrendGradient)" />

          {/* Stroke Line */}
          <path d={pathLine} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points & Interactive Tooltips */}
          {points.map((pt, i) => (
            <g key={'trend-pt-' + i}>
              {/* Rate percentage badge */}
              <text 
                x={pt.x} 
                y={Math.max(15, pt.y - 9)} 
                textAnchor="middle" 
                fontSize="11" 
                fontWeight="700" 
                fill="#1e293b"
              >
                {pt.rate}%
              </text>

              {/* Data circle with native browser title tooltip */}
              <circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5">
                <title>{`${pt.period}: ${pt.rate}% completion (${pt.completed} of ${pt.total} tasks completed)`}</title>
              </circle>

              {/* Period X-Axis label */}
              <text x={pt.x} y={height - 7} textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
                {pt.period}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const deltas = report?.comparison?.delta || {};

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Top Filter & Period Toolbar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Preset Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
            Period:
          </span>
          {[
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'quarter', label: 'This Quarter' }
          ].map(pill => (
            <button
              key={pill.id}
              type="button"
              onClick={() => handlePresetChange(pill.id)}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: activePreset === pill.id ? 600 : 500,
                border: activePreset === pill.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: activePreset === pill.id ? 'var(--primary-light)' : '#ffffff',
                color: activePreset === pill.id ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Date Inputs & Generate */}
        <form onSubmit={handleGenerateClick} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <input 
              type="date"
              value={startDate}
              onFocus={handleInteractionStart}
              onBlur={handleInteractionEnd}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('custom');
              }}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '0.8125rem',
                color: 'var(--text-main)',
                background: '#fff',
                outline: 'none'
              }}
              required
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>to</span>
            <input 
              type="date"
              value={endDate}
              onFocus={handleInteractionStart}
              onBlur={handleInteractionEnd}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('custom');
              }}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '0.8125rem',
                color: 'var(--text-main)',
                background: '#fff',
                outline: 'none'
              }}
              required
            />
          </div>

          <button 
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', height: '32px' }}
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Generate</span>
          </button>
        </form>
      </div>

      {error && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontSize: '0.875rem' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Full Page Initial Loader */}
      {loading && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.25rem' }}>Generating Productivity Report</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Analyzing meetings, tasks, and role-scoped metrics across {startDate} to {endDate}...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && report && report.total_meetings === 0 && report.total_tasks === 0 && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Calendar className="w-6 h-6" />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No activity recorded in this period</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            Zero meetings or tasks were found between <strong>{formatDateDisplay(startDate)}</strong> and <strong>{formatDateDisplay(endDate)}</strong>. Select <em>"This Quarter"</em> or pick a custom range with past data.
          </p>
          <button className="btn btn-outline btn-sm" onClick={() => handlePresetChange('quarter')}>
            Switch to This Quarter
          </button>
        </div>
      )}

      {/* =========================================================================
          THE REPORT SHEET (Document Layout)
         ========================================================================= */}
      {!loading && report && (report.total_meetings > 0 || report.total_tasks > 0) && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          padding: '2.5rem 2.5rem',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
          position: 'relative'
        }}>
          
          {/* Top Document Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1.5rem',
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ flex: 1, minWidth: '320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px'
                }}>
                  Official Productivity Report
                </span>

                {/* Personal Badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: '#f0fdf4',
                  color: '#16a34a'
                }}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Personal Report</span>
                </span>

                {/* Live Real-time Status Indicator */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginLeft: 'auto'
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: isRefreshing ? 'var(--warning)' : 'var(--success)',
                    display: 'inline-block'
                  }}></span>
                  <span>
                    Last updated: {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
                  </span>
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    title="Refresh live data now"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '2px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                  </button>
                </div>
              </div>

              <h1 style={{
                fontSize: '1.625rem',
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                margin: '0 0 0.5rem 0'
              }}>
                Productivity Report — {formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}
              </h1>

              {/* Template Generated Summary Sentence */}
              <p style={{
                margin: 0,
                fontSize: '0.9375rem',
                color: '#334155',
                lineHeight: 1.55,
                background: '#f8fafc',
                borderLeft: '3px solid var(--primary)',
                padding: '0.625rem 0.875rem',
                borderRadius: '0 6px 6px 0'
              }}>
                {getSummarySentence(report)}
              </p>
            </div>

            {/* Pinned Export Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', alignSelf: 'flex-start' }}>
              <button 
                className="btn btn-outline btn-sm"
                onClick={handleExportCSV}
                title="Download CSV report"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '36px', background: '#fff' }}
              >
                <ArrowDownToLine className="w-4 h-4 text-primary" />
                <span style={{ fontWeight: 600 }}>Export CSV</span>
              </button>

              <button 
                className="btn btn-primary btn-sm"
                onClick={handleExportPDF}
                title="Download real PDF binary document"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '36px', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)' }}
              >
                <Download className="w-4 h-4" />
                <span style={{ fontWeight: 600 }}>Export PDF</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              COMPACT HORIZONTAL KPI STRIP WITH CHANGE PULSE ANIMATION
             ========================================================================= */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            marginBottom: '2rem',
            overflow: 'hidden'
          }}>
            {/* KPI 1: Meetings */}
            <div style={{
              padding: '1rem 1.25rem',
              borderRight: '1px solid #e2e8f0',
              transition: 'background-color 0.4s ease',
              backgroundColor: changedFields.meetings ? '#eff6ff' : 'transparent'
            }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Total Meetings
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {report.total_meetings}
              </div>
              {renderDelta(deltas.meetings)}
            </div>

            {/* KPI 2: Tasks Created */}
            <div style={{
              padding: '1rem 1.25rem',
              borderRight: '1px solid #e2e8f0',
              transition: 'background-color 0.4s ease',
              backgroundColor: changedFields.tasks ? '#eff6ff' : 'transparent'
            }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Tasks Created
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {report.total_tasks}
              </div>
              {renderDelta(deltas.tasks)}
            </div>

            {/* KPI 3: Completed */}
            <div style={{
              padding: '1rem 1.25rem',
              borderRight: '1px solid #e2e8f0',
              transition: 'background-color 0.4s ease',
              backgroundColor: changedFields.completed ? '#f0fdf4' : 'transparent'
            }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Completed Tasks
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.1 }}>
                  {report.completed_tasks}
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#16a34a' }}>
                  ({report.completion_pct}%)
                </span>
              </div>
              {renderDelta(deltas.completion_pct, '%')}
            </div>

            {/* KPI 4: Pending & Overdue */}
            <div style={{
              padding: '1rem 1.25rem',
              transition: 'background-color 0.4s ease',
              backgroundColor: (changedFields.pending || changedFields.overdue) ? '#fef2f2' : 'transparent'
            }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Pending & Overdue
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                  {report.pending_tasks}
                </span>
                {report.overdue_tasks > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>
                    ({report.overdue_tasks} ovd)
                  </span>
                )}
              </div>
              {renderDelta(deltas.overdue, '', true)}
            </div>
          </div>

          {/* =========================================================================
              SECTION A: TASKS DUE TOMORROW
             ========================================================================= */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.875rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Tasks Due Tomorrow
                  </h2>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Action items scheduled for completion tomorrow
                </div>
              </div>

              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                background: report.tasks_due_tomorrow && report.tasks_due_tomorrow.length > 0 ? '#fef3c7' : '#f1f5f9',
                color: report.tasks_due_tomorrow && report.tasks_due_tomorrow.length > 0 ? '#92400e' : '#64748b',
                border: report.tasks_due_tomorrow && report.tasks_due_tomorrow.length > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0'
              }}>
                {report.tasks_due_tomorrow ? report.tasks_due_tomorrow.length : 0} Task{report.tasks_due_tomorrow?.length === 1 ? '' : 's'} Due
              </span>
            </div>

            {(!report.tasks_due_tomorrow || report.tasks_due_tomorrow.length === 0) ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <CheckCircle2 className="w-8 h-8 text-success" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 600, color: '#1e293b' }}>No tasks due tomorrow</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>All deliverables for tomorrow are clear!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {report.tasks_due_tomorrow.map((t) => {
                  const pLower = (t.priority || '').toLowerCase();
                  const prioBg = pLower === 'high' ? '#fef2f2' : pLower === 'medium' ? '#fffbeb' : '#f8fafc';
                  const prioColor = pLower === 'high' ? '#dc2626' : pLower === 'medium' ? '#d97706' : '#64748b';
                  const prioBorder = pLower === 'high' ? '#fecaca' : pLower === 'medium' ? '#fde68a' : '#e2e8f0';

                  const stLower = (t.status || '').toLowerCase();
                  const stBg = stLower === 'completed' ? '#f0fdf4' : stLower === 'in progress' ? '#eff6ff' : '#fef3c7';
                  const stColor = stLower === 'completed' ? '#16a34a' : stLower === 'in progress' ? '#2563eb' : '#d97706';

                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        padding: '0.875rem 1.125rem',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    >
                      {/* Left: Task Title & Meeting source */}
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                          {t.task}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>Assignee: <strong>{t.assignee}</strong></span>
                          <span>•</span>
                          <span>{t.meeting_title}</span>
                        </div>
                      </div>

                      {/* Right: Badges for Priority and Status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: prioBg,
                          color: prioColor,
                          border: `1px solid ${prioBorder}`
                        }}>
                          {t.priority} Priority
                        </span>

                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: stBg,
                          color: stColor
                        }}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* =========================================================================
              SECTION B: PRODUCTIVITY TREND OVER TIME
             ========================================================================= */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.875rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Productivity Trend Over Time
                  </h2>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {report.is_lead ? 'Team-wide task completion rate across the last 5–6 periods' : 'Personal task completion rate across the last 5–6 periods'}
                </div>
              </div>

              {/* Trajectory Badge */}
              {report.trend && report.trend.length >= 2 && (() => {
                const latest = report.trend[report.trend.length - 1]?.completion_rate ?? 0;
                const prev = report.trend[report.trend.length - 2]?.completion_rate ?? 0;
                const diff = latest - prev;
                const isPositive = diff > 0;
                const isZero = diff === 0;
                return (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: isZero ? '#f1f5f9' : isPositive ? '#dcfce7' : '#fee2e2',
                    color: isZero ? '#475569' : isPositive ? '#166534' : '#991b1b',
                    border: `1px solid ${isZero ? '#e2e8f0' : isPositive ? '#bbf7d0' : '#fecaca'}`
                  }}>
                    {isZero ? <Minus className="w-3.5 h-3.5" /> : isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>
                      {isZero ? 'Stable velocity vs previous period' : `${isPositive ? '+' : ''}${diff}% velocity vs previous period`}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* SVG Trend Line / Area Chart */}
            {renderProductivityTrendChart(report.trend)}

            {/* Micro-metrics summary strip under chart */}
            {report.trend && report.trend.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(report.trend.length, 6)}, 1fr)`,
                gap: '0.75rem',
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f1f5f9'
              }}>
                {report.trend.map((pt, idx) => (
                  <div key={idx} style={{ textAlign: 'center', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {pt.period}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                      {pt.completion_rate}%
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                      {pt.completed_tasks}/{pt.total_tasks} done
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* Footer note in document */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <span>MeetingLens Automated Intelligence Report Engine</span>
            <span>Generated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

        </div>
      )}

    </div>
  );
}
