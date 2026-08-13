export const dummyMeetings = [
  {
    id: 1,
    title: 'Weekly Product Meeting',
    date: '2026-08-11',
    summary: 'Weekly sync on product status. Finalized launch dates and technology choices.',
    status: 'Completed',
    participants: ['Amit Shah', 'Priya Patel', 'Rahul Sharma', 'Sneha Gupta']
  },
  {
    id: 2,
    title: 'Marketing Strategy Meeting',
    date: '2026-08-09',
    summary: 'Discussed and approved Q3 marketing budget increases and campaign finalization timeline.',
    status: 'Completed',
    participants: ['Amit Shah', 'Priya Patel', 'Vikram Singh']
  },
  {
    id: 3,
    title: 'Engineering Sprint Review',
    date: '2026-08-07',
    summary: 'Reviewed Sprint 43. Reprioritized bug fixes over tech debt.',
    status: 'Completed',
    participants: ['Rahul Sharma', 'Vikram Singh', 'Amit Shah', 'Priya Patel']
  },
  {
    id: 4,
    title: 'Client Project Discussion',
    date: '2026-08-05',
    summary: 'Client meeting with Acme Corp regarding dashboard redesign and change order approval.',
    status: 'Completed',
    participants: ['Sneha Gupta', 'Amit Shah', 'Vikram Singh']
  },
  {
    id: 5,
    title: 'Quarterly Business Review',
    date: '2026-08-01',
    summary: 'Q2 review showing growth. Set Q3 focus on retention metrics.',
    status: 'Completed',
    participants: ['Priya Patel', 'Rahul Sharma', 'Sneha Gupta', 'Amit Shah']
  }
];

export const dummyDecisions = [
  { id: 1, meeting_id: 1, text: 'Project launch approved for September 15.' },
  { id: 2, meeting_id: 1, text: 'React selected for frontend.' },
  { id: 3, meeting_id: 2, text: 'Marketing budget approved with 20% increase for digital.' },
  { id: 4, meeting_id: 3, text: 'Delay user service refactoring.' },
  { id: 5, meeting_id: 4, text: 'Approve $5,000 change order.' },
];

export const dummyActionItems = [
  { id: 1, meeting_id: 1, task: 'Prepare project presentation', assignee: 'Rahul Sharma', dueDate: '2026-08-15', priority: 'High', status: 'Pending' },
  { id: 2, meeting_id: 1, task: 'Update API documentation', assignee: 'Priya Patel', dueDate: '2026-08-18', priority: 'Medium', status: 'Pending' },
  { id: 3, meeting_id: 1, task: 'Draft UI mockups', assignee: 'Sneha Gupta', dueDate: '2026-08-14', priority: 'Medium', status: 'In Progress' },
  { id: 4, meeting_id: 2, task: 'Finalize marketing campaign', assignee: 'Amit Shah', dueDate: '2026-08-20', priority: 'High', status: 'Pending' },
  { id: 5, meeting_id: 3, task: 'Fix payment bug #102', assignee: 'Vikram Singh', dueDate: '2026-08-09', priority: 'High', status: 'Completed' },
];

export const dummyDocuments = [
  { id: 1, meeting_id: 1, type: 'PDF', fileName: 'Weekly_Product_Meeting_Summary.pdf', date: '2026-08-11' },
  { id: 2, meeting_id: 1, type: 'DOCX', fileName: 'Weekly_Product_Meeting_Full.docx', date: '2026-08-11' },
  { id: 3, meeting_id: 2, type: 'PDF', fileName: 'Marketing_Strategy_Q3.pdf', date: '2026-08-09' },
  { id: 4, meeting_id: 4, type: 'PDF', fileName: 'Acme_Change_Order.pdf', date: '2026-08-05' },
];
