
import { useState } from "react";
import "./EmailAnalysis.css";

function EmailAnalysis() {
  const [email, setEmail] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = () => {
    if (!email.trim()) {
      return;
    }

    setAnalyzed(true);
  };

  return (
    <div className="email-analysis">
      {/* Header */}
      <header className="analysis-header">
        <div className="header-content">
          <p className="analysis-eyebrow">EMAIL FORENSICS / ANALYSIS</p>

          <h1>Email Analysis</h1>

          <p className="header-description">
            Analyze suspicious emails and identify potential phishing,
            spoofing and malicious indicators.
          </p>
        </div>

        <div className="engine-status">
          <span className="status-light"></span>
          ANALYSIS ENGINE ONLINE
        </div>
      </header>

      {/* Input Section */}
      <section className="email-input-card">
        <div className="card-header">
          <div className="card-heading">
            <span className="step-number">01</span>

            <div>
              <p className="section-label">INPUT</p>
              <h2>Suspicious Email</h2>
            </div>
          </div>

          <span className="secure-label">SECURE ANALYSIS</span>
        </div>

        <textarea
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setAnalyzed(false);
          }}
          placeholder={`Paste the complete suspicious email here...

Example:
From: security@example.com
Subject: Urgent Account Verification

Dear User,
Your account requires immediate verification...`}
        />

        <div className="input-footer">
          <span className="character-count">
            {email.length} characters
          </span>

          <button
            className="analyze-button"
            onClick={handleAnalyze}
            disabled={!email.trim()}
          >
            <span>ANALYZE EMAIL</span>
            <span className="button-arrow">→</span>
          </button>
        </div>
      </section>

      {/* Analysis Result */}
      <section className="analysis-result-card">
        <div className="card-header">
          <div className="card-heading">
            <span className="step-number">02</span>

            <div>
              <p className="section-label">FORENSIC RESULT</p>
              <h2>Threat Analysis</h2>
            </div>
          </div>

          <span
            className={
              analyzed
                ? "result-status danger"
                : "result-status"
            }
          >
            {analyzed
              ? "THREAT DETECTED"
              : "WAITING FOR ANALYSIS"}
          </span>
        </div>

        {!analyzed ? (
          <div className="waiting-state">
            <div className="scanner-icon">⌁</div>

            <h3>Ready for Analysis</h3>

            <p>
              Paste an email above and start the analysis engine
              to inspect its security indicators.
            </p>
          </div>
        ) : (
          <div className="analysis-content">
            {/* Risk Score */}
            <div className="risk-panel">
              <p className="risk-title">THREAT SCORE</p>

              <div className="risk-score">
                <strong>87</strong>
                <span>/100</span>
              </div>

              <div className="risk-level">HIGH RISK</div>
            </div>

            {/* Indicators */}
            <div className="indicators">
              <div className="indicator danger-indicator">
                <div className="indicator-icon">!</div>

                <div className="indicator-info">
                  <strong>Sender Reputation</strong>
                  <span>
                    Suspicious sender identity detected
                  </span>
                </div>

                <b>HIGH</b>
              </div>

              <div className="indicator warning-indicator">
                <div className="indicator-icon">!</div>

                <div className="indicator-info">
                  <strong>Domain Analysis</strong>
                  <span>
                    Domain requires further investigation
                  </span>
                </div>

                <b>MEDIUM</b>
              </div>

              <div className="indicator safe-indicator">
                <div className="indicator-icon">✓</div>

                <div className="indicator-info">
                  <strong>SPF Verification</strong>
                  <span>
                    Authentication record detected
                  </span>
                </div>

                <b>PASS</b>
              </div>

              <div className="indicator safe-indicator">
                <div className="indicator-icon">✓</div>

                <div className="indicator-info">
                  <strong>URL Inspection</strong>
                  <span>
                    No obvious malicious URL pattern
                  </span>
                </div>

                <b>PASS</b>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Forensic Checks */}
      <section className="forensic-grid">
        {/* Identity */}
        <div className="forensic-card">
          <p className="section-label">IDENTITY</p>

          <h3>Sender Information</h3>

          <div className="data-row">
            <span>Sender</span>
            <strong>security@example.com</strong>
          </div>

          <div className="data-row">
            <span>Reply-To</span>
            <strong>Unknown</strong>
          </div>
        </div>

        {/* Network */}
        <div className="forensic-card">
          <p className="section-label">NETWORK</p>

          <h3>Infrastructure</h3>

          <div className="data-row">
            <span>IP Address</span>
            <strong>192.168.xxx.xxx</strong>
          </div>

          <div className="data-row">
            <span>Domain</span>
            <strong>example.com</strong>
          </div>
        </div>

        {/* Authentication */}
        <div className="forensic-card">
          <p className="section-label">AUTHENTICATION</p>

          <h3>Email Security</h3>

          <div className="data-row">
            <span>SPF</span>
            <strong className="pass">PASS</strong>
          </div>

          <div className="data-row">
            <span>DKIM</span>
            <strong className="warning">CHECK</strong>
          </div>

          <div className="data-row">
            <span>DMARC</span>
            <strong className="warning">CHECK</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EmailAnalysis;