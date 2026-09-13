import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";

const API_URL =" https://emailforensic.onrender.com";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    localStorage.setItem("access_token", token);

    window.history.replaceState(
        {},
        document.title,
        "/dashboard"
    );
}

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
  
        if (!token) {
          setCheckingAuth(false);
          return;
        }
  
        const response = await fetch(
          "https://emailforensic.onrender.com/auth/status",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!response.ok) {
          throw new Error("Failed to check authentication");
        }
  
        const data = await response.json();
  
        console.log("Dashboard Auth status:", data);
  
        if (!data.authenticated === true) {
          navigate("/", { replace: true });
          return;
        }
  
        // Token is invalid
        
  
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setCheckingAuth(false);
      }
    };
  
    checkAuth();
  }, [navigate]);
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="brand-icon">🛡️</div>
          <h2>MailGuard</h2>
        </div>

        <nav className="sidebar-nav">

          <button className="nav-item active">
            <span>📊</span>
            Dashboard
          </button>

          <button className="nav-item">
            <span>📥</span>
            Inbox
          </button>

          <button className="nav-item">
            <span>🎣</span>
            Phishing
          </button>

          <button className="nav-item">
            <span>👥</span>
            Social
          </button>

          <button className="nav-item">
            <span>🌐</span>
            IP Tracing
          </button>

          <button className="nav-item">
            <span>🔍</span>
            Email Analyzer
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="user-mini">
            {user.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="user-avatar"
              />
            ) : (
              <div className="user-avatar-placeholder">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="user-mini-info">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>

        </div>

      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main className="dashboard-main">

        {/* Header */}

        <header className="dashboard-header">

          <div>
            <h1>Dashboard</h1>
            <p>Monitor and analyze your email security.</p>
          </div>

          <div className="profile">

            {user.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="profile-image"
              />
            ) : (
              <div className="profile-placeholder">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>

          </div>

        </header>

        {/* Welcome */}

        <section className="welcome-card">

          <div>
            <p className="welcome-label">WELCOME BACK</p>

            <h2>
              Hello, {user.name?.split(" ")[0]} 👋
            </h2>

            <p>
              Your email security dashboard is ready.
              Analyze suspicious emails and protect your inbox.
            </p>
          </div>

          <div className="welcome-icon">
            🛡️
          </div>

        </section>

        {/* Statistics */}

        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">📧</div>

            <div>
              <span>Total Emails</span>
              <h3>0</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎣</div>

            <div>
              <span>Phishing Detected</span>
              <h3>0</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>

            <div>
              <span>Safe Emails</span>
              <h3>0</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔍</div>

            <div>
              <span>Emails Analyzed</span>
              <h3>0</h3>
            </div>
          </div>

        </section>

        {/* Main Cards */}

        <section className="dashboard-grid">

          {/* Gmail */}

          <div className="dashboard-card gmail-card">

            <div className="card-header">
              <div>
                <h3>Gmail</h3>
                <p>Analyze emails directly from your Gmail account.</p>
              </div>

              <span className="status-badge">
                ● Connected
              </span>
            </div>

            <div className="card-content">

              <div className="gmail-icon">
                ✉️
              </div>

              <div>
                <h4>Gmail Account Connected</h4>
                <p>{user.email}</p>
              </div>

            </div>

            <button
              className="primary-button"
              onClick={() => navigate("/inbox")}
            >
              Open Inbox →
            </button>

          </div>

          {/* Upload */}

          <div className="dashboard-card">

            <div className="card-header">
              <div>
                <h3>Analyze Email</h3>
                <p>Upload an .eml file for security analysis.</p>
              </div>

              <span className="analyzer-icon">
                🔬
              </span>
            </div>

            <div className="upload-box">

              <div className="upload-icon">
                📄
              </div>

              <h4>Upload .eml file</h4>

              <p>
                Analyze headers, links, sender information
                and phishing indicators.
              </p>

              <button
                className="secondary-button"
                onClick={() => navigate("/analyzer")}
              >
                Open Analyzer
              </button>

            </div>

          </div>

        </section>

        {/* Security Tools */}

        <section className="tools-section">

          <div className="section-title">
            <h2>Security Tools</h2>
            <p>Quick access to MailGuard security features.</p>
          </div>

          <div className="tools-grid">

            <button
              className="tool-card"
              onClick={() => navigate("/phishing")}
            >
              <span>🎣</span>
              <div>
                <h3>Phishing Detection</h3>
                <p>Detect suspicious emails and malicious content.</p>
              </div>
              <b>→</b>
            </button>

            <button
              className="tool-card"
              onClick={() => navigate("/social")}
            >
              <span>👥</span>
              <div>
                <h3>Social Analysis</h3>
                <p>Identify social engineering indicators.</p>
              </div>
              <b>→</b>
            </button>

            <button
              className="tool-card"
              onClick={() => navigate("/ip-tracing")}
            >
              <span>🌐</span>
              <div>
                <h3>IP Tracing</h3>
                <p>Investigate sender IP addresses.</p>
              </div>
              <b>→</b>
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;