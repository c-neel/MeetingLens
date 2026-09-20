import React from 'react';

/**
 * Renders a structured summary text with **bold section headers** and • bullet points
 * into nicely formatted HTML sections.
 * 
 * Expected input format:
 *   **Meeting Overview**
 *   • Bullet point 1
 *   • Bullet point 2
 *   
 *   **Key Discussions**
 *   • Bullet point 1
 */
const StructuredSummary = ({ text, style = {} }) => {
  if (!text) return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No summary available.</p>;

  // Split into sections by double newline
  const sections = text.split(/\n\n+/).filter(s => s.trim());

  const parsedSections = sections.map((section, idx) => {
    const lines = section.split('\n').filter(l => l.trim());
    let header = null;
    const bullets = [];
    const plainLines = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      // Check for **Header** pattern
      const headerMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
      if (headerMatch) {
        header = headerMatch[1];
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        // Bullet point (•, -, or * prefix)
        const bulletText = trimmed.replace(/^[•\-*]\s*/, '');
        if (bulletText) bullets.push(bulletText);
      } else if (trimmed) {
        plainLines.push(trimmed);
      }
    });

    return (
      <div key={idx} style={{ marginBottom: idx < sections.length - 1 ? '1.25rem' : 0 }}>
        {header && (
          <h5 style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--primary)',
            marginBottom: '0.5rem',
            paddingBottom: '0.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}>
            <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)' }} />
            {header}
          </h5>
        )}
        {bullets.length > 0 && (
          <ul style={{
            margin: 0,
            paddingLeft: '1.25rem',
            listStyleType: 'disc',
          }}>
            {bullets.map((b, i) => (
              <li key={i} style={{
                fontSize: '0.875rem',
                lineHeight: 1.65,
                marginBottom: '0.375rem',
                color: 'var(--text-main, #1e293b)',
              }}>
                {formatBoldText(b)}
              </li>
            ))}
          </ul>
        )}
        {plainLines.length > 0 && (
          <div style={{ fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--text-main, #1e293b)' }}>
            {plainLines.map((l, i) => <p key={i} style={{ margin: '0 0 0.375rem 0' }}>{formatBoldText(l)}</p>)}
          </div>
        )}
      </div>
    );
  });

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      padding: '1.25rem',
      borderRadius: '0.5rem',
      border: '1px solid var(--border, #e2e8f0)',
      ...style,
    }}>
      {parsedSections}
    </div>
  );
};

/** Renders inline **bold** text segments */
function formatBoldText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return <strong key={i}>{boldMatch[1]}</strong>;
    }
    return part;
  });
}

export default StructuredSummary;
