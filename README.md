# 👁️ MeetingLens v2.0 (AI MOM, Task Delegation & Analytics System)

<p align="center">
  <img src="my-react-app/public/logo.png" alt="MeetingLens Logo" width="220" />
</p>

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/frontend-React.js_18-61DAFB.svg?logo=react)
![Vite](https://img.shields.io/badge/build-Vite-646CFF.svg?logo=vite)
![PHP](https://img.shields.io/badge/backend-PHP_8.x-777BB4.svg?logo=php)
![MySQL](https://img.shields.io/badge/database-MySQL_8.0-4479A1.svg?logo=mysql)
![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-FFCA28.svg?logo=google)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**MeetingLens** is an enterprise-grade AI-powered web platform designed to streamline voice meetings, automate Minutes of Meeting (MOM) creation, intelligently extract action items with confidence scoring, and seamlessly delegate tasks via automated emails and calendar integrations.

---

## 🌟 What's New in Version 2.0

- 📊 **Analytics & Reports Hub**: Full dashboard for generating meeting insights, tracking task completion metrics, and exporting comprehensive meeting statistics.
- 🔐 **Enhanced Auth & Security**: Google Social Login (OAuth 2.0), OTP-based Password Reset, and profile customization.
- 🎙️ **Real-Time Voice Assistant & Live Transcription**: Enhanced Web Speech API integration with live browser audio capture and continuous AI processing.
- ✉️ **Automated Email & Calendar Sync**: Direct task delegation emails with attached MOM PDFs and one-click Google Calendar event addition.
- 📁 **Document Repository & PDF Generator**: Seamless file uploads (TXT, PDF, DOCX) and instant PDF generation for meeting transcripts and summaries.

---

## 🚀 Key Features

### 1. Live Voice Meetings & Transcription
- Record meetings directly inside the browser using high-accuracy Speech Recognition.
- Real-time display of transcriptions with live pause/resume and auto-save capabilities.

### 2. AI MOM & Action Item Generation
- Powered by **Google Gemini AI** to process complex meeting dialogues.
- Generates executive summaries, key discussion points, formal decisions, and action items.
- Assigns AI confidence scores to each task, highlighting low-confidence items for review.

### 3. Task Approval & Delegation Workflow
- Review, edit, and assign extracted action items before final dispatch.
- Assign priority (Low, Medium, High, Urgent), set due dates, and specify assignees.
- Triggers instant email notifications to assignees with calendar invitation links.

### 4. Advanced Analytics & PDF Exporting
- Visual reports on team productivity, task distribution, and meeting frequency.
- One-click export of structured MOM reports in PDF format.

### 5. Multi-User Authentication & Profile Management
- Secure user registration, JWT/session authentication, Google OAuth login.
- OTP verification system for forgotten password retrieval.

---

## 📂 Project Architecture

```text
MeetingLens/
├── backend/                      # PHP REST API Backend
│   ├── api/                      # API Endpoints
│   │   ├── action-items/         # Task management & CRUD operations
│   │   ├── analyze/              # AI processing & Gemini chat assistant
│   │   ├── decisions/            # Meeting decisions handling
│   │   ├── documents/            # PDF generation & document retrieval
│   │   ├── email/                # Email dispatch & notifications
│   │   ├── meetings/             # Meeting sessions CRUD
│   │   ├── reports/              # Analytics & statistics generation
│   │   └── users/                # Auth, profile, OTP reset, social login
│   ├── config/                   # Configuration (DB, Mailer, AI credentials)
│   ├── lib/                      # External libraries (PHPMailer, FPDF, etc.)
│   └── uploads/                  # Storage for uploaded files and PDFs
│
├── my-react-app/                 # React.js Frontend (Vite)
│   ├── public/                   # Static assets & logo icons
│   │   ├── favicon.png
│   │   └── logo.png              # MeetingLens Official Brand Logo
│   ├── src/
│   │   ├── assets/               # Branding assets & SVG icons
│   │   ├── components/           # Reusable UI components (Sidebar, Topbar, Modals)
│   │   ├── pages/                # Application Views
│   │   │   ├── Auth.jsx          # Login & Registration
│   │   │   ├── Dashboard.jsx     # Main Dashboard
│   │   │   ├── Documents.jsx     # Document Management
│   │   │   ├── ForgotPassword.jsx# OTP Password Reset
│   │   │   ├── LandingPage.jsx   # Public Landing Page
│   │   │   ├── MeetingDetails.jsx# Detailed MOM, Chat & Tasks View
│   │   │   ├── Meetings.jsx      # All Meetings List
│   │   │   ├── NewMeeting.jsx    # File Upload & Analysis Interface
│   │   │   ├── OnlineMeeting.jsx # Virtual Meeting Integration
│   │   │   ├── Reports.jsx       # Analytics & Reports View
│   │   │   ├── Settings.jsx      # User Profile & App Settings
│   │   │   ├── TaskApproval.jsx  # AI Task Review & Approval Screen
│   │   │   ├── Tasks.jsx         # Central Task Board
│   │   │   └── VoiceMeeting.jsx  # Live Voice Recording Interface
│   │   ├── services/             # Axios API Service Layer
│   │   ├── utils/                # Exporters, formatters, and helpers
│   │   ├── App.jsx               # Routes & Application Hub
│   │   └── index.css             # Styling & Design System
│
├── database/                     # SQL Database Schemas
│   ├── voice_assistant.sql       # Complete Database Schema
│   └── upgrade_v2.sql            # Migration Script for v2.0
└── README.md                     # Project Documentation
```

---

## 🖥️ Frontend Pages Breakdown (`my-react-app/src/pages/`)

| Page | Description |
| :--- | :--- |
| `LandingPage.jsx` | Hero section, feature showcase, and quick launch portal. |
| `Auth.jsx` | Secure login, registration, and Google OAuth single sign-on. |
| `ForgotPassword.jsx` | Multi-step OTP email verification and password reset interface. |
| `Dashboard.jsx` | Overview of recent meetings, pending task stats, and quick actions. |
| `VoiceMeeting.jsx` | Real-time audio recording, live transcription, and immediate AI MOM trigger. |
| `NewMeeting.jsx` | File upload portal for TXT, PDF, DOCX transcript analysis. |
| `Meetings.jsx` | Filterable list of all recorded and processed meetings. |
| `MeetingDetails.jsx` | In-depth view of meeting summary, decisions, audio player, and interactive AI chat. |
| `TaskApproval.jsx` | Interactive review matrix for AI-generated action items with confidence indicators. |
| `Tasks.jsx` | Task management workspace ("Tasks for Me" & "Delegated by Me"). |
| `Reports.jsx` | Analytics view displaying graphs, task completion trends, and downloadable reports. |
| `Settings.jsx` | Account settings, email preferences, and API key configurations. |
| `Documents.jsx` | Centralized file archive for downloaded MOM PDFs and meeting attachments. |

---

## ⚙️ Tech Stack & Technologies

- **Frontend**: React 18, Vite, React Router DOM, Lucide Icons, Web Speech API.
- **Backend**: PHP 8.x (REST API Architecture), PDO (Prepared Statements).
- **Database**: MySQL 8.0 / MariaDB.
- **AI Engine**: Google Gemini API (2.0 Flash / Pro) for natural language processing.
- **Email Service**: PHPMailer / SMTP for task notifications and OTP delivery.
- **Styling**: Modern Responsive CSS with dynamic UI color palettes.

---

## 🛠️ Installation & Local Setup

### Prerequisites
- Node.js (v18.x or higher) & npm
- PHP (v8.0 or higher) with PDO & MySQL extensions
- MySQL / MariaDB Server (via XAMPP, WAMP, or standalone)

### 1. Repository Clone
```bash
git clone https://github.com/c-neel/Voice-Assistant.git
cd Voice-Assistant
```

### 2. Backend Setup
1. Copy the `backend/` folder to your local server directory (e.g., `htdocs/Voice-Assistant/backend`).
2. Create a MySQL database named `voice_assistant`.
3. Import the database schema:
   ```bash
   mysql -u root -p voice_assistant < database/voice_assistant.sql
   mysql -u root -p voice_assistant < database/upgrade_v2.sql
   ```
4. Configure database and email credentials in `backend/config/database.php` and `backend/config/email_config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('DB_NAME', 'voice_assistant');
   define('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY');
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd my-react-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173`.

---

## 📝 Complete User Workflow

1. **Host/Join Meeting**: Start a **Voice Meeting** or upload an existing transcript file.
2. **AI Processing**: Gemini AI generates Minutes of Meeting (MOM), formal decisions, and action items.
3. **Task Review**: Navigate to **Task Approval** to verify AI-detected tasks and assign team members.
4. **Automated Delegation**: Approving tasks dispatches email notifications to assignees with attached MOM PDFs and Google Calendar event links.
5. **Track & Analyze**: Monitor task completion and export meeting analytics via the **Reports** dashboard.

---

## 🤝 Contributing

Contributions are always welcome! Feel free to submit a Pull Request or open an Issue on GitHub.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*MeetingLens — Built with ❤️ for intelligent meeting automation.*
