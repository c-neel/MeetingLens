# 🎙️ Voice Assistant - Technical Documentation

This document provides a deep dive into the technical architecture, project structure, and developer guidelines for the **Voice Assistant (AI MOM & Task Generation System)** project.

## 🏗️ Architecture Overview

The application follows a decoupled client-server architecture:
- **Frontend (Client)**: A Single Page Application (SPA) built with React.js and Vite. It handles user interactions, audio recording via the Web Speech API, and communicates with the backend via RESTful APIs.
- **Backend (Server)**: A PHP-based REST API that interfaces with a MySQL database. It handles data persistence, authentication, AI integration (Google Gemini), and email dispatching.
- **Database**: MySQL database holding structured data such as users, meetings, action items, and decisions.

---

## 📂 Detailed Directory Structure

### 1. Frontend (`/my-react-app`)
The frontend is initialized using Vite and structured to maximize reusability.

```text
my-react-app/
├── src/
│   ├── assets/          # Static assets like images and icons
│   ├── components/      # Reusable UI components (Sidebar, Navbar, Cards)
│   ├── data/            # Mock data or static configurations
│   ├── pages/           # Page-level components matching routes
│   │   ├── Auth.jsx
│   │   ├── Dashboard.jsx
│   │   ├── LandingPage.jsx
│   │   ├── Meetings.jsx
│   │   ├── MeetingDetails.jsx
│   │   ├── NewMeeting.jsx
│   │   ├── VoiceMeeting.jsx
│   │   ├── OnlineMeeting.jsx
│   │   ├── Tasks.jsx
│   │   ├── TaskApproval.jsx
│   │   └── Documents.jsx
│   ├── services/        # API service modules for backend communication
│   ├── utils/           # Helper functions (e.g., date formatting, local storage)
│   ├── App.jsx          # Root component containing routing logic
│   ├── main.jsx         # Application entry point
│   ├── App.css          # App-specific styles
│   └── index.css        # Global CSS (including utility classes)
```

### 2. Backend (`/backend`)
A lightweight PHP backend serving REST endpoints.

```text
backend/
├── api/                 # API endpoint modules
│   ├── action-items/    # Endpoints for task creation, updating, and fetching
│   ├── analyze/         # Endpoints for document and transcript AI analysis
│   ├── decisions/       # Endpoints for meeting decisions
│   ├── documents/       # Endpoints for document retrieval and PDF generation
│   ├── email/           # Endpoints handling email dispatch and notifications
│   ├── meetings/        # Endpoints for meeting CRUD operations
│   ├── users/           # User authentication and management endpoints
│   ├── test-connection.php # Utility to check database connection
│   └── debug.php        # Debugging utilities
├── config/              # Configuration files (Database, AI API keys)
└── uploads/             # Directory for storing uploaded files and generated PDFs
```

### 3. Database (`/database`)
- `voice_assistant.sql`: Contains the DDL (Data Definition Language) to initialize tables like `users`, `meetings`, `action_items`, and `decisions`.
- `upgrade_v2.sql`: Migration script for database schema upgrades.

---

## 🔗 Core Workflows

### A. Live Meeting Transcription
1. **User Action**: Navigates to `VoiceMeeting.jsx` and starts recording.
2. **Frontend Processing**: Web Speech API captures audio and streams text to the UI.
3. **Saving**: Transcript is sent to `backend/api/meetings/`.

### B. AI Analysis & Task Generation
1. **User Action**: Uploads a transcript in `NewMeeting.jsx`.
2. **Backend Processing**: The file is parsed and sent to `backend/api/analyze/`.
3. **AI Integration**: A prompt is constructed with the transcript and sent to the Google Gemini AI.
4. **Extraction**: Gemini returns a structured JSON containing the MOM (Minutes of Meeting), decisions, and action items with calculated confidence scores.

### C. Task Delegation & Emailing
1. **User Action**: Reviews and approves tasks in `TaskApproval.jsx`.
2. **Backend Processing**: Finalized tasks are saved via `backend/api/action-items/`.
3. **Notification**: The `backend/api/email/` endpoint is triggered, firing an email to the assignee with the MOM PDF and a direct Google Calendar add link.

---

## 🛠️ Environment Configuration

### Frontend
Environment variables should be placed in `my-react-app/.env`:
```env
VITE_API_BASE_URL=http://localhost/Voice-Assistant/backend/api
```

### Backend
Update the database credentials in `backend/config/database.php` (or similar file):
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'voice_assistant');
```
Set up the Gemini AI API Key in the backend configuration:
```php
define('GEMINI_API_KEY', 'your_google_gemini_api_key_here');
```

---

## 💡 Developer Guidelines
1. **Adding New Routes**: When adding a new page, create the component in `src/pages/` and register the route in `src/App.jsx`.
2. **Calling APIs**: Use the modules inside `src/services/` to communicate with the PHP backend to maintain clean architecture.
3. **Styling**: Utilize the existing utility classes in `index.css`. For custom styles, append to `App.css` or use CSS modules.
4. **Error Handling**: Both frontend and backend must gracefully handle API failures. The PHP endpoints should always return proper HTTP status codes and JSON error messages.

---

*This file is intended to serve as a technical companion to the `README.md`.*
