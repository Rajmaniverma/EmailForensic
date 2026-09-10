import { useState, useEffect, useRef } from "react";
import { Link,NavLink} from "react-router-dom";
import "./Dashboard.css";

/* ---------------- Mock Data ---------------- */

const STATS = [
  { id: "scans", label: "Emails Analyzed", value: 1284, trend: "+12.5%", dir: "up", tone: "cyan" },
  { id: "threats", label: "Threats Detected", value: 327, trend: "+8.2%", dir: "up", tone: "danger" },
  { id: "highrisk", label: "High Risk Emails", value: 86, trend: "+3.1%", dir: "up", tone: "warning" },
  { id: "accuracy", label: "Detection Accuracy", value: 96.8, suffix: "%", trend: "+0.4%", dir: "up", tone: "safe" },
];

const WEEK_ACTIVITY = [
  { day: "Mon", safe: 62, suspicious: 18, high: 6 },
  { day: "Tue", safe: 74, suspicious: 22, high: 9 },
  { day: "Wed", safe: 58, suspicious: 30, high: 14 },
  { day: "Thu", safe: 81, suspicious: 15, high: 5 },
  { day: "Fri", safe: 69, suspicious: 26, high: 11 },
  { day: "Sat", safe: 40, suspicious: 10, high: 3 },
  { day: "Sun", safe: 35, suspicious: 8, high: 2 },
];

const THREAT_DISTRIBUTION = [
  { label: "Phishing", value: 42, tone: "cyan" },
  { label: "Spoofing", value: 21, tone: "purple" },
  { label: "BEC", value: 16, tone: "warning" },
  { label: "Malware", value: 11, tone: "danger" },
  { label: "Credential Theft", value: 7, tone: "pink" },
  { label: "Other", value: 3, tone: "muted" },
];

const RECENT_ANALYSES = [
  { subject: "Your account requires verification", sender: "security-update@paypa1-secure.com", type: "Phishing", score: 92, status: "High Risk", date: "Sep 10, 2026" },
  { subject: "Invoice Payment Required", sender: "billing@invoice-alerts.net", type: "BEC", score: 81, status: "High Risk", date: "Sep 09, 2026" },
  { subject: "Meeting Invitation", sender: "hr@company.com", type: "—", score: 12, status: "Safe", date: "Sep 09, 2026" },
  { subject: "Password reset requested", sender: "no-reply@accounts-verify.support", type: "Credential Theft", score: 74, status: "Suspicious", date: "Sep 08, 2026" },
  { subject: "Quarterly report attached", sender: "reports@company.com", type: "—", score: 6, status: "Safe", date: "Sep 08, 2026" },
];



const SERVICES = [
  { name: "Email Analysis", status: "Operational" },
  { name: "Threat Detection", status: "Operational" },
  { name: "AI Engine", status: "Operational" },
  { name: "Database", status: "Operational" },
];

export const NAV_ITEMS = [
  { icon: "⌂", label: "Dashboard", path: "/" },
  { icon: "◉", label: "Email Analysis", path: "/email-analysis" },
  { icon: "◷", label: "Analysis History", path: "/history" },
  { icon: "◈", label: "Threat Intelligence", path: "/threat-intelligence" },
  { icon: "◌", label: "Reports", path: "/reports" },
  { icon: "⚙", label: "Settings", path: "/settings" },
];


const NOTIFICATIONS = [
  { title: "High risk email detected", time: "2m ago", tone: "danger" },
  { title: "Weekly report is ready", time: "1h ago", tone: "cyan" },
  { title: "New signature update applied", time: "3h ago", tone: "safe" },
];

/* ---------------- Small Components ---------------- */

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    let frame;
    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function StatCard({ stat, index }) {
  const animated = useCountUp(stat.value);
  const display = Number.isInteger(stat.value)
    ? Math.round(animated).toLocaleString()
    : animated.toFixed(1);

  return (
    <div
      className={`stat-card tone-${stat.tone}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="stat-top">
        <span className="stat-label">{stat.label}</span>
        <span className={`stat-icon tone-${stat.tone}`}>
          {stat.id === "scans" && "◎"}
          {stat.id === "threats" && "⚠"}
          {stat.id === "highrisk" && "☠"}
          {stat.id === "accuracy" && "✓"}
        </span>
      </div>
      <strong className="stat-value">
        {display}
        {stat.suffix || ""}
      </strong>
      <div className={`stat-trend ${stat.dir}`}>
        <span className="trend-arrow">{stat.dir === "up" ? "↑" : "↓"}</span>
        {stat.trend} this week
      </div>
    </div>
  );
}

function ActivityChart({ data }) {
  const max = Math.max(...data.map((d) => d.safe + d.suspicious + d.high));

  return (
    <div className="activity-chart">
      {data.map((d, i) => {
        const total = d.safe + d.suspicious + d.high;
        const heightPct = (total / max) * 100;
        return (
          <div className="chart-col" key={d.day}>
            <div className="chart-bar-track">
              <div
                className="chart-bar"
                style={{ "--target-h": `${heightPct}%`, animationDelay: `${i * 90}ms` }}
              >
                <div
                  className="segment safe"
                  style={{ height: `${(d.safe / total) * 100}%` }}
                />
                <div
                  className="segment suspicious"
                  style={{ height: `${(d.suspicious / total) * 100}%` }}
                />
                <div
                  className="segment high"
                  style={{ height: `${(d.high / total) * 100}%` }}
                />
              </div>
            </div>
            <span className="chart-day">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

function DistributionBar({ item, index }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(item.value), 120 + index * 90);
    return () => clearTimeout(t);
  }, [item.value, index]);

  return (
    <div className="distribution-row">
      <div className="distribution-label">
        <span>{item.label}</span>
        <strong>{item.value}%</strong>
      </div>
      <div className="distribution-track">
        <div
          className={`distribution-fill tone-${item.tone}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls =
    status === "Safe" ? "safe" : status === "Suspicious" ? "suspicious" : "high";
  return <span className={`badge ${cls}`}>{status}</span>;
}

/* ---------------- Main Dashboard ---------------- */

const RISK_SCORE = 87;
const RING_CIRCUMFERENCE = 2 * Math.PI * 52; // matches r=52 on the score SVG

function Dashboard() {
  const [email, setEmail] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAnalyze = () => {
    if (!email.trim() || analyzing) return;
    setAnalyzed(false);
    setAnalyzing(true);
    timeoutRef.current = setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 1600);
  };

  const handleClear = () => {
    setEmail("");
    setAnalyzed(false);
    setAnalyzing(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <>
      {/* Stats */}
      <section className="stats-grid">
          {STATS.map((stat, i) => (
            <StatCard stat={stat} index={i} key={stat.id} />
          ))}
        </section>

        <div className="content-grid">
          <div className="content-main">
            {/* Email Analyzer */}
            <section className="analyzer-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">LIVE ANALYSIS</p>
                  <h2>Analyze Suspicious Email</h2>
                  <p className="description">
                    Paste the email content below to identify potential threats.
                  </p>
                </div>

                <span className="live-badge">
                  <span className="live-dot" /> LIVE ENGINE
                </span>
              </div>

              <textarea
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Paste suspicious email content here..."
                aria-label="Email content to analyze"
              />

              <div className="analyzer-actions">
                <span className="char-count">{email.length} characters</span>

                <div className="analyzer-buttons">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleClear}
                    disabled={!email && !analyzed}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleAnalyze}
                    disabled={!email.trim() || analyzing}
                  >
                    {analyzing ? (
                      <>
                        <span className="spinner" /> Analyzing...
                      </>
                    ) : (
                      "Analyze Email →"
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Result */}
            <section className={`result-card ${analyzed ? "revealed" : ""}`}>
              <div className="card-title">
                <h2>Analysis Result</h2>
                <span
                  className={`risk ${
                    analyzing ? "pending pulse" : analyzed ? "high" : "pending"
                  }`}
                >
                  {analyzing ? "ANALYZING" : analyzed ? "HIGH RISK" : "WAITING"}
                </span>
              </div>

              {analyzed ? (
                <div className="result-content">
                  <div className="score-ring">
                    <svg viewBox="0 0 120 120" className="score-svg">
                      <circle className="score-track" cx="60" cy="60" r="52" />
                      <circle
                        className="score-progress"
                        cx="60"
                        cy="60"
                        r="52"
                        style={{
                          strokeDasharray: RING_CIRCUMFERENCE,
                          strokeDashoffset:
                            RING_CIRCUMFERENCE * (1 - RISK_SCORE / 100),
                        }}
                      />
                    </svg>
                    <div className="score-label">
                      <strong>{RISK_SCORE}</strong>
                      <span>/100</span>
                    </div>
                  </div>

                  <div className="result-details">
                    <h3>Phishing / Credential Theft</h3>
                    <p>Confidence: 94.2% — investigation recommended.</p>

                    <div className="indicator-chips">
                      <span className="chip high">Suspicious sender</span>
                      <span className="chip high">Domain mismatch</span>
                      <span className="chip medium">Urgent language detected</span>
                      <span className="chip high">Credential harvesting link</span>
                      <span className="chip medium">Suspicious URL</span>
                    </div>

                    <div className="recommended-action">
                      <strong>Recommended Action</strong>
                      <p>
                        Do not click links or provide credentials. Report this
                        email to your security administrator.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="empty-result">
                  Submit an email above to generate the threat analysis.
                </p>
              )}
            </section>

            {/* Recent Analyses Table */}
            <section className="table-card">
              <div className="card-title">
                <h2>Recent Email Analyses</h2>
                <span>{RECENT_ANALYSES.length} RECORDS</span>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Email / Subject</th>
                      <th>Sender</th>
                      <th>Threat Type</th>
                      <th>Risk Score</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_ANALYSES.map((row) => (
                      <tr key={row.subject}>
                        <td className="subject-cell">{row.subject}</td>
                        <td className="sender-cell">{row.sender}</td>
                        <td>{row.type}</td>
                        <td>
                          <span
                            className={`score-pill ${
                              row.score >= 70
                                ? "high"
                                : row.score >= 30
                                ? "medium"
                                : "low"
                            }`}
                          >
                            {row.score}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="date-cell">{row.date}</td>
                        <td>
                          <button className="view-btn">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="content-side">
            {/* Security Checks */}
            <section className="checks-card">
              <div className="card-title">
                <h2>Security Checks</h2>
                <span>4 CHECKS</span>
              </div>

              <div className="check">
                <span className="check-icon ok">✓</span>
                <div>
                  <strong>SPF Verification</strong>
                  <small>Authentication check</small>
                </div>
              </div>

              <div className="check">
                <span className="check-icon ok">✓</span>
                <div>
                  <strong>DKIM Verification</strong>
                  <small>Signature validation</small>
                </div>
              </div>

              <div className="check">
                <span className="check-icon warn">!</span>
                <div>
                  <strong>Domain Reputation</strong>
                  <small>Suspicious indicators</small>
                </div>
              </div>

              <div className="check">
                <span className="check-icon ok">✓</span>
                <div>
                  <strong>URL Analysis</strong>
                  <small>Link inspection</small>
                </div>
              </div>
            </section>

            {/* Weekly Activity */}
            <section className="activity-card">
              <div className="card-title">
                <h2>Threat Activity</h2>
                <span>LAST 7 DAYS</span>
              </div>

              <ActivityChart data={WEEK_ACTIVITY} />

              <div className="chart-legend">
                <span><i className="dot safe" />Safe</span>
                <span><i className="dot suspicious" />Suspicious</span>
                <span><i className="dot high" />High Risk</span>
              </div>
            </section>

            {/* Threat Distribution */}
            <section className="distribution-card">
              <div className="card-title">
                <h2>Threat Distribution</h2>
              </div>

              {THREAT_DISTRIBUTION.map((item, i) => (
                <DistributionBar item={item} index={i} key={item.label} />
              ))}
            </section>

            {/* Security Status */}
            <section className="status-card">
              <div className="card-title">
                <h2>Security Status</h2>
                <span className="status-pill">Operational</span>
              </div>

              {SERVICES.map((s) => (
                <div className="service-row" key={s.name}>
                  <span className="status-dot small" />
                  {s.name}
                  <span className="service-status">{s.status}</span>
                </div>
              ))}
            </section>
          </div>
        </div>
    </>
  );
}

export default Dashboard;
