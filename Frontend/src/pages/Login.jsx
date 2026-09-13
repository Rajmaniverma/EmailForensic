import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = "https://emailforensic.onrender.com";

function Login() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setCheckingAuth(false);
          return;
        }

        const response = await fetch(`${API_URL}/auth/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to check authentication");
        }

        const data = await response.json();

        console.log("Auth status:", data);

        if (data.authenticated === true) {
          navigate("/dashboard", { replace: true });
          return;
        }

        localStorage.removeItem("access_token");
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/login`;
  };

  if (checkingAuth) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="login-page">

      {/* =====================================================
          BACKGROUND GMAIL DEMO
      ====================================================== */}
      <div className="gmail-demo">

        {/* Gmail Header */}
        <div className="demo-header">

          <div className="demo-logo">
            <span className="gmail-m">M</span>
            <span>Gmail</span>
          </div>

          <div className="demo-search">
            <span>🔍</span>
            <span>Search mail</span>
          </div>

          <div className="demo-header-icons">
            <span>⚙</span>
            <span>?</span>
            <span>✦</span>
            <div className="demo-avatar">R</div>
          </div>

        </div>

        {/* Main Gmail Area */}
        <div className="demo-main">

          {/* Sidebar */}
          <aside className="demo-sidebar">

            <button className="demo-compose">
              ✎
              <span>Compose</span>
            </button>

            <div className="demo-nav active">
              <span>📥</span>
              <span>Inbox</span>
              <strong>1,797</strong>
            </div>

            <div className="demo-nav">
              <span>☆</span>
              <span>Starred</span>
            </div>

            <div className="demo-nav">
              <span>◷</span>
              <span>Snoozed</span>
            </div>

            <div className="demo-nav">
              <span>➤</span>
              <span>Sent</span>
            </div>

            <div className="demo-nav">
              <span>📝</span>
              <span>Drafts</span>
              <strong>1</strong>
            </div>

            <div className="demo-nav">
              <span>🛍</span>
              <span>Purchases</span>
              <strong>5</strong>
            </div>

            <div className="demo-more">
              <span>⌄</span>
              <span>More</span>
            </div>

            <div className="demo-label-title">
              Labels
            </div>

            <div className="demo-nav security">
              <span>🛡️</span>
              <span>MailGuard Security</span>
            </div>

            <div className="demo-nav">
              <span>🎣</span>
              <span>Phishing Detection</span>
            </div>

            <div className="demo-nav">
              <span>👥</span>
              <span>Social Analysis</span>
            </div>

            <div className="demo-nav">
              <span>🌐</span>
              <span>IP Tracing</span>
            </div>

            <div className="demo-nav">
              <span>🔍</span>
              <span>Email Analyzer</span>
            </div>

          </aside>

          {/* Inbox */}
          <main className="demo-content">

            <div className="demo-toolbar">
              <span>←</span>
              <span>□</span>
              <span>!</span>
              <span>🗑</span>
              <span>✉</span>
              <span>◷</span>
              <span>⋮</span>
            </div>

            <div className="demo-email-header">

              <h1>
                Raj, like a mirror, but for your taste
              </h1>

              <span className="demo-inbox-tag">
                Inbox
              </span>

            </div>

            <div className="demo-sender">

              <div className="demo-sender-avatar">
                P
              </div>

              <div>
                <strong>Pinterest</strong>
                <span>
                  &lt;recommendations@discover.pinterest.com&gt;
                </span>

                <div className="demo-to">
                  to me
                </div>
              </div>

              <div className="demo-date">
                13 Sept 2026, 10:02
              </div>

            </div>

            {/* Fake email body */}
            <div className="demo-email-body">

              <div className="pinterest-logo">
                P
              </div>

              <h2>
                Raj, like a mirror,
                <br />
                but for your taste
              </h2>

              <p>
                Discover ideas and inspiration based
                on things you love.
              </p>

              <div className="demo-images">

                <div className="fake-image image-one">
                  <span>Nature</span>
                </div>

                <div className="fake-image image-two">
                  <span>Travel</span>
                </div>

                <div className="fake-image image-three">
                  <span>Cars</span>
                </div>

              </div>

            </div>

          </main>

          {/* MailGuard Panel */}
          <aside className="demo-security-panel">

            <div className="security-header">
              <span>🛡️</span>
              <div>
                <strong>MailGuard</strong>
                <small>Security Analysis</small>
              </div>
            </div>

            <div className="security-tool">
              <div className="tool-icon">
                🔍
              </div>

              <div>
                <strong>Email Analyzer</strong>
                <p>
                  General forensic analysis of this email.
                </p>
              </div>

              <button>
                Analyze
              </button>
            </div>

            <div className="security-tool">
              <div className="tool-icon">
                🎣
              </div>

              <div>
                <strong>Phishing Detection</strong>
                <p>
                  Check this email for phishing indicators.
                </p>
              </div>

              <button>
                Analyze
              </button>
            </div>

            <div className="security-tool">
              <div className="tool-icon">
                👥
              </div>

              <div>
                <strong>Social Engineering</strong>
                <p>
                  Look for manipulation and impersonation tactics.
                </p>
              </div>

              <button>
                Analyze
              </button>
            </div>

            <div className="security-tool">
              <div className="tool-icon">
                🌐
              </div>

              <div>
                <strong>IP Tracing</strong>
                <p>
                  Trace originating IPs from this email's headers.
                </p>
              </div>

              <button>
                Trace IP
              </button>
            </div>

          </aside>

        </div>
      </div>

      {/* =====================================================
          DARK / BLUR OVERLAY
      ====================================================== */}
      <div className="login-overlay"></div>


      {/* =====================================================
          LOGIN CARD
      ====================================================== */}
      <div className="login-center">

        <div className="login-card">

          <div className="login-brand-icon">
            🛡️
          </div>

          <h2>
            Welcome to MailGuard
          </h2>

          <p className="login-subtitle">
            Sign in to analyze and secure your emails
          </p>

          <button
            className="google-login-btn"
            onClick={handleGoogleLogin}
          >
            <span className="google-icon">
              G
            </span>

            <span>
              Continue with Google
            </span>
          </button>

          <div className="divider">
            <span>SECURE LOGIN</span>
          </div>

          <p className="privacy-text">
            By continuing, you allow MailGuard to securely
            access your Gmail account for email analysis.
          </p>

          <div className="security-note">
            <span>🔒</span>
            <span>
              Your connection is secure
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;