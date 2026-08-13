const BASE_URL = 'http://localhost:8000/api';

const getLoggedInUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    return {};
  }
};

// ==================== AUTOMATED EMAIL & CALENDAR NOTIFICATIONS ====================
export const sendTaskEmailNotification = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/email/send.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.warn("Backend email dispatch unavailable, using fallback logging");
    return {
      success: true,
      message: `Simulated email notification dispatched to ${payload.recipient_email}`,
      recipient_email: payload.recipient_email
    };
  }
};

// ==================== PER-MEETING AI CHATBOT ====================
export const sendMeetingChatMessage = async (meetingContext, userPrompt) => {
  try {
    const response = await fetch(`${BASE_URL}/analyze/chat.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_prompt: userPrompt,
        meeting_title: meetingContext.title,
        summary: meetingContext.executive_summary || meetingContext.summary,
        transcript: meetingContext.transcript,
        decisions: meetingContext.decisions,
        action_items: meetingContext.actionItems
      })
    });
    return await response.json();
  } catch (error) {
    console.warn("Backend chat endpoint unavailable, generating local AI response");
    return {
      success: true,
      reply: `Regarding "${meetingContext.title}": ${meetingContext.executive_summary || meetingContext.summary || 'No summary available.'}\n\nTask Status: ${meetingContext.actionItems?.length || 0} action items logged.`,
      ai_powered: false
    };
  }
};

// ==================== MEETINGS ====================
export const getMeetings = async () => {
  const user = getLoggedInUser();
  const userIdParam = user.id ? `?user_id=${user.id}` : '';
  try {
    const response = await fetch(`${BASE_URL}/meetings/index.php${userIdParam}`);
    const data = await response.json();
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.warn("Backend unavailable, using mock data");
    return getMockMeetings();
  }
};

export const getMeetingById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/meetings/index.php?id=${id}`);
    return await response.json();
  } catch (error) {
    console.warn("Backend unavailable, using mock data");
    return getMockMeetingById(id);
  }
};

export const saveMeeting = async (meetingData) => {
  const user = getLoggedInUser();
  const payload = {
    user_id: user.id || 1,
    ...meetingData
  };
  try {
    const response = await fetch(`${BASE_URL}/meetings/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('API Error');
    return await response.json();
  } catch (error) {
    console.warn("Backend unavailable, mock save");
    const mockId = Math.floor(Math.random() * 1000) + 100;
    saveMockMeeting({ ...payload, id: mockId });
    const mockTasks = payload.actionItems?.map((t, i) => ({ ...t, id: mockId * 10 + i })) || [];
    return { success: true, id: mockId, actionItems: mockTasks };
  }
};

// ==================== ACTION ITEMS ====================
export const getActionItems = async () => {
  const user = getLoggedInUser();
  const userIdParam = user.id ? `?user_id=${user.id}` : '';
  try {
    const response = await fetch(`${BASE_URL}/action-items/index.php${userIdParam}`);
    const data = await response.json();
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.warn("Backend unavailable, using mock data");
    return getMockActionItems();
  }
};

export const updateActionItem = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/action-items/index.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('API Error');
    const resData = await response.json();
    updateMockActionItem(id, data);
    return resData;
  } catch (error) {
    updateMockActionItem(id, data);
    return { success: true };
  }
};

// ==================== DOCUMENTS ====================
export const getDocuments = async () => {
  const user = getLoggedInUser();
  const userIdParam = user.id ? `?user_id=${user.id}` : '';
  try {
    const response = await fetch(`${BASE_URL}/documents/index.php${userIdParam}`);
    const data = await response.json();
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.warn("Backend unavailable, using mock data");
    return getMockDocuments();
  }
};

export const uploadDocument = async (docData) => {
  try {
    const response = await fetch(`${BASE_URL}/documents/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData)
    });
    return await response.json();
  } catch (error) {
    return { success: true, id: Date.now() };
  }
};

export const deleteDocument = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/documents/index.php?id=${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    return { success: true };
  }
};

// ==================== AI PROCESSING ====================
// This function NEVER silently falls back to mock data.
// It either returns real AI results or throws an error object.
export const processTranscript = async (transcriptText, meetingTitle) => {
  // Diagnostic logging
  console.log('[AI Pipeline] Starting analysis...');
  console.log('[AI Pipeline] Meeting title:', meetingTitle);
  console.log('[AI Pipeline] Transcript length:', transcriptText.length, 'characters');
  console.log('[AI Pipeline] Transcript first 500 chars:', transcriptText.substring(0, 500));

  // Call the PHP backend — the ONLY path to Gemini
  let response;
  try {
    response = await fetch(`${BASE_URL}/analyze/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: transcriptText,
        title: meetingTitle || 'Untitled Meeting'
      })
    });
  } catch (networkError) {
    // Network error — backend not running
    console.error('[AI Pipeline] Network error — backend not reachable:', networkError.message);
    throw {
      error_type: 'BACKEND_UNREACHABLE',
      message: 'Cannot connect to the backend server at localhost:8000. Start the PHP backend with: C:\\xampp\\php\\php.exe -S localhost:8000 -t backend',
      http_code: 0,
      details: networkError.message
    };
  }

  console.log('[AI Pipeline] Backend response HTTP status:', response.status);

  // Parse the response body
  let result;
  try {
    result = await response.json();
  } catch (parseError) {
    console.error('[AI Pipeline] Could not parse backend response as JSON');
    throw {
      error_type: 'INVALID_BACKEND_RESPONSE',
      message: 'Backend returned a non-JSON response. Check the PHP error log.',
      http_code: response.status,
      details: parseError.message
    };
  }

  // If the backend returned an error (non-200 status or error fields)
  if (!response.ok || result.error_type || result.fallback === false && result.message) {
    console.error('[AI Pipeline] Backend returned error:', result);
    throw {
      error_type: result.error_type || 'BACKEND_ERROR',
      message: result.message || 'Unknown backend error',
      http_code: result.http_code || response.status,
      error: result.error || null,
      model: result.model || null,
      api_key_found: result.api_key_found,
      details: result
    };
  }

  // Success — format and return the AI result
  console.log('[AI Pipeline] ✅ AI analysis successful');
  console.log('[AI Pipeline] Model:', result.model);
  console.log('[AI Pipeline] AI powered:', result.ai_powered);
  console.log('[AI Pipeline] Decisions count:', result.decisions?.length);
  console.log('[AI Pipeline] Action items count:', result.action_items?.length);

  // Map action_items from backend format to frontend format
  const actionItems = (result.action_items || []).map(item => ({
    task: item.task || 'Untitled task',
    assignee: item.assignee || 'Unassigned',
    dueDate: item.due_date || item.dueDate || null,
    priority: item.priority || 'Not specified',
    status: item.status || 'Pending',
    confidence: item.confidence || 75
  }));

  return {
    executive_summary: result.executive_summary || result.summary || '',
    detailed_summary: result.detailed_summary || '',
    summary: result.executive_summary || result.summary || '',
    decisions: result.decisions || [],
    actionItems,
    risks: (result.risks || []).map(r => ({
      text: typeof r === 'string' ? r : (r.text || r.risk_text || ''),
      severity: r.severity || 'Medium'
    })),
    suggestions: (result.suggestions || []).map(s => ({
      text: typeof s === 'string' ? s : (s.text || s.suggestion_text || ''),
      category: s.category || 'process'
    })),
    follow_ups: result.follow_ups || [],
    ai_remarks: result.ai_remarks || [],
    quality_score: result.quality_score || 70,
    next_meeting_agenda: result.next_meeting_agenda || [],
    ai_powered: result.ai_powered || false,
    model: result.model || 'unknown'
  };
};

// ==================== GEMINI CONNECTION TEST ====================
export const testGeminiConnection = async () => {
  try {
    const response = await fetch(`${BASE_URL}/test-connection.php`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Cannot connect to backend server at localhost:8000. Start the PHP backend with: C:\\xampp\\php\\php.exe -S localhost:8000 -t backend',
      api_key_found: false,
      error_type: 'BACKEND_UNREACHABLE'
    };
  }
};

// ==================== MOCK DATA FALLBACKS ====================
// Mock storage for newly created meetings when offline
let customMockMeetings = [];

function saveMockMeeting(meeting) {
  customMockMeetings.unshift(meeting);
}

function getMockMeetings() {
  const user = getLoggedInUser();
  const userId = user.id || 1;

  const defaultMock = [
    { id: 1, user_id: 1, title: 'Weekly Product Meeting', date: '2026-08-11', meeting_date: '2026-08-11', summary: 'Weekly sync on product status.', executive_summary: 'Finalized launch dates and technology choices.', status: 'Completed', source: 'file', duration: '45 min', quality_score: 85, participants: ['Amit Shah'] },
    { id: 2, user_id: 2, title: 'Marketing Strategy Meeting', date: '2026-08-09', meeting_date: '2026-08-09', summary: 'Q3 marketing budget discussion.', executive_summary: 'Approved 20% budget increase for digital.', status: 'Completed', source: 'file', duration: '30 min', quality_score: 78, participants: ['Priya Patel'] },
    { id: 3, user_id: 3, title: 'Engineering Sprint Review', date: '2026-08-07', meeting_date: '2026-08-07', summary: 'Sprint 43 review.', executive_summary: 'Reprioritized bug fixes over tech debt.', status: 'Completed', source: 'voice', duration: '60 min', quality_score: 90, participants: ['Rahul Sharma'] },
    { id: 4, user_id: 4, title: 'Client Project Discussion', date: '2026-08-05', meeting_date: '2026-08-05', summary: 'Acme Corp dashboard redesign.', executive_summary: 'Approved dark theme and $5k change order.', status: 'Completed', source: 'file', duration: '25 min', quality_score: 72, participants: ['Sneha Gupta'] },
    { id: 5, user_id: 5, title: 'Quarterly Business Review', date: '2026-08-01', meeting_date: '2026-08-01', summary: 'Q2 review and Q3 planning.', executive_summary: 'Q2 growth 15%. Q3 focus on retention.', status: 'Completed', source: 'file', duration: '90 min', quality_score: 88, participants: ['Vikram Singh'] },
  ];

  const all = [...customMockMeetings, ...defaultMock];
  return all.filter(m => parseInt(m.user_id) === parseInt(userId));
}

function getMockMeetingById(id) {
  const meetings = getMockMeetings();
  const meeting = meetings.find(m => m.id === parseInt(id)) || meetings[0];
  if (!meeting) return null;

  return {
    ...meeting,
    decisions: [
      { id: 1, decision_text: 'Project launch approved for September 15.' },
      { id: 2, decision_text: 'React selected for frontend.' },
      { id: 3, decision_text: 'REST API chosen over GraphQL.' }
    ],
    actionItems: [
      { id: 1, task: 'Prepare project presentation', assignee: meeting.participants?.[0] || 'Me', dueDate: '2026-08-15', due_date: '2026-08-15', priority: 'High', status: 'Pending', confidence: 96 },
      { id: 2, task: 'Update API documentation', assignee: meeting.participants?.[0] || 'Me', dueDate: '2026-08-18', due_date: '2026-08-18', priority: 'Medium', status: 'In Progress', confidence: 92 },
      { id: 3, task: 'Draft UI mockups', assignee: meeting.participants?.[0] || 'Me', dueDate: '2026-08-14', due_date: '2026-08-14', priority: 'Medium', status: 'Pending', confidence: 88 }
    ],
    risks: [
      { risk_text: 'September 15th deadline is aggressive.', severity: 'High' },
      { risk_text: 'No fallback if React migration encounters blockers.', severity: 'Medium' }
    ],
    suggestions: [
      { suggestion_text: 'Set up a staging environment before launch.', category: 'process' },
      { suggestion_text: 'Assign a dedicated QA resource for final 2 weeks.', category: 'resource' }
    ],
    follow_ups: [
      { follow_up_text: 'Review API docs completeness', target_date: '2026-08-19', status: 'Pending' },
      { follow_up_text: 'Demo UI mockups to stakeholders', target_date: '2026-08-16', status: 'Pending' }
    ],
    ai_remarks: [
      { remark_text: 'Three tasks have deadlines within the same week.', remark_type: 'workload' },
      { remark_text: 'GraphQL decision rationale was not fully documented.', remark_type: 'missing_info' }
    ],
    documents: [
      { id: 1, fileName: `${meeting.title.replace(/\s+/g, '_')}_Summary.pdf`, file_name: `${meeting.title.replace(/\s+/g, '_')}_Summary.pdf`, type: 'PDF', document_type: 'PDF', date: meeting.date || '2026-08-11' }
    ],
    transcript: 'Host: Welcome everyone to the meeting...\nSpeaker: We will cover our progress and key deliverables...'
  };
}

let cachedMockActionItems = null;

function getMockActionItems() {
  const user = getLoggedInUser();
  const userId = user.id || 1;

  if (!cachedMockActionItems) {
    cachedMockActionItems = [
      { id: 1, user_id: 1, meeting_id: 1, task: 'Create repository structure', assignee: 'Amit Shah', dueDate: '2026-08-12', due_date: '2026-08-12', priority: 'High', status: 'Completed', confidence: 96, meeting_title: 'Weekly Product Meeting' },
      { id: 2, user_id: 1, meeting_id: 1, task: 'Finalize marketing campaign', assignee: 'Amit Shah', dueDate: '2026-08-20', due_date: '2026-08-20', priority: 'High', status: 'Pending', confidence: 92, meeting_title: 'Weekly Product Meeting' },
      { id: 3, user_id: 2, meeting_id: 2, task: 'Update API documentation', assignee: 'Priya Patel', dueDate: '2026-08-18', due_date: '2026-08-18', priority: 'Medium', status: 'In Progress', confidence: 88, meeting_title: 'Marketing Strategy Meeting' },
      { id: 4, user_id: 2, meeting_id: 2, task: 'Update ad creatives', assignee: 'Priya Patel', dueDate: '2026-08-16', due_date: '2026-08-16', priority: 'Medium', status: 'Pending', confidence: 90, meeting_title: 'Marketing Strategy Meeting' },
      { id: 5, user_id: 3, meeting_id: 3, task: 'Prepare project presentation', assignee: 'Rahul Sharma', dueDate: '2026-08-15', due_date: '2026-08-15', priority: 'High', status: 'Pending', confidence: 94, meeting_title: 'Engineering Sprint Review' },
      { id: 6, user_id: 4, meeting_id: 4, task: 'Update Figma designs to dark theme', assignee: 'Sneha Gupta', dueDate: '2026-08-12', due_date: '2026-08-12', priority: 'High', status: 'Pending', confidence: 90, meeting_title: 'Client Project Discussion' },
      { id: 7, user_id: 5, meeting_id: 5, task: 'Fix payment bug #102', assignee: 'Vikram Singh', dueDate: '2026-08-09', due_date: '2026-08-09', priority: 'High', status: 'Completed', confidence: 95, meeting_title: 'Quarterly Business Review' },
    ];
  }
  return cachedMockActionItems.filter(i => parseInt(i.user_id) === parseInt(userId));
}

function updateMockActionItem(id, data) {
  if (cachedMockActionItems) {
    const index = cachedMockActionItems.findIndex(i => i.id === parseInt(id));
    if (index !== -1 && data.status) {
      cachedMockActionItems[index].status = data.status;
    }
  }
}

function getMockDocuments() {
  const user = getLoggedInUser();
  const userId = user.id || 1;

  const docs = [
    {
      id: 1,
      user_id: 1,
      meeting_id: 1,
      type: 'PDF',
      document_type: 'PDF',
      fileName: 'Weekly_Product_Meeting_Summary.pdf',
      file_name: 'Weekly_Product_Meeting_Summary.pdf',
      title: 'Weekly Product Meeting',
      date: '2026-08-11',
      executive_summary: 'Weekly sync on product status. Finalized launch dates.',
      decisions: ['Project launch approved for September 15.'],
      actionItems: []
    },
    {
      id: 2,
      user_id: 2,
      meeting_id: 2,
      type: 'PDF',
      document_type: 'PDF',
      fileName: 'Marketing_Strategy_Q3.pdf',
      file_name: 'Marketing_Strategy_Q3.pdf',
      title: 'Marketing Strategy Meeting',
      date: '2026-08-09',
      executive_summary: 'Approved 20% budget increase for digital.',
      decisions: ['Approved 20% budget increase for digital.'],
      actionItems: []
    },
    {
      id: 3,
      user_id: 4,
      meeting_id: 4,
      type: 'PDF',
      document_type: 'PDF',
      fileName: 'Acme_Change_Order.pdf',
      file_name: 'Acme_Change_Order.pdf',
      title: 'Client Project Discussion',
      date: '2026-08-05',
      executive_summary: 'Approved dark theme and $5k change order.',
      decisions: ['Approved dark theme and $5k change order.'],
      actionItems: []
    }
  ];

  return docs.filter(d => parseInt(d.user_id) === parseInt(userId));
}
