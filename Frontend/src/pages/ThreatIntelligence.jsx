import { useState, useMemo } from "react";
import "./ThreatIntelligence.css";

// 12+ Mock Database IOC Records
const MOCK_IOC_DATABASE = [
  {
    id: "ioc-1",
    indicator: "185.220.101.45",
    type: "IP",
    threat: "Command & Control",
    risk: 96,
    confidence: "98%",
    firstSeen: "04 Aug 2026",
    lastSeen: "10 Sep 2026",
    status: "Malicious",
    asn: "AS12345 OVH SAS",
    isp: "Example Network",
    country: "Germany",
    sources: ["ThreatFox", "MalwareBazaar", "AbuseIPDB", "MailShield Feed"],
    evidence: [
      "Indicator appeared in phishing infrastructure.",
      "Associated with credential harvesting URLs.",
      "Reputation database reports active C2 activity.",
      "Seen in multiple suspicious email investigations.",
    ],
  },
  {
    id: "ioc-2",
    indicator: "paypa1-security.com",
    type: "Domain",
    threat: "Phishing",
    risk: 93,
    confidence: "97%",
    firstSeen: "28 Aug 2026",
    lastSeen: "10 Sep 2026",
    status: "Malicious",
    asn: "AS55210 DigitalOcean",
    isp: "DigitalOcean LLC",
    country: "United States",
    sources: ["AbuseIPDB", "VirusTotal", "MailShield Feed"],
    evidence: [
      "Typosquatting brand impersonation of paypal.com.",
      "Hosts active fake verification login form.",
      "Registered less than 14 days ago.",
      "Failed DMARC cryptographic signature checks.",
    ],
  },
  {
    id: "ioc-3",
    indicator: "secure-login-alert.net",
    type: "Domain",
    threat: "Credential Theft",
    risk: 89,
    confidence: "94%",
    firstSeen: "01 Sep 2026",
    lastSeen: "09 Sep 2026",
    status: "Malicious",
    asn: "AS206804 Zwiebel",
    isp: "Privacy Hosting Ltd",
    country: "Netherlands",
    sources: ["ThreatFox", "VirusTotal"],
    evidence: [
      "Credential harvesting portal targeting corporate SSO.",
      "Multiple malicious URLs resolved to this address.",
      "Suspicious SSL certificate issuer detected.",
    ],
  },
  {
    id: "ioc-4",
    indicator: "192.0.2.45",
    type: "IP",
    threat: "Suspicious Traffic",
    risk: 61,
    confidence: "72%",
    firstSeen: "02 Sep 2026",
    lastSeen: "10 Sep 2026",
    status: "Suspicious",
    asn: "AS15169 Google LLC",
    isp: "Google Cloud",
    country: "United States",
    sources: ["MailShield Feed"],
    evidence: [
      "High volume of failed login telemetry.",
      "Unusual port scanning activity detected.",
    ],
  },
  {
    id: "ioc-5",
    indicator: "github-security-update.com",
    type: "Domain",
    threat: "Impersonation",
    risk: 84,
    confidence: "91%",
    firstSeen: "31 Aug 2026",
    lastSeen: "08 Sep 2026",
    status: "Malicious",
    asn: "AS13335 Cloudflare",
    isp: "Cloudflare Inc",
    country: "United States",
    sources: ["AbuseIPDB", "MailShield Feed"],
    evidence: [
      "Impersonates GitHub developer security updates.",
      "Requests personal OAuth token permissions.",
    ],
  },
  {
    id: "ioc-6",
    indicator: "e3b0c44298fc1c149afbf4c8996fb924",
    type: "Hash",
    threat: "Malware",
    risk: 99,
    confidence: "99%",
    firstSeen: "15 Aug 2026",
    lastSeen: "10 Sep 2026",
    status: "Malicious",
    asn: "N/A (File Hash)",
    isp: "N/A",
    country: "Global",
    sources: ["MalwareBazaar", "VirusTotal"],
    evidence: [
      "Trojan downloader binary payload.",
      "Evasion techniques detected during sandbox execution.",
    ],
  },
  {
    id: "ioc-7",
    indicator: "login.microsoftonline.com",
    type: "Domain",
    threat: "Safe",
    risk: 2,
    confidence: "100%",
    firstSeen: "01 Jan 2024",
    lastSeen: "10 Sep 2026",
    status: "Clean",
    asn: "AS8075 Microsoft",
    isp: "Microsoft Corporation",
    country: "United States",
    sources: ["MailShield Feed"],
    evidence: ["Legitimate Microsoft authentication infrastructure."],
  },
  {
    id: "ioc-8",
    indicator: "104.28.18.23",
    type: "IP",
    threat: "Safe",
    risk: 15,
    confidence: "95%",
    firstSeen: "10 May 2025",
    lastSeen: "10 Sep 2026",
    status: "Clean",
    asn: "AS13335 Cloudflare",
    isp: "Cloudflare Warp CDN",
    country: "United States",
    sources: ["MailShield Feed"],
    evidence: ["Verified Cloudflare CDN Edge Node."],
  },
  {
    id: "ioc-9",
    indicator: "invoice-update-portal.org",
    type: "Domain",
    threat: "Phishing",
    risk: 78,
    confidence: "88%",
    firstSeen: "05 Sep 2026",
    lastSeen: "10 Sep 2026",
    status: "Suspicious",
    asn: "AS16276 OVH SAS",
    isp: "OVH Hosting",
    country: "France",
    sources: ["AbuseIPDB"],
    evidence: [
      "Fake invoice lure targeting finance teams.",
      "Unverified SSL certificate chain.",
    ],
  },
  {
    id: "ioc-10",
    indicator: "ceo-wire-desk@mail-exec.net",
    type: "Email",
    threat: "Impersonation",
    risk: 87,
    confidence: "92%",
    firstSeen: "03 Sep 2026",
    lastSeen: "09 Sep 2026",
    status: "Malicious",
    asn: "AS26496 GoDaddy",
    isp: "GoDaddy.com",
    country: "United States",
    sources: ["MailShield Feed"],
    evidence: [
      "Business Email Compromise (BEC) sender address.",
      "Used in urgent wire transfer requests.",
    ],
  },
  {
    id: "ioc-11",
    indicator: "cdn.cloudflare.com",
    type: "Domain",
    threat: "Safe",
    risk: 5,
    confidence: "99%",
    firstSeen: "01 Jan 2024",
    lastSeen: "10 Sep 2026",
    status: "Clean",
    asn: "AS13335 Cloudflare",
    isp: "Cloudflare Inc",
    country: "United States",
    sources: ["MailShield Feed"],
    evidence: ["Verified public content delivery network."],
  },
  {
    id: "ioc-12",
    indicator: "45.142.214.88",
    type: "IP",
    threat: "Command & Control",
    risk: 94,
    confidence: "96%",
    firstSeen: "20 Aug 2026",
    lastSeen: "10 Sep 2026",
    status: "Malicious",
    asn: "AS48251 Hostland",
    isp: "Hostland Russia",
    country: "Russia",
    sources: ["ThreatFox", "MalwareBazaar"],
    evidence: [
      "Active Cobalt Strike beacon C2 server.",
      "High volume of suspicious outbound connections.",
    ],
  },
];

// Threat Feeds Operational Status
const THREAT_FEEDS = [
  { name: "ThreatFox", status: "Operational", syncTime: "2 min ago" },
  { name: "AbuseIPDB", status: "Operational", syncTime: "5 min ago" },
  { name: "MalwareBazaar", status: "Operational", syncTime: "7 min ago" },
  { name: "MailShield Internal Feed", status: "Operational", syncTime: "1 min ago" },
  { name: "VirusTotal", status: "Operational", syncTime: "4 min ago" },
];

// Recent Activity Timeline
const RECENT_TIMELINE = [
  {
    time: "14:32",
    title: "Critical IOC detected",
    indicator: "paypa1-security.com",
    category: "Phishing infrastructure",
    severity: "critical",
  },
  {
    time: "13:47",
    title: "Malicious IP identified",
    indicator: "185.220.101.45",
    category: "Command & Control",
    severity: "critical",
  },
  {
    time: "12:18",
    title: "New suspicious domain",
    indicator: "secure-login-alert.net",
    category: "Credential Theft",
    severity: "high",
  },
  {
    time: "10:54",
    title: "Malware hash detected",
    indicator: "e3b0c44298fc1c149afbf4c8996fb924",
    category: "Malware Payload",
    severity: "critical",
  },
];

export default function ThreatIntelligence() {
  // Investigation engine state
  const [inputIoc, setInputIoc] = useState("185.220.101.45");
  const [selectedType, setSelectedType] = useState("Auto Detect");
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeResult, setActiveResult] = useState(MOCK_IOC_DATABASE[0]);

  // Table filters & state
  const [tableSearch, setTableSearch] = useState("");
  const [tableTypeFilter, setTableTypeFilter] = useState("All");
  const [tableThreatFilter, setTableThreatFilter] = useState("All");
  const [tableStatusFilter, setTableStatusFilter] = useState("All");

  // Modal & Watchlist state
  const [selectedModalIoc, setSelectedModalIoc] = useState(null);
  const [watchlistSet, setWatchlistSet] = useState(new Set());

  // Mock Analysis Function (simulating backend API call)
  const analyzeIOC = (ioc, type) => {
    if (!ioc.trim()) return;

    setIsInvestigating(true);
    setTimeout(() => {
      const iocLower = ioc.toLowerCase().trim();

      // Check if matches existing DB item
      const found = MOCK_IOC_DATABASE.find(
        (item) => item.indicator.toLowerCase() === iocLower
      );

      if (found) {
        setActiveResult(found);
      } else {
        // Dynamic frontend simulation logic
        const isPhishing =
          iocLower.includes("paypa") ||
          iocLower.includes("secure") ||
          iocLower.includes("login") ||
          iocLower.includes("verify") ||
          iocLower.includes("account");
        const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(iocLower);
        const isHash = iocLower.length >= 32 && !iocLower.includes(".");
        const isClean =
          iocLower.includes("github.com") ||
          iocLower.includes("google.com") ||
          iocLower.includes("microsoft.com") ||
          iocLower.includes("cloudflare.com");

        if (isClean) {
          setActiveResult({
            id: `custom-${Date.now()}`,
            indicator: ioc,
            type: type !== "Auto Detect" ? type : isIp ? "IP" : "Domain",
            threat: "Safe",
            risk: 4,
            confidence: "99%",
            firstSeen: "01 Jan 2025",
            lastSeen: "Just now",
            status: "Clean",
            asn: "AS13335 Cloudflare",
            isp: "Global Edge Network",
            country: "United States",
            sources: ["MailShield Internal Feed"],
            evidence: ["No malicious indicators found across threat databases."],
          });
        } else if (isPhishing || isHash || isIp) {
          const score = isHash ? 99 : isPhishing ? 93 : 88;
          setActiveResult({
            id: `custom-${Date.now()}`,
            indicator: ioc,
            type:
              type !== "Auto Detect"
                ? type
                : isHash
                ? "Hash"
                : isIp
                ? "IP"
                : "Domain",
            threat: isHash ? "Malware" : isPhishing ? "Phishing" : "Command & Control",
            risk: score,
            confidence: "96%",
            firstSeen: "10 Aug 2026",
            lastSeen: "Just now",
            status: score >= 80 ? "Malicious" : "Suspicious",
            asn: "AS48251 Hostland",
            isp: "Hosting Provider Ltd",
            country: "Unknown",
            sources: ["ThreatFox", "AbuseIPDB", "MailShield Feed"],
            evidence: [
              "Indicator flagged in active threat campaign databases.",
              "Associated with suspicious login harvesting payload.",
              "Failed DKIM & SPF reputation verification checks.",
            ],
          });
        } else {
          setActiveResult({
            id: `custom-${Date.now()}`,
            indicator: ioc,
            type: type !== "Auto Detect" ? type : "Domain",
            threat: "Suspicious Traffic",
            risk: 62,
            confidence: "75%",
            firstSeen: "01 Sep 2026",
            lastSeen: "Just now",
            status: "Suspicious",
            asn: "AS12876 Telecom",
            isp: "Carrier Network",
            country: "United States",
            sources: ["MailShield Internal Feed"],
            evidence: [
              "Unusual outbound traffic volume detected.",
              "Requires SOC analyst further manual investigation.",
            ],
          });
        }
      }

      setIsInvestigating(false);
    }, 500);
  };

  // Filtered table records
  const filteredDatabase = useMemo(() => {
    return MOCK_IOC_DATABASE.filter((item) => {
      const search = tableSearch.toLowerCase().trim();
      if (search && !item.indicator.toLowerCase().includes(search)) {
        return false;
      }
      if (tableTypeFilter !== "All" && item.type !== tableTypeFilter) {
        return false;
      }
      if (tableThreatFilter !== "All" && item.threat !== tableThreatFilter) {
        return false;
      }
      if (tableStatusFilter !== "All" && item.status !== tableStatusFilter) {
        return false;
      }
      return true;
    });
  }, [tableSearch, tableTypeFilter, tableThreatFilter, tableStatusFilter]);

  // Reset Table Filters
  const handleResetTableFilters = () => {
    setTableSearch("");
    setTableTypeFilter("All");
    setTableThreatFilter("All");
    setTableStatusFilter("All");
  };

  // Toggle Watchlist state
  const handleToggleWatchlist = (id) => {
    setWatchlistSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper for score color
  const getRiskColor = (score) => {
    if (score >= 80) return "var(--danger, #ff6b6b)";
    if (score >= 60) return "#ff8b3d";
    if (score >= 30) return "var(--warning, #ffc857)";
    return "var(--safe, #3ee08f)";
  };

  // Helper for score category name
  const getRiskCategory = (score) => {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 30) return "MEDIUM";
    return "LOW";
  };

  // Status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Malicious":
        return "threat-intel-badge-malicious";
      case "Suspicious":
        return "threat-intel-badge-suspicious";
      case "Clean":
      default:
        return "threat-intel-badge-clean";
    }
  };

  return (
    <div className="threat-intel-container">
      {/* SECTION 1 — THREAT OVERVIEW CARDS */}
      <div className="threat-intel-stats-grid">
        {/* Active Threats */}
        <div className="threat-intel-stat-card">
          <div className="threat-intel-stat-header">
            <span className="threat-intel-stat-label">ACTIVE THREATS</span>
            <span className="threat-intel-stat-icon">⚠️</span>
          </div>
          <div className="threat-intel-stat-val text-danger">2,481</div>
          <div className="threat-intel-stat-sub text-danger">+8.6% this week</div>
        </div>

        {/* Malicious IOCs */}
        <div className="threat-intel-stat-card">
          <div className="threat-intel-stat-header">
            <span className="threat-intel-stat-label">MALICIOUS IOCs</span>
            <span className="threat-intel-stat-icon">🎯</span>
          </div>
          <div className="threat-intel-stat-val text-orange">1,734</div>
          <div className="threat-intel-stat-sub text-orange">68.2% of tracked indicators</div>
        </div>

        {/* Suspicious IOCs */}
        <div className="threat-intel-stat-card">
          <div className="threat-intel-stat-header">
            <span className="threat-intel-stat-label">SUSPICIOUS IOCs</span>
            <span className="threat-intel-stat-icon">🔍</span>
          </div>
          <div className="threat-intel-stat-val text-warning">521</div>
          <div className="threat-intel-stat-sub text-warning">Requires investigation</div>
        </div>

        {/* Threat Feeds */}
        <div className="threat-intel-stat-card">
          <div className="threat-intel-stat-header">
            <span className="threat-intel-stat-label">THREAT FEEDS</span>
            <span className="threat-intel-stat-icon">📡</span>
          </div>
          <div className="threat-intel-stat-val text-cyan">14</div>
          <div className="threat-intel-stat-sub text-safe">12 feeds operational</div>
        </div>
      </div>

      {/* SECTION 2 — IOC INVESTIGATION PANEL */}
      <div className="threat-intel-card threat-intel-investigation-card">
        <div className="threat-intel-card-header">
          <div>
            <h2>IOC Investigation</h2>
            <p className="threat-intel-card-sub">
              Search and investigate indicators associated with malicious email activity.
            </p>
          </div>
        </div>

        {/* Search Bar & Dropdown */}
        <div className="threat-intel-search-row">
          <div className="threat-intel-input-wrap">
            <span className="threat-intel-search-icon">⌕</span>
            <input
              type="text"
              className="threat-intel-input"
              value={inputIoc}
              onChange={(e) => setInputIoc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeIOC(inputIoc, selectedType)}
              placeholder="Enter IP address, domain, URL, file hash or email..."
            />
          </div>

          <select
            className="threat-intel-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="Auto Detect">Auto Detect</option>
            <option value="IP Address">IP Address</option>
            <option value="Domain">Domain</option>
            <option value="URL">URL</option>
            <option value="File Hash">File Hash</option>
            <option value="Email Address">Email Address</option>
          </select>

          <button
            className="threat-intel-btn-primary"
            onClick={() => analyzeIOC(inputIoc, selectedType)}
            disabled={isInvestigating}
          >
            {isInvestigating ? (
              <>
                <span className="threat-intel-spinner" /> INVESTIGATING...
              </>
            ) : (
              <>
                <span>INVESTIGATE IOC</span>
                <span className="threat-intel-btn-arrow">→</span>
              </>
            )}
          </button>
        </div>

        {/* INVESTIGATION RESULT PANEL */}
        {activeResult && (
          <div className="threat-intel-result-panel">
            {/* Verdict Header */}
            <div className="threat-intel-result-top">
              <div className="threat-intel-ioc-identity">
                <span className="threat-intel-result-label">INVESTIGATED TARGET</span>
                <h3 className="threat-intel-ioc-title">{activeResult.indicator}</h3>
                <span className="threat-intel-type-tag">{activeResult.type}</span>
              </div>

              <div className="threat-intel-verdict-wrap">
                <span className={`threat-intel-status-pill ${getStatusBadgeClass(activeResult.status)}`}>
                  ● {activeResult.status.toUpperCase()}
                </span>
                <div className="threat-intel-score-block">
                  <span
                    className="threat-intel-score-big"
                    style={{ color: getRiskColor(activeResult.risk) }}
                  >
                    {activeResult.risk}
                    <small style={{ fontSize: "14px", color: "var(--text-faint)" }}>/100</small>
                  </span>
                  <span className="threat-intel-score-cat">
                    {getRiskCategory(activeResult.risk)} RISK
                  </span>
                </div>
              </div>
            </div>

            {/* Horizontal Risk Meter */}
            <div className="threat-intel-meter-row">
              <div className="threat-intel-meter-bg">
                <div
                  className="threat-intel-meter-fill"
                  style={{
                    width: `${activeResult.risk}%`,
                    backgroundColor: getRiskColor(activeResult.risk),
                  }}
                />
              </div>
              <span className="threat-intel-confidence-text">
                CONFIDENCE: <strong>{activeResult.confidence}</strong>
              </span>
            </div>

            {/* Technical Metadata Grid */}
            <div className="threat-intel-meta-grid">
              <div className="threat-intel-meta-item">
                <span>Threat Category</span>
                <strong className="text-cyan">{activeResult.threat}</strong>
              </div>
              <div className="threat-intel-meta-item">
                <span>Confidence Rating</span>
                <strong>{activeResult.confidence}</strong>
              </div>
              <div className="threat-intel-meta-item">
                <span>First Seen</span>
                <strong className="text-dim">{activeResult.firstSeen}</strong>
              </div>
              <div className="threat-intel-meta-item">
                <span>Last Seen</span>
                <strong className="text-dim">{activeResult.lastSeen}</strong>
              </div>
              <div className="threat-intel-meta-item">
                <span>ASN</span>
                <strong className="text-monospace">{activeResult.asn}</strong>
              </div>
              <div className="threat-intel-meta-item">
                <span>ISP / Carrier</span>
                <strong>{activeResult.isp}</strong>
              </div>
              <div className="threat-intel-meta-item">
                <span>Country</span>
                <strong>{activeResult.country}</strong>
              </div>
            </div>

            {/* Detection Sources */}
            <div className="threat-intel-sources-block">
              <span className="threat-intel-block-label">DETECTION SOURCES</span>
              <div className="threat-intel-source-pills">
                {activeResult.sources.map((src) => (
                  <span key={src} className="threat-intel-source-pill">
                    ◈ {src}
                  </span>
                ))}
              </div>
            </div>

            {/* Threat Indicators List */}
            <div className="threat-intel-indicators-block">
              <span className="threat-intel-block-label">THREAT INDICATORS</span>
              <div className="threat-intel-indicators-list">
                {activeResult.evidence.map((ev, i) => (
                  <div key={i} className="threat-intel-ind-row">
                    <span className="threat-intel-warn-icon">⚠️</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3 — IOC DATABASE TABLE */}
      <div className="threat-intel-card threat-intel-table-card">
        <div className="threat-intel-card-header">
          <div>
            <h2>IOC Intelligence Database</h2>
            <p className="threat-intel-card-sub">
              Recently observed indicators across connected threat feeds ({filteredDatabase.length} entries)
            </p>
          </div>
        </div>

        {/* Toolbar Filters */}
        <div className="threat-intel-table-filters">
          <div className="threat-intel-filter-wrap">
            <span className="threat-intel-search-icon">⌕</span>
            <input
              type="text"
              className="threat-intel-table-input"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search IOC..."
            />
          </div>

          <div className="threat-intel-dropdowns-row">
            {/* Type */}
            <select
              className="threat-intel-select"
              value={tableTypeFilter}
              onChange={(e) => setTableTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="IP">IP</option>
              <option value="Domain">Domain</option>
              <option value="URL">URL</option>
              <option value="Hash">Hash</option>
              <option value="Email">Email</option>
            </select>

            {/* Threat */}
            <select
              className="threat-intel-select"
              value={tableThreatFilter}
              onChange={(e) => setTableThreatFilter(e.target.value)}
            >
              <option value="All">All Threats</option>
              <option value="Phishing">Phishing</option>
              <option value="Malware">Malware</option>
              <option value="Credential Theft">Credential Theft</option>
              <option value="Command & Control">Command & Control</option>
              <option value="Impersonation">Impersonation</option>
              <option value="Suspicious Traffic">Suspicious Traffic</option>
              <option value="Safe">Safe</option>
            </select>

            {/* Status */}
            <select
              className="threat-intel-select"
              value={tableStatusFilter}
              onChange={(e) => setTableStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Malicious">Malicious</option>
              <option value="Suspicious">Suspicious</option>
              <option value="Clean">Clean</option>
            </select>

            <button className="threat-intel-btn-reset" onClick={handleResetTableFilters}>
              Reset Filters
            </button>
          </div>
        </div>

        {/* Database Table */}
        <div className="threat-intel-table-wrap">
          <table className="threat-intel-table">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Type</th>
                <th>Threat</th>
                <th>Risk</th>
                <th>Confidence</th>
                <th>First Seen</th>
                <th>Last Seen</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDatabase.length === 0 ? (
                <tr>
                  <td colSpan={9} className="threat-intel-empty">
                    No IOC records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDatabase.map((row) => {
                  const scoreColor = getRiskColor(row.risk);
                  return (
                    <tr key={row.id} className="threat-intel-row">
                      <td className="threat-intel-cell-indicator">{row.indicator}</td>
                      <td>
                        <span className="threat-intel-type-badge">{row.type}</span>
                      </td>
                      <td className="threat-intel-cell-threat">{row.threat}</td>
                      <td>
                        <div className="threat-intel-score-inline">
                          <span style={{ color: scoreColor, fontWeight: 800 }}>
                            {row.risk}
                          </span>
                          <div className="threat-intel-mini-bar-bg">
                            <div
                              className="threat-intel-mini-bar-fill"
                              style={{ width: `${row.risk}%`, backgroundColor: scoreColor }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>{row.confidence}</td>
                      <td className="text-dim">{row.firstSeen}</td>
                      <td className="text-dim">{row.lastSeen}</td>
                      <td>
                        <span className={`threat-intel-badge ${getStatusBadgeClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="threat-intel-btn-investigate"
                          onClick={() => setSelectedModalIoc(row)}
                        >
                          Investigate
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

      {/* LOWER SECTION GRID: THREAT FEEDS & RECENT TIMELINE */}
      <div className="threat-intel-lower-grid">
        {/* SECTION 4 — THREAT FEED STATUS */}
        <div className="threat-intel-card threat-intel-feed-card">
          <div className="threat-intel-card-header">
            <h3>Threat Feed Status</h3>
            <span className="threat-intel-card-sub">5 Connected Feeds</span>
          </div>

          <div className="threat-intel-feed-list">
            {THREAT_FEEDS.map((feed) => (
              <div key={feed.name} className="threat-intel-feed-item">
                <div className="threat-intel-feed-left">
                  <span className="threat-intel-feed-dot" />
                  <strong>{feed.name}</strong>
                </div>
                <div className="threat-intel-feed-right">
                  <span className="threat-intel-status-op">● Operational</span>
                  <small className="text-dim">Last sync: {feed.syncTime}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5 — RECENT THREAT ACTIVITY TIMELINE */}
        <div className="threat-intel-card threat-intel-timeline-card">
          <div className="threat-intel-card-header">
            <h3>Recent Threat Activity</h3>
            <span className="threat-intel-card-sub">Real-time Telemetry Feed</span>
          </div>

          <div className="threat-intel-timeline-list">
            {RECENT_TIMELINE.map((item, idx) => (
              <div key={idx} className="threat-intel-timeline-item">
                <div className="threat-intel-timeline-time">{item.time}</div>
                <div className="threat-intel-timeline-node">
                  <span className={`threat-intel-node-dot severity-${item.severity}`} />
                  {idx < RECENT_TIMELINE.length - 1 && <span className="threat-intel-node-line" />}
                </div>
                <div className="threat-intel-timeline-content">
                  <strong>{item.title}</strong>
                  <code className="threat-intel-tl-code">{item.indicator}</code>
                  <span className="threat-intel-tl-tag">{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IOC DETAILS MODAL */}
      {selectedModalIoc && (
        <div className="threat-intel-modal-overlay" onClick={() => setSelectedModalIoc(null)}>
          <div className="threat-intel-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="threat-intel-modal-header">
              <div>
                <span className="threat-intel-modal-eyebrow">IOC THREAT INTELLIGENCE FILE</span>
                <h3 className="text-monospace">{selectedModalIoc.indicator}</h3>
              </div>
              <button
                className="threat-intel-modal-close"
                onClick={() => setSelectedModalIoc(null)}
              >
                ✕
              </button>
            </div>

            {/* Modal Overview */}
            <div className="threat-intel-modal-overview">
              <div className="threat-intel-ov-item">
                <span>VERDICT</span>
                <span className={`threat-intel-badge ${getStatusBadgeClass(selectedModalIoc.status)}`}>
                  {selectedModalIoc.status.toUpperCase()}
                </span>
              </div>
              <div className="threat-intel-ov-item">
                <span>RISK SCORE</span>
                <strong style={{ color: getRiskColor(selectedModalIoc.risk), fontSize: "18px" }}>
                  {selectedModalIoc.risk} / 100
                </strong>
              </div>
              <div className="threat-intel-ov-item">
                <span>CONFIDENCE</span>
                <strong>{selectedModalIoc.confidence}</strong>
              </div>
              <div className="threat-intel-ov-item">
                <span>TYPE</span>
                <span className="threat-intel-type-tag">{selectedModalIoc.type}</span>
              </div>
            </div>

            {/* Modal Grids */}
            <div className="threat-intel-modal-grid">
              {/* Classification */}
              <div className="threat-intel-modal-sec">
                <h4>THREAT CLASSIFICATION</h4>
                <div className="threat-intel-row-detail">
                  <span>Threat Type:</span>
                  <strong className="text-cyan">{selectedModalIoc.threat}</strong>
                </div>
                <div className="threat-intel-row-detail">
                  <span>Threat Family:</span>
                  <strong>{selectedModalIoc.threat} Lure Campaign</strong>
                </div>
                <div className="threat-intel-row-detail">
                  <span>Campaign:</span>
                  <strong>GLOBAL-PHISH-2026</strong>
                </div>
                <div className="threat-intel-row-detail">
                  <span>Severity:</span>
                  <strong style={{ color: getRiskColor(selectedModalIoc.risk) }}>
                    {getRiskCategory(selectedModalIoc.risk)}
                  </strong>
                </div>
              </div>

              {/* Network / Domain Intelligence */}
              <div className="threat-intel-modal-sec">
                <h4>NETWORK / DOMAIN INTELLIGENCE</h4>
                <div className="threat-intel-row-detail">
                  <span>Country:</span>
                  <strong>{selectedModalIoc.country}</strong>
                </div>
                <div className="threat-intel-row-detail">
                  <span>ASN:</span>
                  <strong className="text-monospace">{selectedModalIoc.asn}</strong>
                </div>
                <div className="threat-intel-row-detail">
                  <span>ISP:</span>
                  <strong>{selectedModalIoc.isp}</strong>
                </div>
                <div className="threat-intel-row-detail">
                  <span>Registrar:</span>
                  <strong>NameCheap / Cloudflare Privacy</strong>
                </div>
              </div>
            </div>

            {/* Evidence Section */}
            <div className="threat-intel-modal-sec">
              <h4>DETECTION EVIDENCE</h4>
              <div className="threat-intel-indicators-list">
                {selectedModalIoc.evidence.map((ev, i) => (
                  <div key={i} className="threat-intel-ind-row">
                    <span className="threat-intel-warn-icon">•</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="threat-intel-modal-footer">
              <button
                className={`threat-intel-btn-watchlist ${
                  watchlistSet.has(selectedModalIoc.id) ? "active" : ""
                }`}
                onClick={() => handleToggleWatchlist(selectedModalIoc.id)}
              >
                {watchlistSet.has(selectedModalIoc.id) ? "✓ On Watchlist" : "+ Add to Watchlist"}
              </button>
              <button
                className="threat-intel-btn-close"
                onClick={() => setSelectedModalIoc(null)}
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
