import { useState, useMemo } from "react";
import "./Reports.css";

// 8+ Recent Reports Initial Mock Dataset
const INITIAL_REPORTS = [
  {
    id: "MS-RPT-2026-0042",
    type: "Executive Security Summary",
    period: "01 Sep 2026 – 10 Sep 2026",
    generatedBy: "Security Analyst",
    created: "10 Sep 2026, 16:02",
    format: "PDF",
    status: "Generated",
    summary:
      "MailShield AI analyzed 1,284 email events during the selected reporting period. 347 threats were identified, including 86 critical-risk incidents. Phishing and credential-theft campaigns represented the largest categories of detected threats.",
  },
  {
    id: "MS-RPT-2026-0041",
    type: "Phishing Investigation",
    period: "01 Sep 2026 – 09 Sep 2026",
    generatedBy: "Security Analyst",
    created: "09 Sep 2026, 14:15",
    format: "PDF",
    status: "Generated",
    summary:
      "Targeted investigation into 146 phishing lures targeting banking credentials and corporate SSO portals. 93% of identified phishing domains were mitigated.",
  },
  {
    id: "MS-RPT-2026-0040",
    type: "Threat Intelligence Report",
    period: "01 Sep 2026 – 07 Sep 2026",
    generatedBy: "Security Analyst",
    created: "08 Sep 2026, 11:30",
    format: "CSV",
    status: "Generated",
    summary:
      "Telemetry sync report detailing 1,734 tracked malicious IOCs across connected feeds including ThreatFox, AbuseIPDB, and MalwareBazaar.",
  },
  {
    id: "MS-RPT-2026-0039",
    type: "Incident Response Report",
    period: "25 Aug 2026 – 05 Sep 2026",
    generatedBy: "Security Analyst",
    created: "06 Sep 2026, 18:45",
    format: "PDF",
    status: "Generated",
    summary:
      "Forensic post-incident summary of 86 critical incidents. All high-confidence malicious IPs and domains were added to active blocklists.",
  },
  {
    id: "MS-RPT-2026-0038",
    type: "Compliance Report",
    period: "01 Aug 2026 – 31 Aug 2026",
    generatedBy: "SOC Lead",
    created: "01 Sep 2026, 09:00",
    format: "PDF",
    status: "Generated",
    summary:
      "Monthly SOC compliance audit showing 94% email security coverage and 91% audit readiness across enterprise mail gateways.",
  },
  {
    id: "MS-RPT-2026-0037",
    type: "Email Threat Analysis",
    period: "15 Aug 2026 – 30 Aug 2026",
    generatedBy: "Security Analyst",
    created: "31 Aug 2026, 17:10",
    format: "CSV",
    status: "Generated",
    summary:
      "Detailed inspection logs covering 2,100 payload scans. Identified 56 social engineering vectors and 41 Trojan downloader binaries.",
  },
  {
    id: "MS-RPT-2026-0036",
    type: "Executive Security Summary",
    period: "01 Aug 2026 – 15 Aug 2026",
    generatedBy: "Security Analyst",
    created: "16 Aug 2026, 12:20",
    format: "PDF",
    status: "Generated",
    summary:
      "Mid-month threat summary showing a 15% reduction in successful BEC impersonation lures following updated DMARC policies.",
  },
  {
    id: "MS-RPT-2026-0035",
    type: "Phishing Investigation",
    period: "01 Aug 2026 – 10 Aug 2026",
    generatedBy: "Security Analyst",
    created: "11 Aug 2026, 10:05",
    format: "PDF",
    status: "Generated",
    summary:
      "Investigation report on typosquatting domain campaigns targeting financial institution verification forms.",
  },
];

// Top Threat Activity Table Data
const TOP_THREAT_ACTIVITY = [
  { threat: "Phishing", occurrences: 146, risk: "Critical", trend: "+18%", lastDetected: "10 Sep 2026" },
  { threat: "Credential Theft", occurrences: 73, risk: "High", trend: "+11%", lastDetected: "10 Sep 2026" },
  { threat: "Social Engineering", occurrences: 56, risk: "High", trend: "+7%", lastDetected: "09 Sep 2026" },
  { threat: "Malware", occurrences: 41, risk: "Critical", trend: "+5%", lastDetected: "09 Sep 2026" },
  { threat: "Spoofing", occurrences: 31, risk: "Medium", trend: "-3%", lastDetected: "08 Sep 2026" },
];

// Critical Incidents Data
const CRITICAL_INCIDENTS = [
  { id: "INC-2026-0086", description: "Credential harvesting campaign", severity: "Critical", date: "10 Sep 2026", status: "Investigated" },
  { id: "INC-2026-0085", description: "Lookalike banking domain", severity: "Critical", date: "10 Sep 2026", status: "Contained" },
  { id: "INC-2026-0084", description: "Malicious attachment detected", severity: "Critical", date: "09 Sep 2026", status: "Quarantined" },
  { id: "INC-2026-0083", description: "Executive spoofing wire request", severity: "High", date: "09 Sep 2026", status: "Investigated" },
  { id: "INC-2026-0082", description: "C2 server IP beaconing", severity: "Critical", date: "08 Sep 2026", status: "Blocked" },
];

export default function Reports() {
  // Form State
  const [reportType, setReportType] = useState("Executive Security Summary");
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [startDate, setStartDate] = useState("2026-08-11");
  const [endDate, setEndDate] = useState("2026-09-10");
  const [severities, setSeverities] = useState({
    Critical: true,
    High: true,
    Medium: true,
    Low: true,
  });
  const [dataSources, setDataSources] = useState({
    "Email Analysis": true,
    "Social Engineering": true,
    "IP Intelligence": true,
    "Threat Intelligence": true,
    "Analysis History": true,
  });
  const [format, setFormat] = useState("PDF");

  // Interaction State
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportCounter, setReportCounter] = useState(43);
  const [toastMessage, setToastMessage] = useState(null);
  const [recentReports, setRecentReports] = useState(INITIAL_REPORTS);
  const [activePreviewReport, setActivePreviewReport] = useState(INITIAL_REPORTS[0]);
  const [selectedModalReport, setSelectedModalReport] = useState(null);

  // Table Filter State
  const [tableSearch, setTableSearch] = useState("");
  const [tableTypeFilter, setTableTypeFilter] = useState("All");
  const [tableFormatFilter, setTableFormatFilter] = useState("All");
  const [tableStatusFilter, setTableStatusFilter] = useState("All");

  // Trigger Toast Helper
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Toggle Checkbox Helpers
  const handleSeverityChange = (key) => {
    setSeverities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDataSourceChange = (key) => {
    setDataSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Reset Form
  const handleResetForm = () => {
    setReportType("Executive Security Summary");
    setTimeRange("Last 30 Days");
    setStartDate("2026-08-11");
    setEndDate("2026-09-10");
    setSeverities({ Critical: true, High: true, Medium: true, Low: true });
    setDataSources({
      "Email Analysis": true,
      "Social Engineering": true,
      "IP Intelligence": true,
      "Threat Intelligence": true,
      "Analysis History": true,
    });
    setFormat("PDF");
  };

  // Generate Report Simulation
  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newId = `MS-RPT-2026-${String(reportCounter).padStart(4, "0")}`;
      setReportCounter((prev) => prev + 1);

      const periodText =
        timeRange === "Custom Range"
          ? `${startDate} – ${endDate}`
          : timeRange === "Today"
          ? "10 Sep 2026"
          : timeRange === "Last 7 Days"
          ? "03 Sep 2026 – 10 Sep 2026"
          : timeRange === "Last 90 Days"
          ? "10 Jun 2026 – 10 Sep 2026"
          : "11 Aug 2026 – 10 Sep 2026";

      const newReport = {
        id: newId,
        type: reportType,
        period: periodText,
        generatedBy: "Security Analyst",
        created: "10 Sep 2026, 16:05",
        format: format,
        status: "Generated",
        summary: `Automated ${reportType} compiled from ${Object.keys(dataSources)
          .filter((k) => dataSources[k])
          .join(", ")}. Analyzed 1,284 email security events with 347 total threats detected.`,
      };

      setRecentReports((prev) => [newReport, ...prev]);
      setActivePreviewReport(newReport);
      setIsGenerating(false);
      showToast("Report generated successfully");
    }, 800);
  };

  // Export Simulation
  const handleExportPdf = () => {
    showToast("PDF export prepared successfully.");
  };

  const handleExportCsv = () => {
    showToast("CSV export prepared successfully.");
  };

  // Filtered Recent Reports
  const filteredReports = useMemo(() => {
    return recentReports.filter((rpt) => {
      const search = tableSearch.toLowerCase().trim();
      if (
        search &&
        !rpt.id.toLowerCase().includes(search) &&
        !rpt.type.toLowerCase().includes(search) &&
        !rpt.period.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (tableTypeFilter !== "All" && rpt.type !== tableTypeFilter) {
        return false;
      }
      if (tableFormatFilter !== "All" && rpt.format !== tableFormatFilter) {
        return false;
      }
      if (tableStatusFilter !== "All" && rpt.status !== tableStatusFilter) {
        return false;
      }
      return true;
    });
  }, [recentReports, tableSearch, tableTypeFilter, tableFormatFilter, tableStatusFilter]);

  // Reset Table Filters
  const handleResetTableFilters = () => {
    setTableSearch("");
    setTableTypeFilter("All");
    setTableFormatFilter("All");
    setTableStatusFilter("All");
  };

  return (
    <div className="reports-container">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="reports-toast-banner">
          <span className="reports-toast-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SECTION 1 — REPORT OVERVIEW STATS CARDS */}
      <div className="reports-stats-grid">
        {/* Security Analyses */}
        <div className="reports-stat-card">
          <div className="reports-stat-header">
            <span className="reports-stat-label">SECURITY ANALYSES</span>
            <span className="reports-stat-icon">📊</span>
          </div>
          <div className="reports-stat-val text-cyan">1,284</div>
          <div className="reports-stat-sub text-cyan">+12.4% this month</div>
        </div>

        {/* Threats Detected */}
        <div className="reports-stat-card">
          <div className="reports-stat-header">
            <span className="reports-stat-label">THREATS DETECTED</span>
            <span className="reports-stat-icon">⚠️</span>
          </div>
          <div className="reports-stat-val text-orange">347</div>
          <div className="reports-stat-sub text-orange">27.0% detection rate</div>
        </div>

        {/* Critical Incidents */}
        <div className="reports-stat-card">
          <div className="reports-stat-header">
            <span className="reports-stat-label">CRITICAL INCIDENTS</span>
            <span className="reports-stat-icon">🚨</span>
          </div>
          <div className="reports-stat-val text-danger">86</div>
          <div className="reports-stat-sub text-danger">Requires attention</div>
        </div>

        {/* Reports Generated */}
        <div className="reports-stat-card">
          <div className="reports-stat-header">
            <span className="reports-stat-label">REPORTS GENERATED</span>
            <span className="reports-stat-icon">📁</span>
          </div>
          <div className="reports-stat-val text-safe">{recentReports.length}</div>
          <div className="reports-stat-sub text-safe">This month</div>
        </div>
      </div>

      {/* SECTION 2 — REPORT GENERATOR */}
      <div className="reports-card reports-generator-card">
        <div className="reports-card-header">
          <div>
            <h2>Generate Security Report</h2>
            <p className="reports-card-sub">
              Create a detailed security report from MailShield AI threat and email analysis telemetry.
            </p>
          </div>
        </div>

        <div className="reports-form-grid">
          {/* Row 1: Report Type & Time Range */}
          <div className="reports-form-group">
            <label className="reports-form-label">REPORT TYPE</label>
            <select
              className="reports-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="Executive Security Summary">Executive Security Summary</option>
              <option value="Email Threat Analysis">Email Threat Analysis</option>
              <option value="Phishing Investigation">Phishing Investigation</option>
              <option value="Threat Intelligence Report">Threat Intelligence Report</option>
              <option value="Incident Response Report">Incident Response Report</option>
              <option value="Compliance Report">Compliance Report</option>
            </select>
          </div>

          <div className="reports-form-group">
            <label className="reports-form-label">TIME RANGE</label>
            <select
              className="reports-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range Picker */}
          {timeRange === "Custom Range" && (
            <div className="reports-form-group reports-full-width reports-date-row">
              <div>
                <label className="reports-form-label">START DATE</label>
                <input
                  type="date"
                  className="reports-input-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="reports-form-label">END DATE</label>
                <input
                  type="date"
                  className="reports-input-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Row 2: Severity Checkboxes */}
          <div className="reports-form-group reports-full-width">
            <label className="reports-form-label">SEVERITY FILTER</label>
            <div className="reports-checkbox-row">
              {Object.keys(severities).map((key) => (
                <label key={key} className="reports-checkbox-item">
                  <input
                    type="checkbox"
                    checked={severities[key]}
                    onChange={() => handleSeverityChange(key)}
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Row 3: Data Sources */}
          <div className="reports-form-group reports-full-width">
            <label className="reports-form-label">DATA SOURCES</label>
            <div className="reports-checkbox-row">
              {Object.keys(dataSources).map((key) => (
                <label key={key} className="reports-checkbox-item">
                  <input
                    type="checkbox"
                    checked={dataSources[key]}
                    onChange={() => handleDataSourceChange(key)}
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Row 4: Format Selection */}
          <div className="reports-form-group reports-full-width">
            <label className="reports-form-label">REPORT FORMAT</label>
            <div className="reports-radio-row">
              <label className="reports-radio-item">
                <input
                  type="radio"
                  name="reportFormat"
                  value="PDF"
                  checked={format === "PDF"}
                  onChange={() => setFormat("PDF")}
                />
                <span>PDF Document (.pdf)</span>
              </label>
              <label className="reports-radio-item">
                <input
                  type="radio"
                  name="reportFormat"
                  value="CSV"
                  checked={format === "CSV"}
                  onChange={() => setFormat("CSV")}
                />
                <span>CSV Telemetry Data (.csv)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="reports-form-actions">
          <button
            className="reports-btn-primary"
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="reports-spinner" /> Generating report...
              </>
            ) : (
              <>
                <span>GENERATE REPORT</span>
                <span className="reports-btn-arrow">→</span>
              </>
            )}
          </button>
          <button className="reports-btn-secondary" onClick={handleResetForm}>
            Reset Form
          </button>
        </div>
      </div>

      {/* SECTION 3 — REPORT PREVIEW */}
      <div className="reports-card reports-preview-card">
        <div className="reports-card-header">
          <div>
            <span className="reports-badge-pill">ACTIVE REPORT PREVIEW</span>
            <h2>Report Preview</h2>
          </div>
          <div className="reports-header-actions">
            <button className="reports-btn-action" onClick={handleExportPdf}>
              📄 Export PDF
            </button>
            <button className="reports-btn-action" onClick={handleExportCsv}>
              📊 Export CSV
            </button>
          </div>
        </div>

        {/* Report Meta Strip */}
        <div className="reports-meta-strip">
          <div className="reports-meta-col">
            <span>Report ID:</span>
            <strong className="text-cyan text-monospace">{activePreviewReport.id}</strong>
          </div>
          <div className="reports-meta-col">
            <span>Report Type:</span>
            <strong>{activePreviewReport.type}</strong>
          </div>
          <div className="reports-meta-col">
            <span>Generated:</span>
            <span className="text-dim">{activePreviewReport.created}</span>
          </div>
          <div className="reports-meta-col">
            <span>Reporting Period:</span>
            <span className="text-dim">{activePreviewReport.period}</span>
          </div>
          <div className="reports-meta-col">
            <span>Prepared By:</span>
            <strong>{activePreviewReport.generatedBy}</strong>
          </div>
          <div className="reports-meta-col">
            <span>Status:</span>
            <span className="reports-status-tag status-generated">
              {activePreviewReport.status}
            </span>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="reports-exec-summary-box">
          <h4>EXECUTIVE SUMMARY</h4>
          <p>{activePreviewReport.summary}</p>
        </div>

        {/* SECTION 4 — SECURITY METRICS GRID */}
        <div className="reports-section-block">
          <span className="reports-block-title">KEY SECURITY METRICS</span>
          <div className="reports-metrics-grid">
            <div className="reports-metric-box">
              <span>Total Emails Analyzed</span>
              <strong className="text-cyan">1,284</strong>
            </div>
            <div className="reports-metric-box">
              <span>Threats Detected</span>
              <strong className="text-orange">347</strong>
            </div>
            <div className="reports-metric-box">
              <span>Safe Emails</span>
              <strong className="text-safe">937</strong>
            </div>
            <div className="reports-metric-box">
              <span>Suspicious Emails</span>
              <strong className="text-warning">261</strong>
            </div>
            <div className="reports-metric-box">
              <span>High Risk</span>
              <strong className="text-orange">153</strong>
            </div>
            <div className="reports-metric-box">
              <span>Critical Incidents</span>
              <strong className="text-danger">86</strong>
            </div>
            <div className="reports-metric-box">
              <span>Detection Rate</span>
              <strong className="text-cyan">27.0%</strong>
            </div>
          </div>
        </div>

        {/* DUAL DISTRIBUTIONS GRID (SECTION 5 & SECTION 6) */}
        <div className="reports-distributions-grid">
          {/* SECTION 5 — THREAT DISTRIBUTION */}
          <div className="reports-dist-box">
            <h4>Threat Distribution</h4>
            <div className="reports-bars-list">
              <div className="reports-bar-item">
                <div className="reports-bar-label">
                  <span>Phishing</span>
                  <strong>42%</strong>
                </div>
                <div className="reports-bar-bg">
                  <div className="reports-bar-fill fill-phishing" style={{ width: "42%" }} />
                </div>
              </div>

              <div className="reports-bar-item">
                <div className="reports-bar-label">
                  <span>Credential Theft</span>
                  <strong>21%</strong>
                </div>
                <div className="reports-bar-bg">
                  <div className="reports-bar-fill fill-cred" style={{ width: "21%" }} />
                </div>
              </div>

              <div className="reports-bar-item">
                <div className="reports-bar-label">
                  <span>Social Engineering</span>
                  <strong>16%</strong>
                </div>
                <div className="reports-bar-bg">
                  <div className="reports-bar-fill fill-se" style={{ width: "16%" }} />
                </div>
              </div>

              <div className="reports-bar-item">
                <div className="reports-bar-label">
                  <span>Malware</span>
                  <strong>12%</strong>
                </div>
                <div className="reports-bar-bg">
                  <div className="reports-bar-fill fill-malware" style={{ width: "12%" }} />
                </div>
              </div>

              <div className="reports-bar-item">
                <div className="reports-bar-label">
                  <span>Spoofing</span>
                  <strong>6%</strong>
                </div>
                <div className="reports-bar-bg">
                  <div className="reports-bar-fill fill-spoof" style={{ width: "6%" }} />
                </div>
              </div>

              <div className="reports-bar-item">
                <div className="reports-bar-label">
                  <span>Other</span>
                  <strong>3%</strong>
                </div>
                <div className="reports-bar-bg">
                  <div className="reports-bar-fill fill-other" style={{ width: "3%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6 — RISK DISTRIBUTION */}
          <div className="reports-dist-box">
            <h4>Risk Distribution</h4>
            <div className="reports-bars-list">
              <div className="reports-bar-item">
                <div className="reports-bar-label">
                  <span>LOW (Safe)</span>
                  <strong>937 (73%)</strong>
                </div>
                <div className="reports-bar-bg">
                  <div className="reports-bar-fill fill-safe" style={{ width: "73%" }} />
                </div>
              </div>

              <div className="reports-bar-item">
                <div className="reports-bar-label">
                  <span>MEDIUM</span>
                  <strong>108 (8.4%)</strong>
                </div>
                <div className="reports-bar-bg">
                  <div className="reports-bar-fill fill-warning" style={{ width: "8.4%" }} />
                </div>
              </div>

              <div className="reports-bar-item">
                <div className="reports-bar-label">
                  <span>HIGH</span>
                  <strong>153 (11.9%)</strong>
                </div>
                <div className="reports-bar-bg">
                  <div className="reports-bar-fill fill-orange" style={{ width: "11.9%" }} />
                </div>
              </div>

              <div className="reports-bar-item">
                <div className="reports-bar-label">
                  <span>CRITICAL</span>
                  <strong>86 (6.7%)</strong>
                </div>
                <div className="reports-bar-bg">
                  <div className="reports-bar-fill fill-danger" style={{ width: "6.7%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 7 — TOP THREAT ACTIVITY TABLE */}
        <div className="reports-section-block">
          <span className="reports-block-title">TOP THREAT ACTIVITY</span>
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Threat</th>
                  <th>Occurrences</th>
                  <th>Risk</th>
                  <th>Trend</th>
                  <th>Last Detected</th>
                </tr>
              </thead>
              <tbody>
                {TOP_THREAT_ACTIVITY.map((row) => (
                  <tr key={row.threat}>
                    <td>
                      <strong>{row.threat}</strong>
                    </td>
                    <td>{row.occurrences}</td>
                    <td>
                      <span
                        className={`reports-risk-tag risk-${row.risk.toLowerCase()}`}
                      >
                        {row.risk}
                      </span>
                    </td>
                    <td className={row.trend.startsWith("+") ? "text-danger" : "text-safe"}>
                      {row.trend}
                    </td>
                    <td className="text-dim">{row.lastDetected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 8 — INCIDENT SUMMARY (CRITICAL INCIDENTS) */}
        <div className="reports-section-block">
          <span className="reports-block-title">CRITICAL INCIDENTS</span>
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Description</th>
                  <th>Severity</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {CRITICAL_INCIDENTS.map((inc) => (
                  <tr key={inc.id}>
                    <td className="text-cyan text-monospace">{inc.id}</td>
                    <td>{inc.description}</td>
                    <td>
                      <span className={`reports-risk-tag risk-${inc.severity.toLowerCase()}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="text-dim">{inc.date}</td>
                    <td>
                      <span className="reports-status-pill">{inc.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 9 — RECENT REPORTS TABLE & FILTERS */}
      <div className="reports-card reports-table-card">
        <div className="reports-card-header">
          <div>
            <h2>Recent Reports</h2>
            <p className="reports-card-sub">
              Historical security reports and exported intelligence telemetry ({filteredReports.length} records)
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="reports-table-filters">
          <div className="reports-filter-wrap">
            <span className="reports-search-icon">⌕</span>
            <input
              type="text"
              className="reports-table-input"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search reports..."
            />
          </div>

          <div className="reports-dropdowns-row">
            {/* Report Type */}
            <select
              className="reports-select"
              value={tableTypeFilter}
              onChange={(e) => setTableTypeFilter(e.target.value)}
            >
              <option value="All">All Report Types</option>
              <option value="Executive Security Summary">Executive Security Summary</option>
              <option value="Email Threat Analysis">Email Threat Analysis</option>
              <option value="Phishing Investigation">Phishing Investigation</option>
              <option value="Threat Intelligence Report">Threat Intelligence Report</option>
              <option value="Incident Response Report">Incident Response Report</option>
              <option value="Compliance Report">Compliance Report</option>
            </select>

            {/* Format */}
            <select
              className="reports-select"
              value={tableFormatFilter}
              onChange={(e) => setTableFormatFilter(e.target.value)}
            >
              <option value="All">All Formats</option>
              <option value="PDF">PDF</option>
              <option value="CSV">CSV</option>
            </select>

            {/* Status */}
            <select
              className="reports-select"
              value={tableStatusFilter}
              onChange={(e) => setTableStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Generated">Generated</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
            </select>

            <button className="reports-btn-secondary" onClick={handleResetTableFilters}>
              Reset Filters
            </button>
          </div>
        </div>

        {/* Recent Reports Table */}
        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Report Type</th>
                <th>Period</th>
                <th>Generated By</th>
                <th>Created</th>
                <th>Format</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="reports-empty">
                    No security reports match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((row) => (
                  <tr key={row.id}>
                    <td className="text-cyan text-monospace">{row.id}</td>
                    <td>
                      <strong>{row.type}</strong>
                    </td>
                    <td className="text-dim">{row.period}</td>
                    <td>{row.generatedBy}</td>
                    <td className="text-dim">{row.created}</td>
                    <td>
                      <span className="reports-fmt-badge">{row.format}</span>
                    </td>
                    <td>
                      <span className="reports-status-tag status-generated">{row.status}</span>
                    </td>
                    <td>
                      <button
                        className="reports-btn-view"
                        onClick={() => setSelectedModalReport(row)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOWER GRID: COMPLIANCE & ANALYST INSIGHTS */}
      <div className="reports-lower-grid">
        {/* SECTION 10 — COMPLIANCE SECTION */}
        <div className="reports-card reports-compliance-card">
          <div className="reports-card-header">
            <h3>Security & Compliance</h3>
          </div>

          <div className="reports-compliance-list">
            <div className="reports-comp-item">
              <div className="reports-comp-label">
                <span>Email Security Coverage</span>
                <strong>94%</strong>
              </div>
              <div className="reports-bar-bg">
                <div className="reports-bar-fill fill-cyan" style={{ width: "94%" }} />
              </div>
            </div>

            <div className="reports-comp-item">
              <div className="reports-comp-label">
                <span>Threat Detection Coverage</span>
                <strong>89%</strong>
              </div>
              <div className="reports-bar-bg">
                <div className="reports-bar-fill fill-cyan" style={{ width: "89%" }} />
              </div>
            </div>

            <div className="reports-comp-item">
              <div className="reports-comp-label">
                <span>IOC Monitoring</span>
                <strong>92%</strong>
              </div>
              <div className="reports-bar-bg">
                <div className="reports-bar-fill fill-cyan" style={{ width: "92%" }} />
              </div>
            </div>

            <div className="reports-comp-item">
              <div className="reports-comp-label">
                <span>Incident Documentation</span>
                <strong>96%</strong>
              </div>
              <div className="reports-bar-bg">
                <div className="reports-bar-fill fill-safe" style={{ width: "96%" }} />
              </div>
            </div>

            <div className="reports-comp-item">
              <div className="reports-comp-label">
                <span>Audit Readiness</span>
                <strong>91%</strong>
              </div>
              <div className="reports-bar-bg">
                <div className="reports-bar-fill fill-safe" style={{ width: "91%" }} />
              </div>
            </div>
          </div>

          <p className="reports-compliance-note">
            Based on current MailShield AI telemetry and configured security controls.
          </p>
        </div>

        {/* SECTION 11 — REPORT INSIGHTS */}
        <div className="reports-card reports-insights-card">
          <div className="reports-card-header">
            <h3>Analyst Insights</h3>
          </div>

          <div className="reports-insights-list">
            <div className="reports-insight-item">
              <span className="reports-insight-bullet">•</span>
              <p>Phishing activity increased by 18% during the selected reporting period.</p>
            </div>
            <div className="reports-insight-item">
              <span className="reports-insight-bullet">•</span>
              <p>Credential theft remains the second-largest detected threat category.</p>
            </div>
            <div className="reports-insight-item">
              <span className="reports-insight-bullet">•</span>
              <p>Critical-risk incidents represent 6.7% of analyzed security events.</p>
            </div>
            <div className="reports-insight-item">
              <span className="reports-insight-bullet">•</span>
              <p>Three high-confidence malicious domains were observed repeatedly across telemetry feeds.</p>
            </div>
          </div>
        </div>
      </div>

      {/* REPORT VIEW MODAL */}
      {selectedModalReport && (
        <div className="reports-modal-overlay" onClick={() => setSelectedModalReport(null)}>
          <div className="reports-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="reports-modal-header">
              <div>
                <span className="reports-modal-eyebrow">EXECUTIVE REPORT FILE</span>
                <h3>{selectedModalReport.title || selectedModalReport.type}</h3>
                <span className="reports-modal-id">{selectedModalReport.id}</span>
              </div>
              <button className="reports-modal-close" onClick={() => setSelectedModalReport(null)}>
                ✕
              </button>
            </div>

            <div className="reports-modal-body">
              <div className="reports-modal-meta">
                <div>
                  <span>Reporting Period:</span>
                  <strong>{selectedModalReport.period}</strong>
                </div>
                <div>
                  <span>Created:</span>
                  <strong className="text-dim">{selectedModalReport.created}</strong>
                </div>
                <div>
                  <span>Format:</span>
                  <strong className="text-cyan">{selectedModalReport.format}</strong>
                </div>
              </div>

              <div className="reports-modal-section">
                <h4>Executive Summary</h4>
                <p className="reports-modal-text">{selectedModalReport.summary}</p>
              </div>

              <div className="reports-modal-section">
                <h4>Key Metrics & Distribution</h4>
                <div className="reports-modal-metrics">
                  <div>
                    <span>Total Scans</span>
                    <strong>1,284</strong>
                  </div>
                  <div>
                    <span>Threats</span>
                    <strong className="text-orange">347</strong>
                  </div>
                  <div>
                    <span>Safe</span>
                    <strong className="text-safe">937</strong>
                  </div>
                  <div>
                    <span>Critical</span>
                    <strong className="text-danger">86</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="reports-modal-footer">
              <button className="reports-btn-action" onClick={handleExportPdf}>
                📄 Export PDF
              </button>
              <button className="reports-btn-action" onClick={handleExportCsv}>
                📊 Export CSV
              </button>
              <button className="reports-btn-secondary" onClick={() => setSelectedModalReport(null)}>
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
