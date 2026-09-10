import { useState } from "react";
import "./SocialEngineering.css";

// Pre-configured analysis benchmark samples based on python Email AI Analysis output
const SAMPLE_ANALYSES = [
  {
    id: "hr-internship-phishing",
    title: "HR Internship Offer (Impersonation & Verification)",
    rawText: `From: hr-recruit@enerzcloud-careers-portal.com
Subject: Offer Letter - HTML/CSS Developer Internship Program

Dear Candidate,
We are delighted to share that you have cleared our selection phase for the HTML/CSS Developer Internship Program.
To finalize your onboarding process, please click the secure link below to confirm your acceptance and submit a screenshot of your identity verification.

Best Regards,
Enerzcloud Innovations Human Resources Team`,
    result: {
      subjectAnalysis: {
        urgency: false,
        threats: false,
        financial_request: false,
        credential_request: false,
        unusual_language: false,
      },
      bodyAnalysis: {
        urgency: false,
        fear: false,
        pressure: false,
        financial_request: false,
        password_request: false,
        otp_request: false,
        fake_verification: true,
        impersonation: true,
        social_engineering: true,
        suspicious_instructions: true,
        phishing_instructions: true,
      },
      riskAssessment: {
        threat_score: 58,
        safe_score: 42,
        risk_level: "medium",
        social_engineering: true,
      },
      reasons: [
        "Email pretends to be from HR (impersonation).",
        "Requests clicking a tracking link and sending a screenshot of a confirmation page (suspicious instructions, fake verification).",
        "Uses a legitimate-sounding internship offer to lure the recipient (social engineering).",
        "Presence of a tracking URL and request for personal onboarding details (phishing indicator).",
      ],
      urgency: false,
      authority_impersonation: true,
      fear: false,
      reward: false,
      secrecy: false,
      detected: true,
      social_engineering_score: 58,
      risk_impact: "Medium",
      techniques: ["Authority Impersonation", "Fake Verification", "Phishing Instructions"],
      explanation:
        "The email pretends to be from Enerzcloud Innovations HR to lure the recipient into providing personal identity details via a tracking URL.",
      summary:
        "Medium-risk credential harvesting campaign spoofing corporate HR authority with fake onboarding instructions.",
      evidence: [
        "Best Regards, Enerzcloud Innovations Human Resources Team",
        "Submit a screenshot of your identity verification",
      ],
      recommendation:
        "Do not click the tracking link; verify the internship offer through official company channels and report the email as phishing.",
    },
  },
  {
    id: "eyantra-urgency-reward",
    title: "e-Yantra Event (Urgency & Referral Reward)",
    rawText: `Subject: e-Yantra Robotics Competition 2026 - Registration Open!
From: info@e-yantra-events-promo.org

Dear Student,
Registration for the e-Yantra Robotics Competition 2026 is officially open!
Registration Deadline: 25 September 2026, 11:59 PM.
Early Bird Discount (20%): Valid till 11 September 2026, 11:59 PM.
Use the referral code EARLY26 to get an additional 10% discount.
Click here to claim your spot immediately!`,
    result: {
      subjectAnalysis: {
        urgency: true,
        threats: false,
        financial_request: true,
        credential_request: false,
        unusual_language: false,
      },
      bodyAnalysis: {
        urgency: true,
        fear: false,
        pressure: true,
        financial_request: true,
        password_request: false,
        otp_request: false,
        fake_verification: false,
        impersonation: false,
        social_engineering: true,
        suspicious_instructions: true,
        phishing_instructions: false,
      },
      riskAssessment: {
        threat_score: 65,
        safe_score: 35,
        risk_level: "medium",
        social_engineering: true,
      },
      reasons: [
        "Uses strict deadline pressure to rush registration decisions (urgency).",
        "Offers financial discounts to incentivize immediate payment (financial request).",
        "Redirects user to unverified registration forms (suspicious instructions).",
      ],
      urgency: true,
      authority_impersonation: false,
      fear: false,
      reward: true,
      secrecy: false,
      detected: true,
      social_engineering_score: 65,
      risk_impact: "Medium",
      techniques: ["Urgency", "Reward", "Pressure"],
      explanation:
        "The email uses deadline pressure and discount incentives to persuade recipients to register quickly.",
      summary:
        "Promotional phishing lure leveraging limited-time referral discounts to bypass recipient scrutiny.",
      evidence: [
        "Registration Deadline: 25 September 2026, 11:59 PM",
        "Early Bird Discount (20%): Valid till 11 September 2026",
      ],
      recommendation:
        "Verify the sender's domain before clicking; confirm the event on the official website.",
    },
  },
  {
    id: "bank-account-suspension",
    title: "Urgent Security Alert (Fear & OTP Harvest)",
    rawText: `From: security-alert@bank-verify-online.com
Subject: URGENT: Account Suspended - Action Required

Dear Customer,
We detected unauthorized login attempts. Your banking account has been temporarily suspended.
Please enter your password and OTP within 2 hours to confirm your identity or your account will be deleted.`,
    result: {
      subjectAnalysis: {
        urgency: true,
        threats: true,
        financial_request: false,
        credential_request: true,
        unusual_language: true,
      },
      bodyAnalysis: {
        urgency: true,
        fear: true,
        pressure: true,
        financial_request: false,
        password_request: true,
        otp_request: true,
        fake_verification: true,
        impersonation: true,
        social_engineering: true,
        suspicious_instructions: true,
        phishing_instructions: true,
      },
      riskAssessment: {
        threat_score: 95,
        safe_score: 5,
        risk_level: "high",
        social_engineering: true,
      },
      reasons: [
        "Explicit request for account password and OTP token (credential request).",
        "Threatens permanent account deletion within 2 hours (fear & coercion).",
        "Impersonates banking security operations (authority impersonation).",
      ],
      urgency: true,
      authority_impersonation: true,
      fear: true,
      reward: false,
      secrecy: true,
      detected: true,
      social_engineering_score: 95,
      risk_impact: "Critical",
      techniques: ["Fear", "Urgency", "OTP Harvest", "Credential Request"],
      explanation:
        "Coercive credential theft campaign harvesting banking credentials via fake security suspension notices.",
      summary:
        "Critical phishing attack using fear tactics to hijack user banking credentials.",
      evidence: [
        "URGENT: Account Suspended - Action Required",
        "Please enter your password and OTP within 2 hours",
      ],
      recommendation:
        "Do not click links or enter passwords. Report to Security Operations immediately.",
    },
  },
];

export default function SocialEngineering() {
  const [selectedSampleId, setSelectedSampleId] = useState(SAMPLE_ANALYSES[0].id);
  const [emailContent, setEmailContent] = useState(SAMPLE_ANALYSES[0].rawText);
  const [currentAnalysis, setCurrentAnalysis] = useState(SAMPLE_ANALYSES[0].result);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all", "subject", "body", "reasons"

  // Handle sample selection
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setEmailContent(sample.rawText);
    setCurrentAnalysis(sample.result);
  };

  // Run dynamic analysis
  const handleRunAnalysis = () => {
    if (!emailContent.trim()) return;

    setIsScanning(true);
    setTimeout(() => {
      const matched = SAMPLE_ANALYSES.find(
        (s) => s.rawText.trim() === emailContent.trim()
      );

      if (matched) {
        setCurrentAnalysis(matched.result);
      } else {
        const textLower = emailContent.toLowerCase();

        const hasUrgency =
          textLower.includes("urgent") ||
          textLower.includes("deadline") ||
          textLower.includes("immediately") ||
          textLower.includes("24 hours");
        const hasImpersonation =
          textLower.includes("hr") ||
          textLower.includes("team") ||
          textLower.includes("official") ||
          textLower.includes("security");
        const hasFear =
          textLower.includes("suspend") ||
          textLower.includes("terminate") ||
          textLower.includes("unauthorized");
        const hasFakeVerification =
          textLower.includes("verify") ||
          textLower.includes("screenshot") ||
          textLower.includes("confirm") ||
          textLower.includes("link");
        const hasPhishing =
          textLower.includes("link") ||
          textLower.includes("click") ||
          textLower.includes("form");
        const hasFinancial =
          textLower.includes("payment") ||
          textLower.includes("discount") ||
          textLower.includes("money") ||
          textLower.includes("fee");
        const hasCredential =
          textLower.includes("password") ||
          textLower.includes("otp") ||
          textLower.includes("login");

        const subjectAnalysis = {
          urgency: hasUrgency,
          threats: hasFear,
          financial_request: hasFinancial,
          credential_request: hasCredential,
          unusual_language: false,
        };

        const bodyAnalysis = {
          urgency: hasUrgency,
          fear: hasFear,
          pressure: hasUrgency || hasFear,
          financial_request: hasFinancial,
          password_request: textLower.includes("password"),
          otp_request: textLower.includes("otp"),
          fake_verification: hasFakeVerification,
          impersonation: hasImpersonation,
          social_engineering: true,
          suspicious_instructions: hasPhishing || hasFakeVerification,
          phishing_instructions: hasPhishing,
        };

        const detectedCount =
          Object.values(subjectAnalysis).filter(Boolean).length +
          Object.values(bodyAnalysis).filter(Boolean).length;

        const threatScore = Math.min(98, Math.max(35, detectedCount * 12 + 30));
        const safeScore = 100 - threatScore;

        const riskLevel =
          threatScore >= 80 ? "high" : threatScore >= 50 ? "medium" : "low";

        const reasons = [];
        if (hasImpersonation)
          reasons.push("Email pretends to be from official department (impersonation).");
        if (hasFakeVerification)
          reasons.push(
            "Requests clicking link or submitting verification proof (suspicious instructions, fake verification)."
          );
        if (hasUrgency)
          reasons.push("Applies artificial time pressure to rush recipient response.");
        if (hasPhishing)
          reasons.push("Contains direct links to external destination (phishing indicator).");
        if (reasons.length === 0)
          reasons.push("Uses persuasive language pattern to influence recipient actions.");

        setCurrentAnalysis({
          subjectAnalysis,
          bodyAnalysis,
          riskAssessment: {
            threat_score: threatScore,
            safe_score: safeScore,
            risk_level: riskLevel,
            social_engineering: true,
          },
          reasons,
          urgency: hasUrgency,
          authority_impersonation: hasImpersonation,
          fear: hasFear,
          reward: hasFinancial,
          secrecy: false,
          detected: true,
          social_engineering_score: threatScore,
          risk_impact: riskLevel.toUpperCase(),
          techniques: ["Social Engineering", "Fake Verification"],
          explanation:
            "Automated multi-layer analysis flagged subject and body behavioral indicators.",
          summary: "Custom email analysis confirmed Social Engineering threat indicators.",
          evidence: emailContent
            .split("\n")
            .filter((l) => l.trim().length > 10)
            .slice(0, 3),
          recommendation:
            "Exercise caution. Verify headers and avoid clicking unverified links.",
        });
      }
      setIsScanning(false);
    }, 500);
  };

  const threatScore = currentAnalysis.riskAssessment?.threat_score ?? 58;
  const safeScore = currentAnalysis.riskAssessment?.safe_score ?? 42;
  const riskLevel = currentAnalysis.riskAssessment?.risk_level ?? "medium";
  const isSocialEngineering = currentAnalysis.riskAssessment?.social_engineering ?? true;

  return (
    <div className="social-engineering-page">
      {/* Header Banner */}
      <div className="se-banner">
        <div className="se-banner-text">
          <span className="se-badge-pill">EMAIL AI ANALYSIS ENGINE</span>
          <h1>Email Threat & Social Engineering Detector</h1>
          <p>
            Comprehensive multi-vector forensic inspection of email subject lines, body text,
            psychological persuasion triggers, and threat risk scoring.
          </p>
        </div>
        <div className="se-engine-badge">
          <span className="se-pulse-dot" />
          AI ENGINE ACTIVE
        </div>
      </div>

      {/* Preset Selector & Text Input */}
      <div className="se-card se-input-card">
        <div className="se-card-header">
          <div className="se-title-group">
            <span className="se-step">01</span>
            <div>
              <h3>Email Payload Inspection</h3>
              <p className="se-subtext">Select benchmark output samples or paste raw email text</p>
            </div>
          </div>

          <div className="se-sample-buttons">
            <span className="se-label-text">SAMPLES:</span>
            {SAMPLE_ANALYSES.map((sample, idx) => (
              <button
                key={sample.id}
                className={`se-sample-btn ${selectedSampleId === sample.id ? "active" : ""}`}
                onClick={() => handleSelectSample(sample)}
              >
                Sample {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="se-input-body">
          <textarea
            className="se-textarea"
            rows={6}
            value={emailContent}
            onChange={(e) => {
              setEmailContent(e.target.value);
              setSelectedSampleId(null);
            }}
            placeholder="Paste complete email headers and body here..."
          />
          <div className="se-input-footer">
            <span className="se-char-count">{emailContent.length} characters</span>
            <button className="se-analyze-btn" onClick={handleRunAnalysis} disabled={isScanning}>
              {isScanning ? (
                <>
                  <span className="se-spinner" /> ANALYZING EMAIL...
                </>
              ) : (
                <>
                  <span>RUN EMAIL AI ANALYSIS</span>
                  <span className="se-btn-arrow">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Risk Assessment Top Summary Panel */}
      <div className="se-card se-risk-summary-card">
        <div className="se-card-header">
          <div className="se-header-left">
            <h3>Risk Assessment & Threat Scores</h3>
            <span className="se-subtext">Overall Threat vs Safe Score Distribution</span>
          </div>

          <div className="se-header-right">
            <span className="se-se-flag-badge">
              SOCIAL ENGINEERING: <strong className="flag-true">{isSocialEngineering ? "TRUE" : "FALSE"}</strong>
            </span>
          </div>
        </div>

        <div className="se-risk-grid">
          {/* Threat Score Box */}
          <div className="se-score-box threat">
            <span className="se-score-title">THREAT SCORE</span>
            <div className="se-score-val-wrap">
              <span className="se-score-big threat">{threatScore}</span>
              <span className="se-score-max">/ 100</span>
            </div>
            <div className="se-score-bar-bg">
              <div className="se-score-bar-fill threat" style={{ width: `${threatScore}%` }} />
            </div>
          </div>

          {/* Safe Score Box */}
          <div className="se-score-box safe">
            <span className="se-score-title">SAFE SCORE</span>
            <div className="se-score-val-wrap">
              <span className="se-score-big safe">{safeScore}</span>
              <span className="se-score-max">/ 100</span>
            </div>
            <div className="se-score-bar-bg">
              <div className="se-score-bar-fill safe" style={{ width: `${safeScore}%` }} />
            </div>
          </div>

          {/* Risk Level Badge */}
          <div className="se-score-box level">
            <span className="se-score-title">RISK LEVEL</span>
            <span className={`se-risk-pill level-${riskLevel.toLowerCase()}`}>
              {riskLevel.toUpperCase()}
            </span>
            <small className="se-risk-note">
              {riskLevel === "high" || riskLevel === "critical"
                ? "Immediate Isolation Recommended"
                : "Phishing Risk Present"}
            </small>
          </div>
        </div>
      </div>

      {/* Dual Analysis Grids: Subject & Body Analysis */}
      <div className="se-analysis-tables-grid">
        {/* Subject Analysis Table */}
        <div className="se-card se-table-card">
          <div className="se-card-header">
            <h3>Subject Line Analysis</h3>
            <span className="se-subtext">5 Header Vectors</span>
          </div>

          <div className="se-vector-rows">
            {Object.entries(currentAnalysis.subjectAnalysis || {}).map(([key, val]) => (
              <div key={key} className={`se-vector-row ${val ? "flagged" : "clear"}`}>
                <div className="se-row-title">
                  <span className="se-row-bullet">{val ? "🚨" : "✓"}</span>
                  <span>{key.replace(/_/g, " ").toUpperCase()}</span>
                </div>
                <span className={`se-bool-pill ${val ? "true" : "false"}`}>
                  {val ? "True" : "False"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Body Analysis Table */}
        <div className="se-card se-table-card">
          <div className="se-card-header">
            <h3>Body Content Analysis</h3>
            <span className="se-subtext">11 Payload Vectors</span>
          </div>

          <div className="se-vector-rows-scroll">
            {Object.entries(currentAnalysis.bodyAnalysis || {}).map(([key, val]) => (
              <div key={key} className={`se-vector-row ${val ? "flagged" : "clear"}`}>
                <div className="se-row-title">
                  <span className="se-row-bullet">{val ? "🚨" : "✓"}</span>
                  <span>{key.replace(/_/g, " ").toUpperCase()}</span>
                </div>
                <span className={`se-bool-pill ${val ? "true" : "false"}`}>
                  {val ? "True" : "False"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Threat Reasons & Mitigations */}
      <div className="se-card se-reasons-card">
        <div className="se-card-header">
          <h3>Identified Threat Indicators & Reasons</h3>
          <span className="se-subtext">Automated Forensic Findings</span>
        </div>

        <div className="se-reasons-list">
          {(currentAnalysis.reasons || []).map((reason, index) => (
            <div key={index} className="se-reason-item">
              <span className="se-reason-bullet">•</span>
              <p>{reason}</p>
            </div>
          ))}
        </div>

        <div className="se-mitigation-footer">
          <div className="se-mitigation-icon">🛡️</div>
          <div>
            <strong>SOC Recommended Action</strong>
            <p>{currentAnalysis.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
