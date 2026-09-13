import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import EmailDetail from "./pages/EmailDetails";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/email/:messageId" element={<EmailDetail />} />
            <Route
        path="/privacy-policy"
        element={<PrivacyPolicy/>}
      />

      <Route
        path="/terms"
        element={<Terms />}
      />

      {/* <Route path="/phishing" element={<Phishing />} />
      <Route path="/social" element={<Social />} />
      <Route path="/ip-tracing" element={<IPTracing />} />
      <Route path="/analyzer" element={<Analyzer />} /> */}
    </Routes>
  );
}

export default App;