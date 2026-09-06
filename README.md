# 🎙️ Voice Assistant (AI MOM & Task Generation System)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/frontend-React.js-61DAFB.svg?logo=react)
![PHP](https://img.shields.io/badge/backend-PHP-777BB4.svg?logo=php)
![MySQL](https://img.shields.io/badge/database-MySQL-4479A1.svg?logo=mysql)
![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-FFCA28.svg?logo=google)

An intelligent web application that streamlines meeting management by using AI to generate Minutes of Meeting (MOM), extract action items, calculate confidence scores for tasks, and automatically delegate tasks via email with calendar integration.

## 🚀 Features

- **Live Voice Meetings**: Record meetings directly in the browser with real-time transcription powered by the Web Speech API and Gemini AI.
- **Document & Transcript Analysis**: Upload meeting transcripts (TXT, PDF, DOCX) and have AI generate comprehensive summaries and extract action items.
- **Task Automation & Delegation**: AI detects action items with assignees, deadlines, and priorities. Review and approve tasks before saving.
- **Email Notifications & Calendar Integration**: Automatically dispatch email notifications to assignees containing the task details, the attached MOM PDF, and a one-click option to add the task to Google Calendar.
- **Confidence Scores**: AI assigns confidence levels for each extracted task, flagging uncertain items for human review.
- **Dashboard & Task Management**: Track pending, in-progress, and completed tasks assigned to you, and monitor tasks you have delegated to others.

## 📂 Project Structure

```text
├── backend/                  # PHP Backend API
│   ├── api/                  # API endpoints (meetings, tasks, email, etc.)
│   ├── config/               # Database configuration and connection setup
│   └── uploads/              # Storage for uploaded documents and PDFs
├── my-react-app/             # React Frontend Application
│   ├── src/
│   │   ├── components/       # Reusable UI components (Sidebar, Topbar)
│   │   ├── pages/            # Main application views and routes
│   │   ├── App.jsx           # Main application entry point and routing
│   │   └── index.css         # Global styles and Tailwind-like utility classes
├── database/                 # SQL Schemas and database backups
│   └── voice_assistant.sql   # Main database structure
└── README.md                 # Project documentation
```

## 🖥️ Frontend Pages Breakdown (`my-react-app/src/pages/`)

- `Auth.jsx`: Handles user login and registration.
- `Dashboard.jsx`: Main hub showing recent meetings, task overviews, and quick statistics.
- `LandingPage.jsx`: The public-facing entry point highlighting the application's features.
- `Meetings.jsx`: A list view of all past meetings and their statuses.
- `MeetingDetails.jsx`: Comprehensive view of a single meeting, showing the transcript, summary, tasks, decisions, and chat assistant.
- `NewMeeting.jsx`: The "Analyze File" interface where users can upload documents or transcripts for AI analysis.
- `VoiceMeeting.jsx`: Interface for conducting live voice meetings with real-time recording and transcription.
- `OnlineMeeting.jsx`: Component for handling virtual/remote meeting integrations (e.g. Google Meet).
- `Tasks.jsx`: Central task management interface with tabs for "Tasks for Me" and "Delegated by Me".
- `TaskApproval.jsx`: The final review screen before a task is officially assigned and notification emails are dispatched.
- `Documents.jsx`: Repository for all generated MOM PDFs and uploaded files.

## ⚙️ Tech Stack

- **Frontend**: React.js, Vite, React Router, Lucide Icons, Web Speech API.
- **Backend**: PHP (REST API), PDO for secure database interactions.
- **Database**: MySQL.
- **AI Integration**: Google Gemini AI (for summarization, task extraction, and chat).
- **Email Delivery**: PHP Mailer (or configured SMTP) for task delegation.
- **PDF Generation**: Integration for exporting meeting minutes to PDF.

## 🛠️ Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/herculesbravo06/AI-MOM-TASK-GENRATION.git
   cd AI-MOM-TASK-GENRATION
   ```

2. **Frontend Setup:**
   ```bash
   cd my-react-app
   npm install
   npm run dev
   ```

3. **Backend Setup:**
   - Ensure you have a PHP server (like XAMPP, WAMP, or MAMP) running.
   - Import `database/voice_assistant.sql` into your MySQL database.
   - Update `backend/config/database.php` (or relevant config files) with your database credentials.
   - Set up your Gemini API key in `backend/config/ai_config.php` and the frontend environment if necessary.

## 📝 Usage Workflow

1. Start a **Live Voice Meeting** or upload a transcript in **Analyze File**.
2. Wait for the AI to process the audio/text and generate the **Executive Summary** and **Action Items**.
3. Review the AI-generated tasks. Click **Approve & Delegate**.
4. In the **Finalize Task Assignment** screen, assign a team member, deadline, and priority.
5. Click **Approve & Send Notification**. The assignee receives an email with a Google Calendar link and the MOM PDF.
6. Track progress in the **Tasks** dashboard.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

---
*Built with ❤️ for better meeting management and task delegation.*
