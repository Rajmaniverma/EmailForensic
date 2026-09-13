import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EmailDetails.css";

const API_URL = "https://emailforensic.onrender.com";

// Each analysis tool maps to one existing backend route.
// Nothing here invents a new endpoint — these are the four
// routes already implemented in Gmail.py.
const ANALYSIS_TOOLS = [
  {
    key: "analyze",
    label: "Email Analyzer",
    description: "General forensic analysis of this email.",
    icon: "🔍",
    path: (id) => `/gmail/analyze/${id}`,
  },
  {
    key: "phishing",
    label: "Phishing Detection",
    description: "Check this email for phishing indicators.",
    icon: "🎣",
    path: (id) => `/gmail/Phising/${id}`,
  },
  {
    key: "social",
    label: "Social Engineering",
    description: "Look for manipulation and impersonation tactics.",
    icon: "👥",
    path: (id) => `/gmail/Social/${id}`,
  },
];

function EmailDetail() {
  const { messageId } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Per-tool analysis state: { [key]: { loading, result, error } }
  const [analysis, setAnalysis] = useState({});

  const getToken = () => localStorage.getItem("access_token");

  useEffect(() => {
    const loadEmail = async () => {
      const token = getToken();

      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/gmail/message/${messageId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch this email");
        }

        const data = await response.json();
        console.log("Gmail message detail:", data);

        setEmail(data.message || data);
      } catch (err) {
        console.error("Email detail error:", err);
        setError("This email couldn't be loaded.");
      } finally {
        setLoading(false);
      }
    };

    loadEmail();
  }, [messageId, navigate]);

  const runAnalysis = async (tool) => {
    const token = getToken();
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    setAnalysis((prev) => ({
      ...prev,
      [tool.key]: { loading: true, result: prev[tool.key]?.result, error: null },
    }));

    try {
      const response = await fetch(`${API_URL}${tool.path(messageId)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`${tool.label} request failed`);
      }

      const data = await response.json();

      setAnalysis((prev) => ({
        ...prev,
        [tool.key]: { loading: false, result: data, error: null },
      }));
    } catch (err) {
      console.error(`${tool.label} error:`, err);
      setAnalysis((prev) => ({
        ...prev,
        [tool.key]: { loading: false, result: null, error: "Analysis failed." },
      }));
    }
  };

  if (loading) {
    return (
      <div className="email-detail-loading">
        <div className="loading-spinner"></div>
        <p>Opening email…</p>
      </div>
    );
  }

  // Only render fields the backend actually returned.
  const subject = email?.name || email?.subject;
  const from = email?.from || email?.sender;
  const date = email?.date;
  const body = email?.body || email?.snippet;
  const attachments = email?.attachments;

  return (
    <div className="email-detail">
      {/* =====================================
          TOP ACTION BAR
      ===================================== */}

      <div className="email-detail-toolbar">
        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          <span aria-hidden="true">←</span> Back to Inbox
        </button>

        <div className="toolbar-actions">
          <button className="icon-button" title="Archive">
            🗃
          </button>
          <button className="icon-button" title="Report spam">
            🚫
          </button>
          <button className="icon-button" title="Delete">
            🗑
          </button>
          <button className="icon-button" title="More">
            ⋮
          </button>
        </div>
      </div>

      <div className="email-detail-body">
        {/* =================================
            EMAIL CONTENT
        ================================= */}

        <div className="email-content-panel">
          {error ? (
            <div className="email-error">{error}</div>
          ) : (
            <>
              <h1 className="email-subject">
                {subject || "(No subject available)"}
              </h1>

              <div className="email-meta">
                <div className="sender-avatar" aria-hidden="true">
                  {(from || "?").charAt(0).toUpperCase()}
                </div>
                <div className="sender-info">
                  <div className="sender-name">
                    {from || "Sender information unavailable"}
                  </div>
                  {date && <div className="sender-date">{date}</div>}
                </div>
              </div>

              <div className="email-body-text">
                {body ? (
                  body
                ) : (
                  <span className="email-body-empty">
                    This email has no body content available from the
                    backend.
                  </span>
                )}
              </div>

              {Array.isArray(attachments) && attachments.length > 0 && (
                <div className="email-attachments">
                  <div className="attachments-title">
                    Attachments ({attachments.length})
                  </div>
                  <div className="attachments-list">
                    {attachments.map((att, i) => (
                      <div className="attachment-chip" key={i}>
                        📎 {att.name || att.filename || `Attachment ${i + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="message-id-footer">
                Message ID: <code>{messageId}</code>
              </div>
            </>
          )}
        </div>

        {/* =================================
            MAILGUARD SECURITY PANEL
        ================================= */}

        <aside className="mailguard-panel">
          <div className="mailguard-panel-header">
            <span aria-hidden="true">🛡</span> MailGuard Security Analysis
          </div>

          <div className="mailguard-tools">
            {ANALYSIS_TOOLS.map((tool) => {
              const state = analysis[tool.key];

              return (
                <div className="mailguard-tool" key={tool.key}>
                  <div className="mailguard-tool-header">
                    <span className="mailguard-tool-icon">{tool.icon}</span>
                    <div>
                      <div className="mailguard-tool-label">
                        {tool.label}
                      </div>
                      <div className="mailguard-tool-desc">
                        {tool.description}
                      </div>
                    </div>
                  </div>

                  <button
                    className="mailguard-run-button"
                    onClick={() => runAnalysis(tool)}
                    disabled={state?.loading}
                  >
                    {state?.loading
                      ? "Analyzing…"
                      : state?.result
                      ? "Re-analyze"
                      : "Analyze"}
                  </button>

                  {state?.error && (
                    <div className="mailguard-result error">
                      {state.error}
                    </div>
                  )}

                  {state?.result && !state.loading && (
                    <pre className="mailguard-result">
                      {JSON.stringify(state.result, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}

            <div className="mailguard-tool">
              <div className="mailguard-tool-header">
                <span className="mailguard-tool-icon">🌐</span>
                <div>
                  <div className="mailguard-tool-label">IP Tracing</div>
                  <div className="mailguard-tool-desc">
                    Trace originating IPs from this email's headers.
                  </div>
                </div>
              </div>

              <button
                className="mailguard-run-button"
                onClick={() => navigate(`/ip-tracing?message_id=${messageId}`)}
              >
                Trace IP
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default EmailDetail;