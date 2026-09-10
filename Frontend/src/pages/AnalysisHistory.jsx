import { useState, useMemo } from "react";
import "./AnalysisHistory.css";

// 10+ Detailed Realistic Mock Forensic Records
const MOCK_ANALYSES = [
  {
    id: "MS-2026-001284",
    sender: "security-alert@paypa1.com",
    senderDomain: "paypa1.com",
    replyTo: "noreply@paypa1-support.com",
    sourceIp: "185.220.101.5",
    country: "Germany",
    subject: "Account verification required",
    detectionType: "Phishing",
    riskScore: 94,
    status: "Critical",
    dateTime: "10 Sep 2026, 14:32",
    dateCategory: "Today",
    securityChecks: {
      spf: "FAIL",
      dkim: "FAIL",
      dmarc: "FAIL",
      domainReputation: "MALICIOUS",
      urlReputation: "MALICIOUS",
      attachmentScan: "CLEAN",
      socialEngineering: "HIGH RISK",
    },
    threatIndicators: [
      "Lookalike domain detected (paypa1.com vs paypal.com)",
      "Urgent account suspension threat language",
      "Credential harvesting link detected in email body",
      "Failed DMARC & DKIM cryptographic authentication",
      "Originated from known Tor Exit Relay IP",
    ],
  },
  {
    id: "MS-2026-001283",
    sender: "hr@company-example.com",
    senderDomain: "company-example.com",
    replyTo: "hr-recruit@enerzcloud-portal.com",
    sourceIp: "93.114.69.213",
    country: "Poland",
    subject: "Updated employee benefits",
    detectionType: "Social Engineering",
    riskScore: 72,
    status: "Suspicious",
    dateTime: "10 Sep 2026, 13:18",
    dateCategory: "Today",
    securityChecks: {
      spf: "PASS",
      dkim: "PASS",
      dmarc: "PASS",
      domainReputation: "SUSPICIOUS",
      urlReputation: "SUSPICIOUS",
      attachmentScan: "CLEAN",
      socialEngineering: "HIGH RISK",
    },
    threatIndicators: [
      "Authority impersonation (claims to be HR department)",
      "Requests clicking a tracking link to confirm identity",
      "Asks recipient to submit screenshots of onboarding documents",
      "Mismatched Reply-To header field",
    ],
  },
  {
    id: "MS-2026-001282",
    sender: "newsletter@github.com",
    senderDomain: "github.com",
    replyTo: "noreply@github.com",
    sourceIp: "192.30.252.0",
    country: "United States",
    subject: "Weekly developer updates",
    detectionType: "Safe",
    riskScore: 8,
    status: "Safe",
    dateTime: "10 Sep 2026, 11:45",
    dateCategory: "Today",
    securityChecks: {
      spf: "PASS",
      dkim: "PASS",
      dmarc: "PASS",
      domainReputation: "CLEAN",
      urlReputation: "CLEAN",
      attachmentScan: "CLEAN",
      socialEngineering: "LOW RISK",
    },
    threatIndicators: ["No malicious indicators found"],
  },
  {
    id: "MS-2026-001281",
    sender: "billing@micros0ft-support.com",
    senderDomain: "micros0ft-support.com",
    replyTo: "billing@micros0ft-support.com",
    sourceIp: "104.28.18.23",
    country: "United States",
    subject: "Invoice overdue - Immediate Action",
    detectionType: "Credential Theft",
    riskScore: 91,
    status: "Critical",
    dateTime: "09 Sep 2026, 18:21",
    dateCategory: "Last 7 Days",
    securityChecks: {
      spf: "FAIL",
      dkim: "FAIL",
      dmarc: "FAIL",
      domainReputation: "MALICIOUS",
      urlReputation: "MALICIOUS",
      attachmentScan: "CLEAN",
      socialEngineering: "HIGH RISK",
    },
    threatIndicators: [
      "Typosquatting domain (micros0ft instead of microsoft)",
      "Fake overdue invoice lure targeting login credentials",
      "Direct link to external password harvesting portal",
      "Failed SPF authentication check",
    ],
  },
  {
    id: "MS-2026-001280",
    sender: "admin@university.edu",
    senderDomain: "university.edu",
    replyTo: "admin@university.edu",
    sourceIp: "128.197.26.3",
    country: "United States",
    subject: "Semester notification & guidelines",
    detectionType: "Safe",
    riskScore: 5,
    status: "Safe",
    dateTime: "09 Sep 2026, 16:03",
    dateCategory: "Last 7 Days",
    securityChecks: {
      spf: "PASS",
      dkim: "PASS",
      dmarc: "PASS",
      domainReputation: "CLEAN",
      urlReputation: "CLEAN",
      attachmentScan: "CLEAN",
      socialEngineering: "LOW RISK",
    },
    threatIndicators: ["Legitimate academic communication"],
  },
  {
    id: "MS-2026-001279",
    sender: "ceo-desk@corp-exec-mail.com",
    senderDomain: "corp-exec-mail.com",
    replyTo: "ceo-private@gmail.com",
    sourceIp: "198.51.100.44",
    country: "Canada",
    subject: "Urgent Wire Transfer Request - Confidential",
    detectionType: "Business Email Compromise",
    riskScore: 88,
    status: "High Risk",
    dateTime: "09 Sep 2026, 12:10",
    dateCategory: "Last 7 Days",
    securityChecks: {
      spf: "PASS",
      dkim: "FAIL",
      dmarc: "FAIL",
      domainReputation: "SUSPICIOUS",
      urlReputation: "CLEAN",
      attachmentScan: "CLEAN",
      socialEngineering: "HIGH RISK",
    },
    threatIndicators: [
      "Executive Impersonation (CEO wire transfer request)",
      "Secrecy and isolation instructions ('Do not speak to finance team')",
      "Urgent financial payload request",
      "Mismatched Reply-To pointing to free webmail address",
    ],
  },
  {
    id: "MS-2026-001278",
    sender: "update@dropbox-verify-file.net",
    senderDomain: "dropbox-verify-file.net",
    replyTo: "update@dropbox-verify-file.net",
    sourceIp: "45.142.214.88",
    country: "Russia",
    subject: "Shared document notification",
    detectionType: "Phishing",
    riskScore: 95,
    status: "Critical",
    dateTime: "08 Sep 2026, 19:40",
    dateCategory: "Last 7 Days",
    securityChecks: {
      spf: "FAIL",
      dkim: "FAIL",
      dmarc: "FAIL",
      domainReputation: "MALICIOUS",
      urlReputation: "MALICIOUS",
      attachmentScan: "SUSPICIOUS",
      socialEngineering: "HIGH RISK",
    },
    threatIndicators: [
      "Brand spoofing of cloud storage provider",
      "Embedded URL points to suspicious login form",
      "Domain registered less than 48 hours ago",
      "Failed SPF and DMARC alignment",
    ],
  },
  {
    id: "MS-2026-001277",
    sender: "support@cloud-server-node.org",
    senderDomain: "cloud-server-node.org",
    replyTo: "support@cloud-server-node.org",
    sourceIp: "185.191.171.12",
    country: "Netherlands",
    subject: "Security Patch Update - Attachment Enclosed",
    detectionType: "Malware",
    riskScore: 98,
    status: "Critical",
    dateTime: "08 Sep 2026, 15:22",
    dateCategory: "Last 7 Days",
    securityChecks: {
      spf: "FAIL",
      dkim: "FAIL",
      dmarc: "FAIL",
      domainReputation: "MALICIOUS",
      urlReputation: "MALICIOUS",
      attachmentScan: "INFECTED",
      socialEngineering: "HIGH RISK",
    },
    threatIndicators: [
      "Malicious executable attachment (.js disguised as .pdf)",
      "Signature matched Trojan downloader malware",
      "High threat IP reputation score",
    ],
  },
  {
    id: "MS-2026-001276",
    sender: "payroll@corp-finance-dept.com",
    senderDomain: "corp-finance-dept.com",
    replyTo: "payroll@corp-finance-dept.com",
    sourceIp: "103.21.244.0",
    country: "Singapore",
    subject: "Direct deposit change request confirmation",
    detectionType: "Spoofing",
    riskScore: 68,
    status: "Suspicious",
    dateTime: "07 Sep 2026, 10:15",
    dateCategory: "Last 7 Days",
    securityChecks: {
      spf: "PASS",
      dkim: "FAIL",
      dmarc: "FAIL",
      domainReputation: "SUSPICIOUS",
      urlReputation: "CLEAN",
      attachmentScan: "CLEAN",
      socialEngineering: "HIGH RISK",
    },
    threatIndicators: [
      "Unverified payroll update request",
      "Failed DKIM cryptographic signature check",
      "Potential domain spoofing attempt",
    ],
  },
  {
    id: "MS-2026-001275",
    sender: "events@e-yantra-robotics.org",
    senderDomain: "e-yantra-robotics.org",
    replyTo: "events@e-yantra-robotics.org",
    sourceIp: "13.235.45.10",
    country: "India",
    subject: "Registration confirmation & schedule",
    detectionType: "Safe",
    riskScore: 12,
    status: "Safe",
    dateTime: "06 Sep 2026, 09:30",
    dateCategory: "Last 30 Days",
    securityChecks: {
      spf: "PASS",
      dkim: "PASS",
      dmarc: "PASS",
      domainReputation: "CLEAN",
      urlReputation: "CLEAN",
      attachmentScan: "CLEAN",
      socialEngineering: "LOW RISK",
    },
    threatIndicators: ["Verified event registration confirmation"],
  },
];

export default function AnalysisHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [detectionFilter, setDetectionFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Compute filtered dataset
  const filteredRecords = useMemo(() => {
    return MOCK_ANALYSES.filter((item) => {
      // Search term matching ID, Sender, Subject, Source IP
      const search = searchTerm.toLowerCase().trim();
      if (search) {
        const matchesId = item.id.toLowerCase().includes(search);
        const matchesSender = item.sender.toLowerCase().includes(search);
        const matchesSubject = item.subject.toLowerCase().includes(search);
        const matchesIp = item.sourceIp.toLowerCase().includes(search);

        if (!matchesId && !matchesSender && !matchesSubject && !matchesIp) {
          return false;
        }
      }

      // Risk level filter
      if (riskFilter !== "All") {
        if (riskFilter === "Safe" && item.status !== "Safe") return false;
        if (riskFilter === "Suspicious" && item.status !== "Suspicious") return false;
        if (riskFilter === "High Risk" && item.status !== "High Risk") return false;
        if (riskFilter === "Critical" && item.status !== "Critical") return false;
      }

      // Detection type filter
      if (detectionFilter !== "All" && item.detectionType !== detectionFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== "All Time") {
        if (dateFilter === "Today" && item.dateCategory !== "Today") return false;
        if (
          dateFilter === "Last 7 Days" &&
          item.dateCategory !== "Today" &&
          item.dateCategory !== "Last 7 Days"
        )
          return false;
        if (
          dateFilter === "Last 30 Days" &&
          !["Today", "Last 7 Days", "Last 30 Days"].includes(item.dateCategory)
        )
          return false;
      }

      return true;
    });
  }, [searchTerm, riskFilter, detectionFilter, dateFilter]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setRiskFilter("All");
    setDetectionFilter("All");
    setDateFilter("All Time");
  };

  // Helper for progress bar color
  const getRiskScoreColor = (score) => {
    if (score >= 80) return "var(--danger, #ff6b6b)";
    if (score >= 60) return "#ff8b3d";
    if (score >= 30) return "var(--warning, #ffc857)";
    return "var(--safe, #3ee08f)";
  };

  // Helper for status badge class
  const getBadgeClass = (status) => {
    switch (status) {
      case "Critical":
        return "analysis-history-badge-critical";
      case "High Risk":
        return "analysis-history-badge-high";
      case "Suspicious":
        return "analysis-history-badge-suspicious";
      case "Safe":
      default:
        return "analysis-history-badge-safe";
    }
  };

  return (
    <div className="analysis-history-container">
      {/* Top SOC Statistics Cards */}
      <div className="analysis-history-stats-grid">
        {/* Total Analyses */}
        <div className="analysis-history-stat-card">
          <div className="analysis-history-stat-header">
            <span className="analysis-history-stat-label">TOTAL ANALYSES</span>
            <span className="analysis-history-stat-icon">📊</span>
          </div>
          <div className="analysis-history-stat-value">1,284</div>
          <div className="analysis-history-stat-sub text-cyan">+12.4% this month</div>
        </div>

        {/* Threats Detected */}
        <div className="analysis-history-stat-card">
          <div className="analysis-history-stat-header">
            <span className="analysis-history-stat-label">THREATS DETECTED</span>
            <span className="analysis-history-stat-icon">⚠️</span>
          </div>
          <div className="analysis-history-stat-value text-orange">347</div>
          <div className="analysis-history-stat-sub text-orange">27.0% detection rate</div>
        </div>

        {/* High Risk */}
        <div className="analysis-history-stat-card">
          <div className="analysis-history-stat-header">
            <span className="analysis-history-stat-label">HIGH RISK</span>
            <span className="analysis-history-stat-icon">🚨</span>
          </div>
          <div className="analysis-history-stat-value text-danger">86</div>
          <div className="analysis-history-stat-sub text-danger">Requires attention</div>
        </div>

        {/* Safe Analyses */}
        <div className="analysis-history-stat-card">
          <div className="analysis-history-stat-header">
            <span className="analysis-history-stat-label">SAFE ANALYSES</span>
            <span className="analysis-history-stat-icon">🛡️</span>
          </div>
          <div className="analysis-history-stat-value text-safe">937</div>
          <div className="analysis-history-stat-sub text-safe">73.0% of scans</div>
        </div>
      </div>

      {/* Filter / Search Toolbar */}
      <div className="analysis-history-toolbar-card">
        <div className="analysis-history-toolbar-top">
          {/* Search Input */}
          <div className="analysis-history-search-wrap">
            <span className="analysis-history-search-icon">⌕</span>
            <input
              type="text"
              className="analysis-history-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by sender, subject, IP, or analysis ID..."
            />
          </div>

          {/* Reset Filters Button */}
          <button
            className="analysis-history-reset-btn"
            onClick={handleResetFilters}
            title="Clear all active filters"
          >
            Reset Filters
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="analysis-history-filters-group">
          {/* Risk Level */}
          <div className="analysis-history-filter-item">
            <label className="analysis-history-filter-label">RISK LEVEL</label>
            <select
              className="analysis-history-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="All">All Risks</option>
              <option value="Safe">Safe</option>
              <option value="Suspicious">Suspicious</option>
              <option value="High Risk">High Risk</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Detection Type */}
          <div className="analysis-history-filter-item">
            <label className="analysis-history-filter-label">DETECTION TYPE</label>
            <select
              className="analysis-history-select"
              value={detectionFilter}
              onChange={(e) => setDetectionFilter(e.target.value)}
            >
              <option value="All">All Detections</option>
              <option value="Phishing">Phishing</option>
              <option value="Malware">Malware</option>
              <option value="Spoofing">Spoofing</option>
              <option value="Business Email Compromise">Business Email Compromise</option>
              <option value="Credential Theft">Credential Theft</option>
              <option value="Social Engineering">Social Engineering</option>
              <option value="Safe">Safe</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="analysis-history-filter-item">
            <label className="analysis-history-filter-label">DATE RANGE</label>
            <select
              className="analysis-history-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis Records Table Card */}
      <div className="analysis-history-table-card">
        <div className="analysis-history-table-header">
          <div>
            <h2>Analysis Records</h2>
            <p className="analysis-history-table-subtitle">
              Historical email investigations and threat detections ({filteredRecords.length} records)
            </p>
          </div>
        </div>

        {/* Table Container */}
        <div className="analysis-history-table-wrap">
          <table className="analysis-history-table">
            <thead>
              <tr>
                <th>Analysis ID</th>
                <th>Sender</th>
                <th>Subject</th>
                <th>Detection</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Date & Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="analysis-history-empty">
                    No forensic records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const scoreColor = getRiskScoreColor(item.riskScore);
                  return (
                    <tr key={item.id} className="analysis-history-row">
                      <td className="analysis-history-id-cell">{item.id}</td>
                      <td className="analysis-history-sender-cell" title={item.sender}>
                        {item.sender}
                      </td>
                      <td className="analysis-history-subject-cell" title={item.subject}>
                        {item.subject}
                      </td>
                      <td>
                        <span className="analysis-history-tech-pill">
                          {item.detectionType}
                        </span>
                      </td>
                      <td>
                        <div className="analysis-history-score-wrap">
                          <span className="analysis-history-score-num" style={{ color: scoreColor }}>
                            {item.riskScore}/100
                          </span>
                          <div className="analysis-history-score-bg">
                            <div
                              className="analysis-history-score-bar"
                              style={{
                                width: `${item.riskScore}%`,
                                backgroundColor: scoreColor,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`analysis-history-badge ${getBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="analysis-history-date-cell">{item.dateTime}</td>
                      <td>
                        <button
                          className="analysis-history-view-btn"
                          onClick={() => setSelectedRecord(item)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Investigation Modal */}
      {selectedRecord && (
        <div className="analysis-history-modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div
            className="analysis-history-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="analysis-history-modal-header">
              <div>
                <span className="analysis-history-modal-eyebrow">FORENSIC TELEMETRY FILE</span>
                <h3>{selectedRecord.id}</h3>
              </div>
              <button
                className="analysis-history-modal-close"
                onClick={() => setSelectedRecord(null)}
              >
                ✕
              </button>
            </div>

            {/* Modal Overview Bar */}
            <div className="analysis-history-modal-overview">
              <div className="analysis-history-overview-item">
                <span className="analysis-history-meta-label">FINAL VERDICT</span>
                <span className={`analysis-history-badge ${getBadgeClass(selectedRecord.status)}`}>
                  {selectedRecord.status.toUpperCase()}
                </span>
              </div>
              <div className="analysis-history-overview-item">
                <span className="analysis-history-meta-label">RISK SCORE</span>
                <strong style={{ color: getRiskScoreColor(selectedRecord.riskScore), fontSize: "18px" }}>
                  {selectedRecord.riskScore} / 100
                </strong>
              </div>
              <div className="analysis-history-overview-item">
                <span className="analysis-history-meta-label">DETECTION TYPE</span>
                <strong className="text-cyan">{selectedRecord.detectionType}</strong>
              </div>
              <div className="analysis-history-overview-item">
                <span className="analysis-history-meta-label">TIMESTAMP</span>
                <span className="text-dim">{selectedRecord.dateTime}</span>
              </div>
            </div>

            {/* Modal Body Grid */}
            <div className="analysis-history-modal-grid">
              {/* Left Column: Email Metadata */}
              <div className="analysis-history-modal-section">
                <h4 className="analysis-history-sec-title">HEADER FORENSICS</h4>
                <div className="analysis-history-detail-row">
                  <span>Sender:</span>
                  <strong className="text-monospace">{selectedRecord.sender}</strong>
                </div>
                <div className="analysis-history-detail-row">
                  <span>Sender Domain:</span>
                  <strong className="text-monospace">{selectedRecord.senderDomain}</strong>
                </div>
                <div className="analysis-history-detail-row">
                  <span>Reply-To:</span>
                  <strong className="text-monospace">{selectedRecord.replyTo}</strong>
                </div>
                <div className="analysis-history-detail-row">
                  <span>Source IP:</span>
                  <strong className="text-cyan text-monospace">{selectedRecord.sourceIp}</strong>
                </div>
                <div className="analysis-history-detail-row">
                  <span>Origin Country:</span>
                  <strong>{selectedRecord.country}</strong>
                </div>
              </div>

              {/* Right Column: Security Checks */}
              <div className="analysis-history-modal-section">
                <h4 className="analysis-history-sec-title">SECURITY CHECKS</h4>
                <div className="analysis-history-checks-grid">
                  <div className="analysis-history-check-item">
                    <span>SPF Record:</span>
                    <strong className={selectedRecord.securityChecks.spf === "PASS" ? "text-safe" : "text-danger"}>
                      {selectedRecord.securityChecks.spf}
                    </strong>
                  </div>
                  <div className="analysis-history-check-item">
                    <span>DKIM Signature:</span>
                    <strong className={selectedRecord.securityChecks.dkim === "PASS" ? "text-safe" : "text-danger"}>
                      {selectedRecord.securityChecks.dkim}
                    </strong>
                  </div>
                  <div className="analysis-history-check-item">
                    <span>DMARC Policy:</span>
                    <strong className={selectedRecord.securityChecks.dmarc === "PASS" ? "text-safe" : "text-danger"}>
                      {selectedRecord.securityChecks.dmarc}
                    </strong>
                  </div>
                  <div className="analysis-history-check-item">
                    <span>Domain Reputation:</span>
                    <strong className={selectedRecord.securityChecks.domainReputation === "CLEAN" ? "text-safe" : "text-danger"}>
                      {selectedRecord.securityChecks.domainReputation}
                    </strong>
                  </div>
                  <div className="analysis-history-check-item">
                    <span>URL Reputation:</span>
                    <strong className={selectedRecord.securityChecks.urlReputation === "CLEAN" ? "text-safe" : "text-danger"}>
                      {selectedRecord.securityChecks.urlReputation}
                    </strong>
                  </div>
                  <div className="analysis-history-check-item">
                    <span>Attachment Scan:</span>
                    <strong className={selectedRecord.securityChecks.attachmentScan === "CLEAN" ? "text-safe" : "text-danger"}>
                      {selectedRecord.securityChecks.attachmentScan}
                    </strong>
                  </div>
                  <div className="analysis-history-check-item">
                    <span>Social Engineering:</span>
                    <strong className={selectedRecord.securityChecks.socialEngineering === "LOW RISK" ? "text-safe" : "text-danger"}>
                      {selectedRecord.securityChecks.socialEngineering}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Threat Indicators Section */}
            <div className="analysis-history-indicators-block">
              <h4 className="analysis-history-sec-title">THREAT INDICATORS</h4>
              <div className="analysis-history-indicators-list">
                {selectedRecord.threatIndicators.map((indicator, idx) => (
                  <div key={idx} className="analysis-history-indicator-row">
                    <span className="analysis-history-ind-bullet">•</span>
                    <span>{indicator}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="analysis-history-modal-footer">
              <button
                className="analysis-history-modal-close-btn"
                onClick={() => setSelectedRecord(null)}
              >
                Close Forensic File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
