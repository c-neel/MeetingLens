// my-react-app/src/utils/exporter.js
// Export utility for PDF, Word (.docx) formats, and actual file attachments

export const exportAsPDF = (meeting) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const title = meeting.title || meeting.fileName || 'Meeting Minutes';
  const date = meeting.date || meeting.meeting_date || new Date().toISOString().split('T')[0];
  const duration = meeting.duration || '45 min';
  const execSummary = meeting.executive_summary || meeting.summary || 'No summary available for this document.';
  const decisions = meeting.decisions || [];
  const actionItems = meeting.actionItems || meeting.action_items || [];

  const decisionsHTML = decisions.map(d => `<li>${typeof d === 'string' ? d : (d.decision_text || d.decision || '')}</li>`).join('');
  
  const actionItemsHTML = actionItems.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.task || 'Untitled task'}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.assignee || 'Unassigned'}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.dueDate || item.due_date || 'N/A'}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.priority || 'Medium'}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>MOM - ${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; }
        .title { font-size: 24px; font-weight: bold; color: #0f172a; }
        .meta { color: #64748b; font-size: 14px; text-align: right; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 15px; font-weight: bold; color: #2563eb; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px; }
        p { line-height: 1.6; font-size: 14px; white-space: pre-line; }
        ul { padding-left: 20px; font-size: 14px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px; }
        th { background: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">MINUTES OF MEETING</div>
          <div style="color: #475569; margin-top: 5px; font-weight: 600;">${title}</div>
        </div>
        <div class="meta">
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Duration:</strong> ${duration}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">1. Executive Summary</div>
        <p>${execSummary}</p>
      </div>

      <div class="section">
        <div class="section-title">2. Key Decisions</div>
        <ul>${decisionsHTML || '<li>No decisions recorded.</li>'}</ul>
      </div>

      <div class="section">
        <div class="section-title">3. Action Items</div>
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
            ${actionItemsHTML || '<tr><td colspan="4" style="text-align:center; padding:10px;">No action items recorded.</td></tr>'}
          </tbody>
        </table>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const exportAsWord = (meeting) => {
  const title = meeting.title || meeting.fileName || 'Meeting Minutes';
  const date = meeting.date || meeting.meeting_date || new Date().toISOString().split('T')[0];
  const duration = meeting.duration || '45 min';
  const execSummary = meeting.executive_summary || meeting.summary || 'No summary available for this document.';
  const decisions = meeting.decisions || [];
  const actionItems = meeting.actionItems || meeting.action_items || [];

  const decisionsHTML = decisions.map(d => `<li>${typeof d === 'string' ? d : (d.decision_text || d.decision || '')}</li>`).join('');
  
  const actionItemsHTML = actionItems.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.task || 'Untitled task'}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.assignee || 'Unassigned'}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.dueDate || item.due_date || 'N/A'}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${item.priority || 'Medium'}</td>
    </tr>
  `).join('');

  const wordHTML = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; color: #1e293b; padding: 20px; }
        h1 { color: #2563eb; font-size: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
        h2 { color: #1e40af; font-size: 16px; margin-top: 20px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
        p { font-size: 14px; line-height: 1.5; white-space: pre-line; }
        ul { font-size: 14px; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
        th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
        td { padding: 8px; border: 1px solid #cbd5e1; }
      </style>
    </head>
    <body>
      <h1>MINUTES OF MEETING: ${title}</h1>
      <p><strong>Date:</strong> ${date} | <strong>Duration:</strong> ${duration}</p>
      <hr />
      
      <h2>1. Executive Summary</h2>
      <p>${execSummary}</p>

      <h2>2. Key Decisions</h2>
      <ul>${decisionsHTML || '<li>No decisions recorded.</li>'}</ul>

      <h2>3. Action Items</h2>
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
          ${actionItemsHTML || '<tr><td colspan="4">No action items recorded.</td></tr>'}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordHTML], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_MOM.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadDocumentFile = (doc, meeting) => {
  const fileName = doc.fileName || doc.file_name || 'document';
  const category = doc.category || 'MOM Export';
  const fileData = doc.fileData || doc.file_data;

  // 1. If doc has actual uploaded Base64 file_data, download the EXACT original file!
  if (fileData && fileData.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = fileData;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2. If it's a MOM Export category, generate the actual MOM PDF / Word summary report
  if (category === 'MOM Export' || fileName.includes('_Summary') || fileName.includes('_MOM')) {
    const isPdf = (doc.type === 'PDF' || fileName.toLowerCase().endsWith('.pdf'));
    const docObj = {
      title: doc.title || doc.meeting_title || meeting?.title || fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      fileName: fileName,
      date: doc.date || doc.meeting_date || meeting?.date || new Date().toISOString().split('T')[0],
      executive_summary: doc.executive_summary || doc.summary || meeting?.executive_summary || meeting?.summary || `Meeting record for ${fileName}.`,
      decisions: (doc.decisions && doc.decisions.length > 0) ? doc.decisions : (meeting?.decisions || []),
      actionItems: (doc.actionItems && doc.actionItems.length > 0) ? doc.actionItems : (meeting?.actionItems || [])
    };

    if (isPdf) {
      exportAsPDF(docObj);
    } else {
      exportAsWord(docObj);
    }
    return;
  }

  // 3. For custom reference files (Agendas, Presentations, Specs, Reference Notes like DAU.pdf)
  // If no stored file data, the file was uploaded before we added file storage — prompt re-upload
  alert(`The original file "${fileName}" was uploaded before file storage was enabled.\n\nPlease delete this entry and re-upload the file to enable downloading the actual document.`);
};
