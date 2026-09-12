import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const emails = [
  {
    id: "1",
    sender: "Microsoft Security",
    email: "security@microsoft-alert.com",
    subject: "Your account requires immediate verification",
    preview: "We detected unusual activity on your account...",
    time: "10:42 AM",
    risk: "High",
    type: "phishing",
  },
  {
    id: "2",
    sender: "HR Department",
    email: "hr@company-careers.com",
    subject: "Job Interview Invitation",
    preview: "Congratulations! You have been selected...",
    time: "9:35 AM",
    risk: "Medium",
    type: "social",
  },
  {
    id: "3",
    sender: "Amazon",
    email: "support@amazon-security.com",
    subject: "Your order has been cancelled",
    preview: "Please click the link below to confirm...",
    time: "Yesterday",
    risk: "High",
    type: "phishing",
  },
  {
    id: "4",
    sender: "Google",
    email: "no-reply@google.com",
    subject: "Security alert",
    preview: "A new device signed into your Google account...",
    time: "Yesterday",
    risk: "Safe",
    type: "safe",
  },
  {
    id: "5",
    sender: "Unknown Sender",
    email: "admin@random-domain.xyz",
    subject: "Important Payment Required",
    preview: "Your payment is pending. Complete your payment...",
    time: "Sep 10",
    risk: "High",
    type: "phishing",
  },
];

function Gmail() {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("All Emails");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const goToLogin = () => {
  navigate("/login");
};
  const menuItems = [
    { name: "Dashboard", icon: "🏠" },
    { name: "All Emails", icon: "📥", count: 100 },
    { name: "Phishing", icon: "🎣", count: 24 },
    { name: "Social Engineering", icon: "🧠", count: 12 },
    { name: "Suspicious URLs", icon: "🌐", count: 18 },
    { name: "Attachments", icon: "📎", count: 7 },
    { name: "Spoofing", icon: "🕵️", count: 9 },
    { name: "Authentication", icon: "🔐" },
    { name: "IP Tracking", icon: "🌍" },
    { name: "High Risk", icon: "⚠️", count: 16 },
    { name: "Safe Emails", icon: "✅", count: 60 },
    { name: "Reports", icon: "📊" },
  ];

  const getFilteredEmails = () => {
    let result = emails;

    if (activeMenu === "Phishing") {
      result = emails.filter((email) => email.type === "phishing");
    }

    if (activeMenu === "Social Engineering") {
      result = emails.filter((email) => email.type === "social");
    }

    if (activeMenu === "High Risk") {
      result = emails.filter((email) => email.risk === "High");
    }

    if (activeMenu === "Safe Emails") {
      result = emails.filter((email) => email.risk === "Safe");
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (email) =>
          email.sender.toLowerCase().includes(query) ||
          email.email.toLowerCase().includes(query) ||
          email.subject.toLowerCase().includes(query)
      );
    }

    return result;
  };

  const getRiskClass = (risk) => {
    if (risk === "High") return "risk-high";
    if (risk === "Medium") return "risk-medium";
    return "risk-safe";
  };

  return (
    
    <div className="gmail-app">

      {/* ================= HEADER ================= */}
      <header className="topbar">

        <div className="brand">
          <div className="shield-logo">🛡️</div>

          <div>
            <div className="brand-name">EmailDetect</div>
            <div className="brand-subtitle">Email Forensics</div>
          </div>
        </div>

        <div className="search-box">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="top-actions">
          <button className="icon-button">❔</button>
          <button className="icon-button">⚙️</button>

          <button
            className="profile-button"
            onClick={goToLogin}
          >
            Login
          </button>

        </div>
      </header>


      {/* ================= MAIN ================= */}
      <div className="main-layout">

        {/* ================= SIDEBAR ================= */}
        <aside className="sidebar">

          <button className="analyze-button">
            <span>🔍</span>
            Analyze Email
          </button>

          <div className="menu-title">
            EMAIL DETECTION
          </div>

          {menuItems.slice(0, 7).map((item) => (
            <button
              key={item.name}
              className={`menu-item ${
                activeMenu === item.name ? "active" : ""
              }`}
              onClick={() => setActiveMenu(item.name)}
            >
              <span className="menu-icon">{item.icon}</span>

              <span className="menu-name">
                {item.name}
              </span>

              {item.count && (
                <span className="menu-count">
                  {item.count}
                </span>
              )}
            </button>
          ))}


          <div className="menu-title authentication-title">
            FORENSICS
          </div>

          {menuItems.slice(7).map((item) => (
            <button
              key={item.name}
              className={`menu-item ${
                activeMenu === item.name ? "active" : ""
              }`}
              onClick={() => setActiveMenu(item.name)}
            >
              <span className="menu-icon">{item.icon}</span>

              <span className="menu-name">
                {item.name}
              </span>

              {item.count && (
                <span className="menu-count">
                  {item.count}
                </span>
              )}
            </button>
          ))}

        </aside>


        {/* ================= EMAIL CONTENT ================= */}
        <main className="email-content">

          <div className="content-header">

            <div>
              <h1>{activeMenu}</h1>

              <p>
                Analyze and investigate suspicious emails
              </p>
            </div>

            <button className="refresh-button">
              ↻ Refresh
            </button>

          </div>


          {/* ================= STAT CARDS ================= */}
          <div className="stats">

            <div className="stat-card">
              <div className="stat-icon blue">
                📧
              </div>

              <div>
                <span>Total Emails</span>
                <strong>1,248</strong>
              </div>
            </div>


            <div className="stat-card">
              <div className="stat-icon red">
                🎣
              </div>

              <div>
                <span>Phishing</span>
                <strong>124</strong>
              </div>
            </div>


            <div className="stat-card">
              <div className="stat-icon orange">
                ⚠️
              </div>

              <div>
                <span>High Risk</span>
                <strong>86</strong>
              </div>
            </div>


            <div className="stat-card">
              <div className="stat-icon green">
                ✅
              </div>

              <div>
                <span>Safe</span>
                <strong>1,038</strong>
              </div>
            </div>

          </div>


          {/* ================= EMAIL LIST ================= */}
          <div className="email-panel">

            <div className="email-toolbar">

              <div>
                <input type="checkbox" />
              </div>

              <button>↻</button>
              <button>⋮</button>

              <span className="email-count">
                1-50 of 1,248
              </span>

            </div>


            <div className="email-list">

              {getFilteredEmails().map((email) => (

                <div
                  key={email.id}
                  className="email-row"
                  onClick={() => setSelectedEmail(email)}
                >

                  <input
                    type="checkbox"
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="email-avatar">
                    {email.sender.charAt(0)}
                  </div>


                  <div className="email-sender">
                    <strong>
                      {email.sender}
                    </strong>

                    <span>
                      {email.email}
                    </span>
                  </div>


                  <div className="email-subject">

                    <strong>
                      {email.subject}
                    </strong>

                    <span>
                      {" - " + email.preview}
                    </span>

                  </div>


                  <div className={`risk-badge ${getRiskClass(email.risk)}`}>
                    {email.risk}
                  </div>


                  <div className="email-time">
                    {email.time}
                  </div>

                </div>

              ))}

            </div>

          </div>

        </main>

      </div>


      {/* ================= EMAIL VIEW MODAL ================= */}
      {selectedEmail && (

        <div
          className="modal-background"
          onClick={() => setSelectedEmail(null)}
        >

          <div
            className="email-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">

              <button
                onClick={() => setSelectedEmail(null)}
              >
                ←
              </button>

              <span>Email Details</span>

              <button>⋮</button>

            </div>


            <div className="modal-body">

              <div className="modal-subject">
                {selectedEmail.subject}
              </div>


              <div className="sender-details">

                <div className="large-avatar">
                  {selectedEmail.sender.charAt(0)}
                </div>

                <div>
                  <strong>
                    {selectedEmail.sender}
                  </strong>

                  <div>
                    &lt;{selectedEmail.email}&gt;
                  </div>

                  <small>
                    to me
                  </small>
                </div>

              </div>


              <div className="email-message">

                <p>
                  This is a demo email message.
                </p>

                <p>
                  Your EmailDetect system will analyze
                  this email for phishing, social engineering,
                  suspicious URLs, spoofing, authentication
                  failures and malicious attachments.
                </p>

              </div>


              <div className="analysis-section">

                <h3>
                  Security Analysis
                </h3>

                <div className="analysis-grid">

                  <div>
                    <span>Threat Score</span>
                    <strong className="red-text">
                      {selectedEmail.risk === "High"
                        ? "92%"
                        : "18%"}
                    </strong>
                  </div>

                  <div>
                    <span>Risk Level</span>
                    <strong>
                      {selectedEmail.risk}
                    </strong>
                  </div>

                  <div>
                    <span>SPF</span>
                    <strong>PASS</strong>
                  </div>

                  <div>
                    <span>DKIM</span>
                    <strong>PASS</strong>
                  </div>

                </div>

              </div>


              <button className="full-analyze-button">
                🔍 Analyze This Email
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ================= CSS ================= */}
      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #f6f8fc;
          color: #202124;
        }

        button {
          font-family: inherit;
          cursor: pointer;
        }


        /* HEADER */

        .topbar {
          height: 72px;
          background: white;
          border-bottom: 1px solid #e5e7eb;

          display: flex;
          align-items: center;

          padding: 0 24px;

          position: relative;
          z-index: 10;
        }


        .brand {
          width: 260px;

          display: flex;
          align-items: center;
          gap: 12px;
        }


        .shield-logo {
          width: 42px;
          height: 42px;

          background: #eef2ff;

          border-radius: 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 22px;
        }


        .brand-name {
          font-size: 20px;
          font-weight: 700;
        }


        .brand-subtitle {
          font-size: 12px;
          color: #6b7280;
        }


        .search-box {
          flex: 1;
          max-width: 650px;

          height: 44px;

          background: #f1f3f4;

          border-radius: 10px;

          display: flex;
          align-items: center;

          padding: 0 15px;
          gap: 10px;
        }


        .search-box input {
          border: none;
          outline: none;

          background: transparent;

          width: 100%;

          font-size: 15px;
        }


        .top-actions {
          margin-left: auto;

          display: flex;
          align-items: center;
          gap: 8px;

          position: relative;
        }


        .icon-button {
          border: none;
          background: transparent;

          font-size: 18px;

          width: 40px;
          height: 40px;

          border-radius: 50%;
        }


        .icon-button:hover {
          background: #f1f3f4;
        }


        .profile-button {
          width: 100px;
          height: 38px;

          border-radius:5px;

          border: none;

          background: #2563eb;
          color: white;

          font-weight: bold;
        }


        .profile-menu {
          position: absolute;

          right: 0;
          top: 48px;

          width: 220px;

          background: white;

          border: 1px solid #ddd;
          border-radius: 12px;

          padding: 18px;

          box-shadow: 0 8px 30px rgba(0,0,0,.15);
        }


        .profile-menu span {
          display: block;
          color: #777;
          font-size: 13px;
          margin-top: 5px;
        }


        .profile-menu button {
          width: 100%;
          padding: 9px;

          border: none;
          background: white;

          text-align: left;
        }


        /* MAIN */

        .main-layout {
          display: flex;
          height: calc(100vh - 72px);
        }


        /* SIDEBAR */

        .sidebar {
          width: 260px;

          background: white;

          border-right: 1px solid #e5e7eb;

          padding: 18px 12px;

          overflow-y: auto;
        }


        .analyze-button {
          width: 100%;

          height: 48px;

          border: none;

          border-radius: 10px;

          background: #2563eb;

          color: white;

          font-size: 15px;
          font-weight: 600;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 10px;

          margin-bottom: 25px;
        }


        .menu-title {
          font-size: 11px;

          color: #9ca3af;

          font-weight: 700;

          padding: 0 14px 8px;

          letter-spacing: .6px;
        }


        .authentication-title {
          margin-top: 22px;
        }


        .menu-item {
          width: 100%;

          height: 43px;

          border: none;

          background: transparent;

          border-radius: 8px;

          display: flex;
          align-items: center;

          padding: 0 12px;

          gap: 12px;

          color: #4b5563;

          margin-bottom: 3px;
        }


        .menu-item:hover {
          background: #f3f4f6;
        }


        .menu-item.active {
          background: #e8f0fe;

          color: #1d4ed8;

          font-weight: 600;
        }


        .menu-icon {
          width: 24px;

          font-size: 17px;
        }


        .menu-name {
          flex: 1;

          text-align: left;

          font-size: 14px;
        }


        .menu-count {
          font-size: 12px;
          color: #6b7280;
        }


        /* CONTENT */

        .email-content {
          flex: 1;

          padding: 28px;

          overflow-y: auto;
        }


        .content-header {
          display: flex;

          justify-content: space-between;

          align-items: center;

          margin-bottom: 22px;
        }


        .content-header h1 {
          margin: 0;

          font-size: 25px;
        }


        .content-header p {
          margin: 6px 0 0;

          color: #6b7280;
          font-size: 14px;
        }


        .refresh-button {
          background: white;

          border: 1px solid #ddd;

          padding: 9px 15px;

          border-radius: 8px;
        }


        /* STATS */

        .stats {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 16px;

          margin-bottom: 22px;
        }


        .stat-card {
          background: white;

          border: 1px solid #e5e7eb;

          border-radius: 12px;

          padding: 18px;

          display: flex;
          align-items: center;

          gap: 14px;
        }


        .stat-icon {
          width: 42px;
          height: 42px;

          border-radius: 10px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 19px;
        }


        .stat-icon.blue {
          background: #e8f0fe;
        }


        .stat-icon.red {
          background: #fee2e2;
        }


        .stat-icon.orange {
          background: #ffedd5;
        }


        .stat-icon.green {
          background: #dcfce7;
        }


        .stat-card span {
          display: block;

          color: #6b7280;

          font-size: 12px;
        }


        .stat-card strong {
          display: block;

          font-size: 21px;

          margin-top: 3px;
        }


        /* EMAIL PANEL */

        .email-panel {
          background: white;

          border: 1px solid #e5e7eb;

          border-radius: 12px;

          overflow: hidden;
        }


        .email-toolbar {
          height: 50px;

          border-bottom: 1px solid #eee;

          display: flex;
          align-items: center;

          gap: 18px;

          padding: 0 18px;
        }


        .email-toolbar button {
          border: none;

          background: transparent;

          font-size: 17px;
        }


        .email-count {
          margin-left: auto;

          color: #6b7280;

          font-size: 13px;
        }


        .email-row {
          height: 68px;

          display: flex;

          align-items: center;

          gap: 14px;

          padding: 0 18px;

          border-bottom: 1px solid #f0f0f0;

          cursor: pointer;
        }


        .email-row:hover {
          background: #f8fafc;

          box-shadow: 0 1px 4px rgba(0,0,0,.08);
        }


        .email-avatar {
          width: 38px;
          height: 38px;

          border-radius: 50%;

          background: #e5e7eb;

          display: flex;
          align-items: center;
          justify-content: center;

          font-weight: bold;

          flex-shrink: 0;
        }


        .email-sender {
          width: 190px;

          display: flex;
          flex-direction: column;
        }


        .email-sender strong {
          font-size: 14px;
        }


        .email-sender span {
          font-size: 11px;
          color: #888;

          margin-top: 3px;
        }


        .email-subject {
          flex: 1;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }


        .email-subject strong {
          font-size: 14px;
        }


        .email-subject span {
          color: #777;

          font-size: 13px;
        }


        .risk-badge {
          padding: 5px 10px;

          border-radius: 20px;

          font-size: 11px;

          font-weight: 600;
        }


        .risk-high {
          background: #fee2e2;
          color: #dc2626;
        }


        .risk-medium {
          background: #ffedd5;
          color: #ea580c;
        }


        .risk-safe {
          background: #dcfce7;
          color: #16a34a;
        }


        .email-time {
          width: 75px;

          text-align: right;

          font-size: 12px;

          color: #6b7280;
        }


        /* MODAL */

        .modal-background {
          position: fixed;

          inset: 0;

          background: rgba(0,0,0,.45);

          display: flex;

          align-items: center;
          justify-content: center;

          z-index: 100;
        }


        .email-modal {
          width: 720px;

          max-height: 90vh;

          background: white;

          border-radius: 14px;

          overflow: hidden;

          box-shadow: 0 20px 60px rgba(0,0,0,.3);
        }


        .modal-header {
          height: 55px;

          border-bottom: 1px solid #eee;

          display: flex;
          align-items: center;

          justify-content: space-between;

          padding: 0 20px;
        }


        .modal-header button {
          border: none;
          background: transparent;

          font-size: 20px;
        }


        .modal-body {
          padding: 28px;

          overflow-y: auto;

          max-height: calc(90vh - 55px);
        }


        .modal-subject {
          font-size: 22px;

          font-weight: 600;

          margin-bottom: 22px;
        }


        .sender-details {
          display: flex;

          gap: 12px;

          align-items: center;
        }


        .large-avatar {
          width: 45px;
          height: 45px;

          border-radius: 50%;

          background: #2563eb;

          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          font-weight: bold;
        }


        .sender-details div {
          font-size: 13px;
        }


        .sender-details small {
          color: #777;
        }


        .email-message {
          padding: 25px 10px;

          line-height: 1.7;

          font-size: 14px;
        }


        .analysis-section {
          border: 1px solid #e5e7eb;

          border-radius: 10px;

          padding: 18px;

          margin-top: 10px;
        }


        .analysis-section h3 {
          margin-top: 0;
        }


        .analysis-grid {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 12px;
        }


        .analysis-grid div {
          background: #f8fafc;

          padding: 13px;

          border-radius: 8px;
        }


        .analysis-grid span {
          display: block;

          font-size: 11px;

          color: #777;
        }


        .analysis-grid strong {
          display: block;

          margin-top: 5px;
        }


        .red-text {
          color: #dc2626;
        }


        .full-analyze-button {
          width: 100%;

          margin-top: 20px;

          height: 45px;

          border: none;

          border-radius: 8px;

          background: #2563eb;

          color: white;

          font-weight: 600;

          font-size: 14px;
        }


        /* RESPONSIVE */

        @media(max-width: 1000px) {

          .sidebar {
            width: 220px;
          }

          .email-sender {
            width: 140px;
          }

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

        }


        @media(max-width: 700px) {

          .sidebar {
            width: 70px;
          }

          .menu-name,
          .menu-count,
          .menu-title,
          .analyze-button {
            display: none;
          }

          .menu-item {
            justify-content: center;
          }

          .brand {
            width: auto;
          }

          .brand-name,
          .brand-subtitle {
            display: none;
          }

          .search-box {
            margin-left: 15px;
          }

          .email-sender {
            width: 100px;
          }

          .risk-badge {
            display: none;
          }

        }

      `}</style>

    </div>
  );
}

export default Gmail;