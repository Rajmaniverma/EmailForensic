import { useState } from "react";
import "./Settings.css";

// Initial Configuration Preset State
const DEFAULT_RULES = [
  { id: "r1", name: "Phishing Detection", description: "Detect suspicious links, impersonation and credential harvesting.", severity: "Critical", defaultOn: true },
  { id: "r2", name: "Domain Spoofing Detection", description: "Detect lookalike domains and sender-domain inconsistencies.", severity: "High", defaultOn: true },
  { id: "r3", name: "Social Engineering Detection", description: "Identify urgency, manipulation and suspicious requests.", severity: "High", defaultOn: true },
  { id: "r4", name: "Malware Attachment Detection", description: "Analyze suspicious attachment indicators.", severity: "Critical", defaultOn: true },
  { id: "r5", name: "URL Reputation Check", description: "Check URLs against threat intelligence reputation.", severity: "High", defaultOn: true },
  { id: "r6", name: "IOC Reputation Analysis", description: "Correlate IPs, domains and hashes with threat intelligence.", severity: "High", defaultOn: true },
  { id: "r7", name: "DMARC Validation", description: "Evaluate sender authentication and domain alignment.", severity: "Medium", defaultOn: true },
  { id: "r8", name: "Behavioral Anomaly Detection", description: "Detect unusual sender and message behavior.", severity: "Medium", defaultOn: true },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("detection");

  // Settings State
  const [sensitivity, setSensitivity] = useState("Balanced");
  const [rulesState, setRulesState] = useState(() => {
    const initial = {};
    DEFAULT_RULES.forEach((r) => (initial[r.id] = r.defaultOn));
    return initial;
  });

  // API Key State
  const [apiKeys, setApiKeys] = useState({
    VirusTotal: { masked: "••••••••••••••••9F3A", revealedVal: "vt_demo_••••••••••9F3A", revealed: false },
    AbuseIPDB: { masked: "••••••••••••••••72BC", revealedVal: "abuse_demo_••••••••72BC", revealed: false },
    ThreatFox: { masked: "••••••••••••••••41DE", revealedVal: "tf_demo_••••••••••41DE", revealed: false },
  });

  // Webhook State
  const [webhook, setWebhook] = useState({
    name: "Security Operations Alerts",
    endpoint: "https://example.invalid/webhook/mailshield",
    status: "Active",
    events: {
      "Critical Threat": true,
      "Malware Detection": true,
      "Phishing Detection": true,
      "High Risk Email": true,
      "System Alert": true,
    },
  });

  // Notifications State
  const [notificationChannels, setNotificationChannels] = useState({
    "In-App Alerts": true,
    "Email Alerts": true,
    "SOC Webhook": true,
    "Critical Threat Alerts": true,
    "Daily Security Summary": false,
    "Weekly Security Summary": true,
  });

  const [alertRules, setAlertRules] = useState({
    Critical: "Immediate notification",
    High: "Immediate notification",
    Medium: "Grouped notification",
    Low: "Daily summary",
  });

  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: "22:00",
    end: "07:00",
  });

  // Security Controls State
  const [sessionTimeout, setSessionTimeout] = useState("30 minutes");
  const [secToggles, setSecToggles] = useState({
    loginAlerts: true,
    newDeviceAlerts: true,
    suspiciousLogin: true,
    allowApiAccess: true,
    requireApiKey: true,
  });
  const [rateLimit, setRateLimit] = useState("500 requests/min");

  // Analyst Preferences State
  const [density, setDensity] = useState("Comfortable");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [dashboardWidgets, setDashboardWidgets] = useState({
    "Show Threat Notifications": true,
    "Show System Health": true,
    "Show Recent Activity": true,
    "Show Risk Trends": true,
    "Show AI Recommendations": true,
  });

  // Unsaved Changes & Tracking
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("10 Sep 2026, 15:48 IST");

  // Modal & Toast State
  const [toastMessage, setToastMessage] = useState(null);
  const [rotateKeyModal, setRotateKeyModal] = useState(null); // Key name string
  const [dangerModalAction, setDangerModalAction] = useState(null); // Action name string

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Rule Toggle
  const handleRuleToggle = (id) => {
    setRulesState((prev) => ({ ...prev, [id]: !prev[id] }));
    markDirty();
  };

  // Sensitivity Select
  const handleSensitivitySelect = (val) => {
    setSensitivity(val);
    markDirty();
  };

  // Reveal Key Toggle
  const handleToggleRevealKey = (keyName) => {
    setApiKeys((prev) => ({
      ...prev,
      [keyName]: { ...prev[keyName], revealed: !prev[keyName].revealed },
    }));
  };

  // Rotate Key Action
  const handleConfirmRotateKey = () => {
    if (!rotateKeyModal) return;
    const keyName = rotateKeyModal;
    setApiKeys((prev) => ({
      ...prev,
      [keyName]: {
        ...prev[keyName],
        masked: `••••••••••••••••${Math.floor(1000 + Math.random() * 9000)}`,
        revealedVal: `rotated_demo_${Math.floor(1000 + Math.random() * 9000)}`,
      },
    }));
    setRotateKeyModal(null);
    showToast("API credential rotated successfully.");
  };

  // Test Webhook Action
  const handleTestWebhook = () => {
    showToast("Test webhook sent successfully.");
  };

  // Save Configuration Simulation
  const handleSaveConfig = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      const now = new Date();
      setLastUpdated(
        `${now.getDate()} Sep 2026, ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")} IST`
      );
      showToast("Configuration saved successfully");
    }, 700);
  };

  // Discard Changes
  const handleDiscardChanges = () => {
    setIsDirty(false);
    showToast("Changes discarded");
  };

  // Danger Zone Action Confirm
  const handleConfirmDangerAction = () => {
    setDangerModalAction(null);
    handleResetFormDefaults();
    showToast("Settings restored to recommended defaults.");
  };

  const handleResetFormDefaults = () => {
    setSensitivity("Balanced");
    const initialRules = {};
    DEFAULT_RULES.forEach((r) => (initialRules[r.id] = true));
    setRulesState(initialRules);
    setSessionTimeout("30 minutes");
    setRateLimit("500 requests/min");
    setIsDirty(false);
  };

  return (
    <div className="settings-container">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="settings-toast-banner">
          <span className="settings-toast-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Eyebrow Title managed by MainLayout */}

      {/* TABS NAVIGATION */}
      <div className="settings-tabs-bar">
        <button
          className={`settings-tab ${activeTab === "detection" ? "active" : ""}`}
          onClick={() => setActiveTab("detection")}
        >
          Detection Engine
        </button>
        <button
          className={`settings-tab ${activeTab === "integrations" ? "active" : ""}`}
          onClick={() => setActiveTab("integrations")}
        >
          Integrations
        </button>
        <button
          className={`settings-tab ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications
        </button>
        <button
          className={`settings-tab ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
        <button
          className={`settings-tab ${activeTab === "preferences" ? "active" : ""}`}
          onClick={() => setActiveTab("preferences")}
        >
          Analyst Preferences
        </button>
      </div>

      {/* TAB 1 — DETECTION ENGINE */}
      {activeTab === "detection" && (
        <div className="settings-tab-pane">
          {/* AI Status Card */}
          <div className="settings-card settings-engine-card">
            <div className="settings-card-header">
              <div>
                <h2>AI Detection Engine</h2>
                <p className="settings-card-sub">
                  Configure how MailShield AI evaluates suspicious email activity.
                </p>
              </div>
              <span className="settings-status-pill status-active">● ACTIVE</span>
            </div>

            <div className="settings-engine-meta-grid">
              <div className="settings-meta-item">
                <span>Engine Version</span>
                <strong className="text-cyan text-monospace">MS-AI 2.4.1</strong>
              </div>
              <div className="settings-meta-item">
                <span>Last Updated</span>
                <span className="text-dim">10 Sep 2026</span>
              </div>
              <div className="settings-meta-item">
                <span>Detection Mode</span>
                <strong>Hybrid AI + Rule-Based</strong>
              </div>
            </div>
          </div>

          {/* Detection Sensitivity */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Detection Sensitivity</h3>
            </div>
            <p className="settings-card-sub margin-bottom-md">
              Adjust neural threshold levels for flagging suspicious payload indicators.
            </p>

            <div className="settings-sensitivity-grid">
              {["Low", "Balanced", "High", "Aggressive"].map((level) => (
                <div
                  key={level}
                  className={`settings-sens-card ${sensitivity === level ? "active" : ""}`}
                  onClick={() => handleSensitivitySelect(level)}
                >
                  <div className="settings-sens-header">
                    <strong>{level.toUpperCase()}</strong>
                    {sensitivity === level && <span className="settings-check-icon">✓</span>}
                  </div>
                  <small>
                    {level === "Low"
                      ? "Minimizes false positives. Flags only high-confidence threats."
                      : level === "Balanced"
                      ? "Recommended protection for general enterprise email environments."
                      : level === "High"
                      ? "Strict analysis with elevated scrutiny on external URLs."
                      : "Maximum security. May increase false positives on marketing emails."}
                  </small>
                </div>
              ))}
            </div>
          </div>

          {/* Configurable Detection Rules */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Detection Rules</h3>
              <span className="settings-card-sub">8 Core Inspection Modules</span>
            </div>

            <div className="settings-rules-list">
              {DEFAULT_RULES.map((rule) => {
                const isOn = rulesState[rule.id];
                return (
                  <div key={rule.id} className="settings-rule-item">
                    <div className="settings-rule-info">
                      <div className="settings-rule-title-row">
                        <strong>{rule.name}</strong>
                        <span className={`settings-sev-badge sev-${rule.severity.toLowerCase()}`}>
                          {rule.severity}
                        </span>
                      </div>
                      <p className="settings-rule-desc">{rule.description}</p>
                    </div>

                    {/* Custom Toggle Switch */}
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => handleRuleToggle(rule.id)}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Scoring Thresholds */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Risk Scoring Thresholds</h3>
            </div>

            <div className="settings-thresholds-grid">
              <div className="settings-thresh-box safe">
                <span className="settings-thresh-label">SAFE</span>
                <strong>0 – 29</strong>
              </div>
              <div className="settings-thresh-box warning">
                <span className="settings-thresh-label">SUSPICIOUS</span>
                <strong>30 – 59</strong>
              </div>
              <div className="settings-thresh-box orange">
                <span className="settings-thresh-label">HIGH RISK</span>
                <strong>60 – 79</strong>
              </div>
              <div className="settings-thresh-box danger">
                <span className="settings-thresh-label">CRITICAL</span>
                <strong>80 – 100</strong>
              </div>
            </div>

            <p className="settings-thresh-note">
              Risk scores combine detection signals from the AI engine, authentication checks, reputation data and behavioral analysis.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2 — INTEGRATIONS */}
      {activeTab === "integrations" && (
        <div className="settings-tab-pane">
          {/* Threat Intelligence Providers */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div>
                <h2>Threat Intelligence Integrations</h2>
                <p className="settings-card-sub">
                  Connect external intelligence providers to enrich MailShield AI investigations.
                </p>
              </div>
            </div>

            <div className="settings-integrations-grid">
              <div className="settings-integ-card">
                <div className="settings-integ-header">
                  <strong>VirusTotal</strong>
                  <span className="settings-status-pill status-active">● Connected</span>
                </div>
                <p>Multi-source malware and URL intelligence.</p>
                <button
                  className="settings-btn-secondary"
                  onClick={() => showToast("VirusTotal integration configured")}
                >
                  Configure
                </button>
              </div>

              <div className="settings-integ-card">
                <div className="settings-integ-header">
                  <strong>AbuseIPDB</strong>
                  <span className="settings-status-pill status-active">● Connected</span>
                </div>
                <p>IP reputation and abuse intelligence.</p>
                <button
                  className="settings-btn-secondary"
                  onClick={() => showToast("AbuseIPDB integration configured")}
                >
                  Configure
                </button>
              </div>

              <div className="settings-integ-card">
                <div className="settings-integ-header">
                  <strong>ThreatFox</strong>
                  <span className="settings-status-pill status-active">● Connected</span>
                </div>
                <p>Malware and command-and-control IOC intelligence.</p>
                <button
                  className="settings-btn-secondary"
                  onClick={() => showToast("ThreatFox integration configured")}
                >
                  Configure
                </button>
              </div>

              <div className="settings-integ-card">
                <div className="settings-integ-header">
                  <strong>MalwareBazaar</strong>
                  <span className="settings-status-pill status-active">● Connected</span>
                </div>
                <p>Malware hash intelligence.</p>
                <button
                  className="settings-btn-secondary"
                  onClick={() => showToast("MalwareBazaar integration configured")}
                >
                  Configure
                </button>
              </div>

              <div className="settings-integ-card">
                <div className="settings-integ-header">
                  <strong>MailShield Internal Feed</strong>
                  <span className="settings-status-pill status-active">● Active</span>
                </div>
                <p>Internal threat intelligence generated from analyzed email activity.</p>
                <button
                  className="settings-btn-secondary"
                  onClick={() => showToast("Internal feed managed")}
                >
                  Manage
                </button>
              </div>
            </div>
          </div>

          {/* API Credentials Management */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>API Credentials</h3>
              <span className="settings-card-sub">Masked Key Storage</span>
            </div>

            <div className="settings-api-list">
              {Object.keys(apiKeys).map((keyName) => {
                const item = apiKeys[keyName];
                return (
                  <div key={keyName} className="settings-api-row">
                    <div className="settings-api-info">
                      <strong>{keyName}</strong>
                      <code className="settings-key-code">
                        {item.revealed ? item.revealedVal : item.masked}
                      </code>
                    </div>

                    <div className="settings-api-actions">
                      <button
                        className="settings-btn-secondary"
                        onClick={() => handleToggleRevealKey(keyName)}
                      >
                        {item.revealed ? "Hide" : "Reveal"}
                      </button>
                      <button
                        className="settings-btn-secondary"
                        onClick={() => setRotateKeyModal(keyName)}
                      >
                        Rotate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notification Webhooks */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div>
                <h3>Notification Webhooks</h3>
                <p className="settings-card-sub">
                  Deliver SOC telemetry alerts to external HTTP webhooks.
                </p>
              </div>
              <span className="settings-status-pill status-active">Active</span>
            </div>

            <div className="settings-webhook-form">
              <div className="settings-form-group">
                <label className="settings-form-label">WEBHOOK NAME</label>
                <input
                  type="text"
                  className="settings-input-text"
                  value={webhook.name}
                  onChange={(e) => {
                    setWebhook({ ...webhook, name: e.target.value });
                    markDirty();
                  }}
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">ENDPOINT URL</label>
                <input
                  type="text"
                  className="settings-input-text text-monospace"
                  value={webhook.endpoint}
                  onChange={(e) => {
                    setWebhook({ ...webhook, endpoint: e.target.value });
                    markDirty();
                  }}
                />
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">TRIGGER EVENTS</label>
                <div className="settings-checkbox-row">
                  {Object.keys(webhook.events).map((evt) => (
                    <label key={evt} className="settings-checkbox-item">
                      <input
                        type="checkbox"
                        checked={webhook.events[evt]}
                        onChange={() => {
                          setWebhook({
                            ...webhook,
                            events: { ...webhook.events, [evt]: !webhook.events[evt] },
                          });
                          markDirty();
                        }}
                      />
                      <span>{evt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="settings-btn-action" onClick={handleTestWebhook}>
                Test Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 — NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="settings-tab-pane">
          {/* Alert Delivery Channels */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div>
                <h2>Alert Notifications</h2>
                <p className="settings-card-sub">
                  Configure how security alerts are delivered to analysts.
                </p>
              </div>
            </div>

            <div className="settings-rules-list">
              {Object.keys(notificationChannels).map((channel) => (
                <div key={channel} className="settings-rule-item">
                  <strong>{channel}</strong>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={notificationChannels[channel]}
                      onChange={() => {
                        setNotificationChannels((prev) => ({
                          ...prev,
                          [channel]: !prev[channel],
                        }));
                        markDirty();
                      }}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Severity Settings */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Alert Rules</h3>
            </div>

            <div className="settings-alert-rules-grid">
              {Object.keys(alertRules).map((sev) => (
                <div key={sev} className="settings-alert-rule-row">
                  <span className={`settings-sev-badge sev-${sev.toLowerCase()}`}>{sev}</span>
                  <select
                    className="settings-select"
                    value={alertRules[sev]}
                    onChange={(e) => {
                      setAlertRules({ ...alertRules, [sev]: e.target.value });
                      markDirty();
                    }}
                  >
                    <option value="Immediate notification">Immediate notification</option>
                    <option value="Grouped notification">Grouped notification</option>
                    <option value="Daily summary">Daily summary</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Quiet Hours</h3>
              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={quietHours.enabled}
                  onChange={() => {
                    setQuietHours({ ...quietHours, enabled: !quietHours.enabled });
                    markDirty();
                  }}
                />
                <span className="settings-slider" />
              </label>
            </div>

            {quietHours.enabled && (
              <div className="settings-quiet-row">
                <div>
                  <label className="settings-form-label">START TIME</label>
                  <input
                    type="time"
                    className="settings-input-text"
                    value={quietHours.start}
                    onChange={(e) => {
                      setQuietHours({ ...quietHours, start: e.target.value });
                      markDirty();
                    }}
                  />
                </div>
                <div>
                  <label className="settings-form-label">END TIME</label>
                  <input
                    type="time"
                    className="settings-input-text"
                    value={quietHours.end}
                    onChange={(e) => {
                      setQuietHours({ ...quietHours, end: e.target.value });
                      markDirty();
                    }}
                  />
                </div>
              </div>
            )}

            <p className="settings-card-sub margin-top-sm">
              <em>Exception: Critical alerts always bypass quiet hours.</em>
            </p>
          </div>
        </div>
      )}

      {/* TAB 4 — SECURITY */}
      {activeTab === "security" && (
        <div className="settings-tab-pane">
          {/* Security Controls */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Security Controls</h2>
            </div>

            <div className="settings-form-group">
              <label className="settings-form-label">SESSION TIMEOUT</label>
              <select
                className="settings-select"
                value={sessionTimeout}
                onChange={(e) => {
                  setSessionTimeout(e.target.value);
                  markDirty();
                }}
              >
                <option value="15 minutes">15 minutes</option>
                <option value="30 minutes">30 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="4 hours">4 hours</option>
                <option value="Never">Never</option>
              </select>
            </div>
          </div>

          {/* Authentication Settings */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Authentication Settings</h3>
            </div>

            <div className="settings-rule-item border-bottom-light">
              <div>
                <strong>Two-Factor Authentication (2FA)</strong>
                <span className="settings-status-pill status-active margin-left-sm">Enabled</span>
              </div>
              <button
                className="settings-btn-secondary"
                onClick={() => showToast("2FA management settings opened")}
              >
                Manage
              </button>
            </div>

            <div className="settings-rules-list">
              <div className="settings-rule-item">
                <span>Login Alerts</span>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={secToggles.loginAlerts}
                    onChange={() => {
                      setSecToggles({ ...secToggles, loginAlerts: !secToggles.loginAlerts });
                      markDirty();
                    }}
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              <div className="settings-rule-item">
                <span>New Device Alerts</span>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={secToggles.newDeviceAlerts}
                    onChange={() => {
                      setSecToggles({ ...secToggles, newDeviceAlerts: !secToggles.newDeviceAlerts });
                      markDirty();
                    }}
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              <div className="settings-rule-item">
                <span>Suspicious Login Detection</span>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={secToggles.suspiciousLogin}
                    onChange={() => {
                      setSecToggles({ ...secToggles, suspiciousLogin: !secToggles.suspiciousLogin });
                      markDirty();
                    }}
                  />
                  <span className="settings-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* API Access Control */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>API Access Control</h3>
            </div>

            <div className="settings-rules-list">
              <div className="settings-rule-item">
                <span>Allow API Access</span>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={secToggles.allowApiAccess}
                    onChange={() => {
                      setSecToggles({ ...secToggles, allowApiAccess: !secToggles.allowApiAccess });
                      markDirty();
                    }}
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              <div className="settings-rule-item">
                <span>Require API Key</span>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={secToggles.requireApiKey}
                    onChange={() => {
                      setSecToggles({ ...secToggles, requireApiKey: !secToggles.requireApiKey });
                      markDirty();
                    }}
                  />
                  <span className="settings-slider" />
                </label>
              </div>
            </div>

            <div className="settings-form-group margin-top-md">
              <label className="settings-form-label">RATE LIMIT</label>
              <select
                className="settings-select"
                value={rateLimit}
                onChange={(e) => {
                  setRateLimit(e.target.value);
                  markDirty();
                }}
              >
                <option value="100 requests/min">100 requests/min</option>
                <option value="500 requests/min">500 requests/min</option>
                <option value="1000 requests/min">1000 requests/min</option>
              </select>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-card settings-danger-card">
            <div className="settings-card-header">
              <h3 className="text-danger">Danger Zone</h3>
            </div>

            <div className="settings-danger-actions">
              <button
                className="settings-btn-danger"
                onClick={() => setDangerModalAction("Reset Detection Configuration")}
              >
                Reset Detection Configuration
              </button>
              <button
                className="settings-btn-danger"
                onClick={() => showToast("Threat Cache cleared")}
              >
                Clear Threat Cache
              </button>
              <button
                className="settings-btn-danger"
                onClick={() => showToast("API Keys revoked")}
              >
                Revoke All API Keys
              </button>
              <button
                className="settings-btn-danger"
                onClick={() => setDangerModalAction("Reset All Settings")}
              >
                Reset All Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5 — ANALYST PREFERENCES */}
      {activeTab === "preferences" && (
        <div className="settings-tab-pane">
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Analyst Preferences</h2>
            </div>

            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label className="settings-form-label">DISPLAY DENSITY</label>
                <select
                  className="settings-select"
                  value={density}
                  onChange={(e) => {
                    setDensity(e.target.value);
                    markDirty();
                  }}
                >
                  <option value="Compact">Compact</option>
                  <option value="Comfortable">Comfortable</option>
                  <option value="Spacious">Spacious</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">THEME</label>
                <select className="settings-select" disabled value="Dark">
                  <option value="Dark">Dark SOC Theme</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">TIMEZONE</label>
                <select
                  className="settings-select"
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    markDirty();
                  }}
                >
                  <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York (EST)">America/New_York (EST)</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">DATE FORMAT</label>
                <select
                  className="settings-select"
                  value={dateFormat}
                  onChange={(e) => {
                    setDateFormat(e.target.value);
                    markDirty();
                  }}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dashboard Widget Preferences */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Dashboard Preferences</h3>
            </div>

            <div className="settings-rules-list">
              {Object.keys(dashboardWidgets).map((widget) => (
                <div key={widget} className="settings-rule-item">
                  <span>{widget}</span>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={dashboardWidgets[widget]}
                      onChange={() => {
                        setDashboardWidgets((prev) => ({
                          ...prev,
                          [widget]: !prev[widget],
                        }));
                        markDirty();
                      }}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURATION STATUS SUMMARY (BOTTOM) */}
      <div className="settings-card settings-status-summary-card">
        <div className="settings-status-summary-grid">
          <div className="settings-summary-item">
            <span className="settings-summary-label">Detection Engine</span>
            <span className="settings-status-pill status-active">● Operational</span>
          </div>
          <div className="settings-summary-item">
            <span className="settings-summary-label">Threat Intelligence</span>
            <span className="settings-status-pill status-active">● 5 Connected</span>
          </div>
          <div className="settings-summary-item">
            <span className="settings-summary-label">Notifications</span>
            <span className="settings-status-pill status-active">● 3 Enabled</span>
          </div>
          <div className="settings-summary-item">
            <span className="settings-summary-label">Security</span>
            <span className="settings-status-pill status-active">● Protected</span>
          </div>
        </div>

        <div className="settings-last-updated">
          Last Configuration Update: <strong>{lastUpdated}</strong>
        </div>
      </div>

      {/* STICKY SAVE ACTION BAR */}
      <div className="settings-save-bar">
        <span className="settings-unsaved-text">
          {isDirty ? "Unsaved changes" : "No unsaved changes"}
        </span>

        <div className="settings-save-actions">
          <button
            className="settings-btn-secondary"
            onClick={handleDiscardChanges}
            disabled={!isDirty}
          >
            Discard Changes
          </button>
          <button
            className="settings-btn-primary"
            onClick={handleSaveConfig}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? (
              <>
                <span className="settings-spinner" /> Saving configuration...
              </>
            ) : (
              "SAVE CONFIGURATION"
            )}
          </button>
        </div>
      </div>

      {/* ROTATE API KEY CONFIRMATION MODAL */}
      {rotateKeyModal && (
        <div className="settings-modal-overlay" onClick={() => setRotateKeyModal(null)}>
          <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h3>Rotate API key?</h3>
              <button
                className="settings-modal-close"
                onClick={() => setRotateKeyModal(null)}
              >
                ✕
              </button>
            </div>
            <p className="settings-modal-body">
              Are you sure you want to rotate the credential for <strong>{rotateKeyModal}</strong>? The existing API key will be immediately revoked.
            </p>
            <div className="settings-modal-footer">
              <button
                className="settings-btn-secondary"
                onClick={() => setRotateKeyModal(null)}
              >
                Cancel
              </button>
              <button
                className="settings-btn-action"
                onClick={handleConfirmRotateKey}
              >
                Confirm Rotate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DANGER ACTION CONFIRMATION MODAL */}
      {dangerModalAction && (
        <div className="settings-modal-overlay" onClick={() => setDangerModalAction(null)}>
          <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h3 className="text-danger">{dangerModalAction}?</h3>
              <button
                className="settings-modal-close"
                onClick={() => setDangerModalAction(null)}
              >
                ✕
              </button>
            </div>
            <p className="settings-modal-body">
              Reset all detection rules and security configurations to recommended enterprise defaults?
            </p>
            <div className="settings-modal-footer">
              <button
                className="settings-btn-secondary"
                onClick={() => setDangerModalAction(null)}
              >
                Cancel
              </button>
              <button
                className="settings-btn-danger"
                onClick={handleConfirmDangerAction}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
