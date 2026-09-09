import { useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [email, setEmail] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = () => {
    if (email.trim()) {
      setAnalyzed(true);
    }
  };

  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <span>◈</span> EMAIL<span>GUARD</span>
        </div>

        <nav>
          <div className="nav-item active">⌂ Dashboard</div>
          <div className="nav-item">◉ Email Analysis</div>
          <div className="nav-item">◈ Threat Intelligence</div>
          <div className="nav-item">◌ Reports</div>
          <div className="nav-item">⚙ Settings</div>
        </nav>

        <div className="system-status">
          <span className="status-dot"></span>
          SYSTEM ONLINE
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">

        <header className="topbar">
          <div>
            <p className="eyebrow">SECURITY OPERATIONS CENTER</p>
            <h1>Email Threat Detection</h1>
          </div>

          <div className="user-box">
            <div className="avatar">R</div>
            <div>
              <strong>Analyst</strong>
              <small>Security Team</small>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="stats-grid">

          <div className="stat-card">
            <span>Total Scans</span>
            <strong>1,284</strong>
            <small>↑ 12.5% this week</small>
          </div>

          <div className="stat-card danger">
            <span>Threats Detected</span>
            <strong>186</strong>
            <small>↑ 8.2% this week</small>
          </div>

          <div className="stat-card safe">
            <span>Safe Emails</span>
            <strong>1,098</strong>
            <small>85.5% of total scans</small>
          </div>

          <div className="stat-card warning">
            <span>High Risk</span>
            <strong>42</strong>
            <small>Requires attention</small>
          </div>

        </section>

        {/* Email Analyzer */}
        <section className="analyzer-card">

          <div className="section-heading">
            <div>
              <p className="eyebrow">LIVE ANALYSIS</p>
              <h2>Analyze Suspicious Email</h2>
            </div>

            <span className="live-badge">
              <span></span> LIVE ENGINE
            </span>
          </div>

          <p className="description">
            Paste the complete email content below to analyze sender identity,
            headers, URLs, domains and potential security threats.
          </p>

          <textarea
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Paste Suspicious Email Here..."
          />

          <div className="analyzer-actions">
            <span>{email.length} characters</span>

            <button onClick={handleAnalyze}>
              ANALYZE EMAIL →
            </button>
          </div>

        </section>

        {/* Results */}
        <section className="results-grid">

          <div className="result-card">
            <div className="card-title">
              <h2>Analysis Result</h2>
              <span className={analyzed ? "risk high" : "risk pending"}>
                {analyzed ? "HIGH RISK" : "WAITING"}
              </span>
            </div>

            {analyzed ? (
              <div className="result-content">
                <div className="score">
                  <strong>87</strong>
                  <span>/100</span>
                </div>

                <div>
                  <h3>Potentially Malicious</h3>
                  <p>
                    Suspicious indicators detected. Further investigation
                    recommended.
                  </p>
                </div>
              </div>
            ) : (
              <p className="empty-result">
                Submit an email above to generate the threat analysis.
              </p>
            )}
          </div>

          <div className="result-card">
            <div className="card-title">
              <h2>Security Checks</h2>
              <span>4 CHECKS</span>
            </div>

            <div className="check">
              <span>✓</span>
              <div>
                <strong>SPF Verification</strong>
                <small>Authentication check</small>
              </div>
            </div>

            <div className="check">
              <span>✓</span>
              <div>
                <strong>DKIM Verification</strong>
                <small>Signature validation</small>
              </div>
            </div>

            <div className="check warning-check">
              <span>!</span>
              <div>
                <strong>Domain Reputation</strong>
                <small>Suspicious indicators</small>
              </div>
            </div>

            <div className="check">
              <span>✓</span>
              <div>
                <strong>URL Analysis</strong>
                <small>Link inspection</small>
              </div>
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}

export default Dashboard;