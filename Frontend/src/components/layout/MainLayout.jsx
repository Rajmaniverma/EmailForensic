import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { NAV_ITEMS, NOTIFICATIONS } from "../../constants/navigation";
import "../../pages/Dashboard.css";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const location = useLocation();

  // Close notifications dropdown on outside click or Escape key
  useEffect(() => {
    if (!notifOpen) return;

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setNotifOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notifOpen]);

  // Close mobile sidebar drawer on Escape key or route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  // Helper to determine page title based on current route
  const getPageHeader = () => {
    switch (location.pathname) {
      case "/email-analysis":
        return {
          eyebrow: "EMAIL FORENSICS / ANALYSIS",
          title: "Email Analysis",
          subtitle: "Analyze suspicious emails and identify potential phishing, spoofing and malicious indicators",
        };
      case "/social-engineering":
        return {
          eyebrow: "BEHAVIORAL THREAT DETECTION",
          title: "Social Engineering Analysis",
          subtitle: "Inspect urgency triggers, authority impersonation, coercion, and psychological manipulation vectors",
        };
      case "/ip-intelligence":
        return {
          eyebrow: "NETWORK GEOLOCATION & CARRIER TELEMETRY",
          title: "IP Intelligence & Geolocation",
          subtitle: "Inspect geographic coordinates, ISP/ASN ownership, proxy status, and live interactive map location",
        };
      case "/history":
        return {
          eyebrow: "FORENSIC LOGS",
          title: "Analysis History",
          subtitle: "Review historical email scan records and threat telemetry",
        };
      case "/threat-intelligence":
        return {
          eyebrow: "THREAT DATABASE",
          title: "Threat Intelligence",
          subtitle: "Real-time threat feeds, malware signatures and IOC database",
        };
      case "/reports":
        return {
          eyebrow: "SECURITY REPORTS",
          title: "Executive Reports",
          subtitle: "Generate and export SOC security metrics and compliance reports",
        };
      case "/settings":
        return {
          eyebrow: "SYSTEM CONFIGURATION",
          title: "Settings & Integrations",
          subtitle: "Manage detection rules, API keys and notification webhooks",
        };
      case "/":
      default:
        return {
          eyebrow: "SECURITY OPERATIONS CENTER",
          title: "Security Dashboard",
          subtitle: "Monitor and analyze suspicious email activity",
        };
    }
  };

  const headerInfo = getPageHeader();

  return (
    <div className={`dashboard ${sidebarOpen ? "sidebar-open" : ""}`}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark">◈</span> MAIL<span>SHIELD</span> AI
        </div>

        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span className="status-dot" />
            SYSTEM ONLINE
          </div>

          <div className="profile-box">
            <div className="avatar">SA</div>
            <div className="profile-meta">
              <strong>Security Analyst</strong>
              <small>SOC Analyst</small>
            </div>
            <button className="logout-btn" aria-label="Log out">
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Topbar Header */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((v) => !v)}
            >
              ☰
            </button>
            <div>
              <p className="eyebrow">{headerInfo.eyebrow}</p>
              <h1>{headerInfo.title}</h1>
              <p className="subtitle">{headerInfo.subtitle}</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="text"
                placeholder="Search analyses, senders..."
                aria-label="Search"
              />
            </div>

            <div className="notif-wrap" ref={notifRef}>
              <button
                className="icon-btn"
                aria-label="Notifications"
                aria-haspopup="true"
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((v) => !v)}
              >
                🔔
                <span className="notif-dot" />
              </button>

              {notifOpen && (
                <div className="notif-dropdown" role="menu">
                  <p className="notif-heading">Notifications</p>
                  {NOTIFICATIONS.map((n) => (
                    <div className="notif-item" key={n.title}>
                      <span className={`notif-tag tone-${n.tone}`} />
                      <div>
                        <strong>{n.title}</strong>
                        <small>{n.time}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="user-box">
              <div className="avatar">SA</div>
              <div>
                <strong>Security Analyst</strong>
                <small>SOC Analyst</small>
              </div>
            </div>
          </div>
        </header>

        {/* Page View Output */}
        <Outlet />
      </main>
    </div>
  );
}
