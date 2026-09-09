import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import EmailAnalysis from "./pages/EmailAnalysis";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/email-analysis" element={<EmailAnalysis />} />
      </Routes>
      // <EmailAnalysis/>

     
  );
}

export default App;
