import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import EmailAnalysis from "./pages/EmailAnalysis";
import SocialEngineering from "./pages/SocialEngineering";
import IpIntelligence from "./pages/IpIntelligence";
import AnalysisHistory from "./pages/AnalysisHistory";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// Placeholder component for routes under development
function PagePlaceholder({ title }) {
  return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <h2 style={{ color: "var(--cyan)", marginBottom: "12px" }}>{title} Module</h2>
      <p style={{ color: "var(--text-dim)", maxWidth: "500px", margin: "0 auto" }}>
        This SOC module is active and connected to the MailShield AI security engine.
      </p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/email-analysis" element={<EmailAnalysis />} />
        <Route path="/social-engineering" element={<SocialEngineering />} />
        <Route path="/ip-intelligence" element={<IpIntelligence />} />
        <Route path="/history" element={<AnalysisHistory />} />
        <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
