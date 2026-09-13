import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_URL = "https://emailforensic.onrender.com";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // =========================================
  // PAGINATION STATE
  // =========================================
  // tokenHistory holds the page_token used to fetch every page we've
  // visited, in order, so "Previous" can step backwards without the
  // backend needing to provide a previousPageToken.
  //   tokenHistory[0]      -> null (first page, no token)
  //   tokenHistory[1]      -> token used to fetch page 2
  //   ...
  const [tokenHistory, setTokenHistory] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasNext, setHasNext] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const refreshInFlight = useRef(false);

  // =========================================
  // AUTH TOKEN HELPER (unchanged behavior)
  // =========================================

  const getToken = () => localStorage.getItem("access_token");

  // =========================================
  // FETCH A PAGE OF GMAIL MESSAGES
  // =========================================

  const fetchMessages = useCallback(
    async (pageToken, { isInitial = false } = {}) => {
      const token = getToken();
      if (!token) {
        navigate("/", { replace: true });
        return null;
      }

      const url = pageToken
        ? `${API_URL}/gmail/messages?page_token=${encodeURIComponent(
            pageToken
          )}`
        : `${API_URL}/gmail/messages`;

      const gmailResponse = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!gmailResponse.ok) {
        throw new Error("Failed to fetch Gmail messages");
      }

      const gmailData = await gmailResponse.json();

      if (!isInitial) {
        console.log("Gmail Messages:", gmailData);
      }

      if (gmailData.success) {
        setMessages(gmailData.messages || []);
        setNextPageToken(gmailData.next_page_token || null);
        setHasNext(Boolean(gmailData.has_next));
      } else {
        setMessages([]);
        setNextPageToken(null);
        setHasNext(false);
      }

      return gmailData;
    },
    [navigate]
  );

  // =========================================
  // INITIAL LOAD (auth check unchanged, then first page of messages)
  // =========================================

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
          window.history.replaceState({}, document.title, "/dashboard");
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

        const authResponse = await fetch(`${API_URL}/auth/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
        // GET FIRST PAGE OF GMAIL MESSAGES
        // =========================================

        await fetchMessages(null, { isInitial: true });
      } catch (error) {
        console.error("Dashboard error:", error);

        localStorage.removeItem("access_token");
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // =========================================
  // NEXT / PREVIOUS PAGE
  // =========================================

  const handleNext = async () => {
    if (!hasNext || !nextPageToken || pageLoading) return;

    setPageLoading(true);
    try {
      await fetchMessages(nextPageToken);
      setTokenHistory((prev) => {
        const updated = prev.slice(0, pageIndex + 1);
        updated.push(nextPageToken);
        return updated;
      });
      setPageIndex((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to load next page:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const handlePrevious = async () => {
    if (pageIndex === 0 || pageLoading) return;

    setPageLoading(true);
    try {
      const previousIndex = pageIndex - 1;
      const previousToken = tokenHistory[previousIndex];
      await fetchMessages(previousToken);
      setPageIndex(previousIndex);
    } catch (error) {
      console.error("Failed to load previous page:", error);
    } finally {
      setPageLoading(false);
    }
  };

  // =========================================
  // REFRESH
  // =========================================

  const handleRefresh = async () => {
    if (refreshInFlight.current) return;

    const token = getToken();
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    refreshInFlight.current = true;
    setRefreshing(true);

    try {
      const refreshResponse = await fetch(`${API_URL}/gmail/refresh`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh Gmail messages");
      }

      const refreshData = await refreshResponse.json();

      console.log("Gmail Refresh:", refreshData);

      if (refreshData.success) {
        setMessages(refreshData.messages || []);
        setNextPageToken(refreshData.next_page_token || null);
        setHasNext(Boolean(refreshData.has_next));
      }

      // Reset pagination to the first page after a refresh.
      setTokenHistory([null]);
      setPageIndex(0);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
      refreshInFlight.current = false;
    }
  };

  // =========================================
  // OPEN EMAIL
  // =========================================

  const openEmail = (messageId) => {
    if (!messageId) return;
    navigate(`/email/${messageId}`);
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading Gmail…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // =========================================
  // SEARCH (client-side filter over the current page only —
  // the backend does not expose a search endpoint)
  // =========================================

  const filteredMessages = messages.filter((message) =>
    message.name?.toLowerCase().includes(search.toLowerCase())
  );

  const rangeStart = filteredMessages.length === 0 ? 0 : 1;
  const rangeEnd = filteredMessages.length;

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
          <button className="icon-button menu-button" aria-label="Main menu">
            <span className="hamburger" />
          </button>

          <div className="gmail-logo">
            <span className="gmail-m" aria-hidden="true">
              🛡
            </span>
            <span className="gmail-logo-text">MailGuard</span>
          </div>
        </div>

        {/* Search */}

        <div className="gmail-search">
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <span className="search-filter" aria-hidden="true">
            ☷
          </span>
        </div>

        {/* Header actions */}

        <div className="gmail-header-actions">
          <button className="icon-button" title="Help">
            ?
          </button>

          <button className="icon-button" title="Settings">
            ⚙
          </button>

          <button className="icon-button" title="Google apps">
            ⋮⋮
          </button>

          <div className="profile-circle" title={user.name}>
            {user.photo ? (
              <img src={user.photo} alt={user.name} />
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
            <span className="compose-icon">✎</span>
            Compose
          </button>

          <nav className="gmail-nav">
            <button className="gmail-nav-item active">
              <span className="nav-icon">📥</span>
              <strong>Inbox</strong>
              <b>{messages.length}</b>
            </button>

            <button className="gmail-nav-item">
              <span className="nav-icon">☆</span>
              Starred
            </button>

            <button className="gmail-nav-item">
              <span className="nav-icon">◷</span>
              Snoozed
            </button>

            <button className="gmail-nav-item">
              <span className="nav-icon">➤</span>
              Sent
            </button>

            <button className="gmail-nav-item">
              <span className="nav-icon">📝</span>
              Drafts
              <b>0</b>
            </button>

            <button className="gmail-nav-item">
              <span className="nav-icon">🛍</span>
              Purchases
              <b>0</b>
            </button>

            <button className="gmail-nav-item">
              <span className="nav-icon">⌄</span>
              More
            </button>
          </nav>

          <div className="labels-section">
            <div className="labels-header">
              <strong>Labels</strong>
              <button aria-label="Add label">＋</button>
            </div>
          </div>

          {/* MailGuard tools */}

          <div className="mailguard-section">
            <div className="mailguard-title">
              <span aria-hidden="true">🛡</span> MailGuard Security
            </div>

            <button onClick={() => navigate("/phishing")}>
              <span className="nav-icon">🎣</span> Phishing Detection
            </button>

            <button onClick={() => navigate("/social")}>
              <span className="nav-icon">👥</span> Social Analysis
            </button>

            <button onClick={() => navigate("/ip-tracing")}>
              <span className="nav-icon">🌐</span> IP Tracing
            </button>

            <button onClick={() => navigate("/analyzer")}>
              <span className="nav-icon">🔍</span> Email Analyzer
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
              <button className="icon-button" title="Select">
                □
              </button>

              <button
                className={`icon-button refresh-button ${
                  refreshing ? "spinning" : ""
                }`}
                title="Refresh"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                ↻
              </button>

              <button className="icon-button" title="More">
                ⋮
              </button>
            </div>

            <div className="toolbar-right">
              <span className="range-label">
                {rangeStart}–{rangeEnd} of {messages.length}
              </span>

              <button
                className="icon-button"
                title="Previous page"
                onClick={handlePrevious}
                disabled={pageIndex === 0 || pageLoading}
              >
                ‹
              </button>

              <button
                className="icon-button"
                title="Next page"
                onClick={handleNext}
                disabled={!hasNext || pageLoading}
              >
                ›
              </button>
            </div>
          </div>

          {/* =================================
              EMAIL LIST
          ================================= */}

          <div className="email-list">
            {pageLoading ? (
              <div className="page-loading">
                <div className="loading-spinner small"></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="empty-inbox">
                <div className="empty-inbox-icon">📭</div>
                <h3>No emails found</h3>
                <p>Your Gmail inbox doesn't contain matching messages.</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  className="email-row"
                  key={message.message_id}
                  onClick={() => openEmail(message.message_id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openEmail(message.message_id);
                  }}
                >
                  {/* Checkbox */}
                  <div
                    className="email-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    □
                  </div>

                  {/* Star */}
                  <div
                    className="email-star"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ☆
                  </div>

                  {/* Sender */}
                  <div className="email-sender">Gmail</div>

                  {/* Subject */}
                  <div className="email-content">
                    <strong>{message.name}</strong>
                    <span className="email-preview">
                      — Click to open and analyze this email
                    </span>
                  </div>

                  {/* Message ID */}
                  <div className="email-id">{message.message_id}</div>

                  {/* Open indicator */}
                  <div className="email-open-arrow" aria-hidden="true">
                    ›
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
