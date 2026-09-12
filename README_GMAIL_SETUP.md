# Gmail Email Selection & Forensics Analyzer Setup Guide

This guide explains how to set up, configure, and run the Gmail Email Selection and Threat Analysis feature for the **Email Forensics** application.

---

## 1. Project Directory Structure

```text
EmailDetect/
├── Backend/
│   ├── .env
│   ├── .env.example
│   ├── credentials.json          # Google OAuth Client Credentials
│   ├── token.json                # Secure OAuth Tokens (auto-generated)
│   ├── main.py                   # FastAPI Application & Endpoints
│   ├── Gmail_Auth.py             # Google OAuth 2.0 Auth Handler
│   ├── Gmail_Parser.py           # Gmail MIME, Base64URL & Header Parser
│   ├── Email_parser.py           # EML Parser & Origin IP Extractor
│   ├── Detection_engine.py       # AI & ML Feature Analysis Engine
│   └── Phishing.py               # Phishing Rule Analyzer
├── extension/
│   ├── manifest.json             # Manifest V3 Extension Config
│   ├── background.js             # Service Worker
│   ├── content.js                # Gmail DOM/URL Message ID Detector
│   ├── popup.html                # Extension Interface Layout
│   ├── popup.css                 # Extension Dark UI Styling
│   └── popup.js                  # Extension Controller & Backend Bridge
├── Frontend/
│   ├── src/
│   │   ├── App.jsx               # React Frontend Dashboard
│   │   └── main.jsx
│   └── package.json
└── README_GMAIL_SETUP.md
```

---

## 2. How `messageId` Travels from Gmail to FastAPI Backend

1. **Gmail Open**: The user opens Gmail in Chrome/Edge and selects a specific email.
2. **Extension Detection (`content.js`)**:
   - The content script injected into `https://mail.google.com/*` inspects `window.location.hash` (e.g. `#inbox/18f29ab430198ca1`).
   - If URL parsing fails, it inspects DOM elements for `[data-legacy-message-id]` or `[data-message-id]` attributes on visible message containers (`.h7`, `.adn`, `.gE`).
   - Returns the detected `messageId` (e.g. `18f29ab430198ca1`).
3. **Extension Popup (`popup.js`)**:
   - When the user clicks **"Analyze Current Email"**, `popup.js` receives `messageId` from `content.js`.
   - `popup.js` sends an HTTP `POST` request to `http://localhost:8000/gmail/analyze` with JSON payload:
     ```json
     { "message_id": "18f29ab430198ca1" }
     ```
4. **FastAPI Backend (`main.py` & `Gmail_Auth.py`)**:
   - Validates the `message_id`.
   - Checks that stored Google OAuth credentials (`token.json`) are valid and authenticated under the scope `https://www.googleapis.com/auth/gmail.readonly`.
5. **Gmail API Fetch (`service.users().messages().get`)**:
   - Backend calls `service.users().messages().get(userId="me", id=message_id, format="full").execute()`.
6. **MIME & Header Parsing (`Gmail_Parser.py`)**:
   - Decodes RFC 2047 encoded headers (e.g. `From`, `To`, `Subject`, `Date`, `Received`).
   - Decodes Base64URL encoded message body text (`text/plain` and `text/html`).
   - Parses multipart structures and extracts attachments.
   - Extracts origin IP addresses from `Received` headers and parses SPF/DKIM/DMARC headers.
7. **Threat Analysis Engine (`Detection_engine.py` & `Phishing.py`)**:
   - Converts the extracted email into structured data.
   - Executes ML feature extraction, Groq AI threat scoring, and rule-based phishing checks.
8. **Result Display**:
   - Backend returns full analysis JSON result.
   - The extension popup and frontend display the risk score, threat classification, and specific reasons without navigating the user away from Gmail.

---

## 3. Google Cloud Console OAuth Setup Instructions

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing project (e.g. `email-analyzer`).
3. Enable the **Gmail API**:
   - Navigate to **APIs & Services > Library**.
   - Search for **Gmail API** and click **Enable**.
4. Configure the **OAuth Consent Screen**:
   - Navigate to **APIs & Services > OAuth consent screen**.
   - Select **User Type**: **External** (or Internal if using Workspace).
   - Fill in App Name (e.g. `Email Forensics Analyzer`) and User Support Email.
   - Under **Scopes**, click **Add or Remove Scopes** and add:
     `https://www.googleapis.com/auth/gmail.readonly`
   - Save and proceed. Add your Google email address under **Test Users**.
5. Create **OAuth 2.0 Client ID Credentials**:
   - Navigate to **APIs & Services > Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - Select Application Type: **Web Application**.
   - Set Name: `Email Analyzer Web Client`.
   - Under **Authorized JavaScript origins**, add:
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
   - Under **Authorized redirect URIs**, add:
     - `http://localhost:8000/auth/callback`
     - `http://localhost:8000/auth/google/callback`
   - Click **Create**.
6. Download Credentials JSON:
   - Download the JSON file and save it as `credentials.json` in the `Backend/` directory (`EmailDetect/Backend/credentials.json`).

---

## 4. How to Load the Browser Extension in Chrome / Edge

1. Open Google Chrome or Microsoft Edge.
2. Open the extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Enable **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked**.
5. Select the `extension` folder inside your project directory (`EmailDetect/extension`).
6. The **Gmail Email Security Analyzer** extension will now be installed and visible in your browser extensions bar.

---

## 5. Exact Commands to Run Backend and Frontend Locally

### A. Run FastAPI Backend

Open a terminal in `EmailDetect/Backend`:

```bash
cd "c:\Users\Ritik\OneDrive\Desktop\EmailDetect\Backend"

# Activate virtual environment if using venv
# PowerShell:
.\.venv\Scripts\Activate.ps1

# Run FastAPI with Uvicorn
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend server will start at: `http://localhost:8000`

### B. Run React Frontend

Open a second terminal in `EmailDetect/Frontend`:

```bash
cd "c:\Users\Ritik\OneDrive\Desktop\EmailDetect\Frontend"

# Start Vite dev server
npm run dev
```

The frontend will start at: `http://localhost:5173`

---

## 6. Verification & Usage Flow

1. Open `http://localhost:8000/auth/login` or click **"Connect Gmail Account"** in the frontend/extension to complete Google OAuth 2.0 login.
2. Open Gmail (`https://mail.google.com`) in your browser.
3. Open any email message.
4. Click the **Email Security Analyzer** extension icon.
5. Notice that the currently opened email message ID is automatically detected.
6. Click **"Analyze Current Email"**.
7. View real-time security threat score, ML risk classification, and reasoning directly in the extension popup!
