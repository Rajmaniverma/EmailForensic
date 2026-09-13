import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_URL = "https://emailforensic.onrender.com";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // =========================================
        // GET TOKEN FROM URL
        // =========================================

        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token");

        if (urlToken) {
          localStorage.setItem("access_token", urlToken);

          // Remove token from browser URL
          window.history.replaceState(
            {},
            document.title,
            "/dashboard"
          );
        }

        // =========================================
        // GET TOKEN FROM LOCAL STORAGE
        // =========================================

        const token = urlToken || localStorage.getItem("access_token");

        if (!token) {
          navigate("/", { replace: true });
          return;
        }

        // =========================================
        // CHECK AUTHENTICATION
        // =========================================

        const authResponse = await fetch(
          `${API_URL}/auth/status`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!authResponse.ok) {
          throw new Error("Failed to check authentication");
        }

        const authData = await authResponse.json();

        console.log("Dashboard Auth:", authData);

        if (authData.authenticated !== true) {
          localStorage.removeItem("access_token");
          navigate("/", { replace: true });
          return;
        }

        setUser(authData.user);

        // =========================================
        // GET GMAIL MESSAGES
        // =========================================

        const gmailResponse = await fetch(
          `${API_URL}/gmail/messages`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!gmailResponse.ok) {
          throw new Error("Failed to fetch Gmail messages");
        }

        const gmailData = await gmailResponse.json();

        console.log("Gmail Messages:", gmailData);

        if (gmailData.success) {
          setMessages(gmailData.messages || []);
        } else {
          setMessages([]);
        }

      } catch (error) {
        console.error("Dashboard error:", error);

        localStorage.removeItem("access_token");
        navigate("/", { replace: true });

      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading Gmail...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // =========================================
  // SEARCH
  // =========================================

  const filteredMessages = messages.filter((message) =>
    message.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  // =========================================
  // DASHBOARD
  // =========================================

  return (
    <div className="gmail-dashboard">

      {/* =====================================
          TOP HEADER
      ===================================== */}

      <header className="gmail-header">

        <div className="gmail-logo-area">

          <button className="menu-button">
            ☰
          </button>

          <div className="gmail-logo">
            <span className="gmail-m">M</span>
            <span>Gmail</span>
          </div>

        </div>

        {/* Search */}

        <div className="gmail-search">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <span className="search-filter">
            ☷
          </span>

        </div>

        {/* Header actions */}

        <div className="gmail-header-actions">

          <button title="Help">
            ?
          </button>

          <button title="Settings">
            ⚙
          </button>

          <button title="Google apps">
            ⋮⋮
          </button>

          <div className="profile-circle">
            {user.photo ? (
              <img
                src={user.photo}
                alt={user.name}
              />
            ) : (
              user.name?.charAt(0).toUpperCase()
            )}
          </div>

        </div>

      </header>


      {/* =====================================
          BODY
      ===================================== */}

      <div className="gmail-body">

        {/* =================================
            SIDEBAR
        ================================= */}

        <aside className="gmail-sidebar">

          <button
            className="compose-button"
            onClick={() => navigate("/analyzer")}
          >
            <span>✎</span>
            Compose
          </button>


          <nav className="gmail-nav">

            <button className="gmail-nav-item active">
              <span>📥</span>
              <strong>Inbox</strong>
              <b>{messages.length}</b>
            </button>

            <button className="gmail-nav-item">
              <span>☆</span>
              Starred
            </button>

            <button className="gmail-nav-item">
              <span>◷</span>
              Snoozed
            </button>

            <button className="gmail-nav-item">
              <span>➤</span>
              Sent
            </button>

            <button className="gmail-nav-item">
              <span>📝</span>
              Drafts
              <b>0</b>
            </button>

            <button className="gmail-nav-item">
              <span>🛍</span>
              Purchases
              <b>0</b>
            </button>

            <button className="gmail-nav-item">
              <span>⌄</span>
              More
            </button>

          </nav>


          <div className="labels-section">

            <div className="labels-header">
              <strong>Labels</strong>
              <button>＋</button>
            </div>

          </div>


          {/* MailGuard tools */}

          <div className="mailguard-section">

            <div className="mailguard-title">
              MailGuard
            </div>

            <button
              onClick={() => navigate("/phishing")}
            >
              🎣 Phishing
            </button>

            <button
              onClick={() => navigate("/social")}
            >
              👥 Social Analysis
            </button>

            <button
              onClick={() => navigate("/ip-tracing")}
            >
              🌐 IP Tracing
            </button>

            <button
              onClick={() => navigate("/analyzer")}
            >
              🔍 Email Analyzer
            </button>

          </div>

        </aside>


        {/* =================================
            MAIN EMAIL AREA
        ================================= */}

        <main className="gmail-main">

          {/* Toolbar */}

          <div className="gmail-toolbar">

            <div className="toolbar-left">

              <button>
                □
              </button>

              <button>
                ↻
              </button>

              <button>
                ⋮
              </button>

            </div>

            <div className="toolbar-right">

              <span>
                1–{filteredMessages.length} of{" "}
                {messages.length}
              </span>

              <button>
                ‹
              </button>

              <button>
                ›
              </button>

            </div>

          </div>


          {/* =================================
              EMAIL LIST
          ================================= */}

          <div className="email-list">

            {filteredMessages.length === 0 ? (

              <div className="empty-inbox">
                <div>📭</div>
                <h3>No emails found</h3>
                <p>
                  Your Gmail inbox doesn't contain
                  matching messages.
                </p>
              </div>

            ) : (

              filteredMessages.map((message) => (

                <div
                  className="email-row"
                  key={message.message_id}
                  onClick={() => {

                    console.log(
                      "Selected Gmail message:",
                      message.message_id
                    );

                    // Later:
                    // navigate(`/email/${message.message_id}`);
                  }}
                >

                  {/* Checkbox */}

                  <div className="email-checkbox">
                    □
                  </div>

                  {/* Star */}

                  <div className="email-star">
                    ☆
                  </div>

                  {/* Sender */}

                  <div className="email-sender">
                    Gmail
                  </div>

                  {/* Subject */}

                  <div className="email-content">

                    <strong>
                      {message.name}
                    </strong>

                    <span className="email-preview">
                      — Click to open and analyze this
                      email
                    </span>

                  </div>

                  {/* Message ID */}

                  <div className="email-id">
                    {message.message_id}
                  </div>

                </div>

              ))

            )}

          </div>

        </main>

      </div>

    </div>
  );
}

export default Dashboard;