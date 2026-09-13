import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_URL = "https://emailforensic.onrender.com";


// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function SectionCard({ children, className = "" }) {
  return (
    <section
      className={`bg-white border border-[#dbe7f5] rounded-2xl shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}


function SectionHeader({ icon, title, description }) {
  return (
    <div className="px-5 py-5 border-b border-[#e5edf7]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#e8f1ff] flex items-center justify-center text-lg shrink-0">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-semibold text-[#12345b]">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-xs leading-5 text-[#6b7c93]">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


function InfoItem({
  label,
  value,
  mono = false,
  fullWidth = false,
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7b8da6]">
        {label}
      </p>

      <p
        className={`mt-1.5 text-sm text-[#233b5d] break-words ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value === null ||
        value === undefined ||
        value === ""
          ? "Not available"
          : String(value)}
      </p>
    </div>
  );
}


function StatusBadge({ value }) {
  const normalized = String(value || "")
    .toLowerCase()
    .trim();

  let classes =
    "bg-[#f4f7fb] text-[#63748a] border-[#dce5ef]";

  if (normalized === "pass") {
    classes =
      "bg-[#eaf7ef] text-[#188038] border-[#ccebd7]";
  }

  if (
    normalized === "fail" ||
    normalized === "softfail" ||
    normalized === "permerror" ||
    normalized === "temperror"
  ) {
    classes =
      "bg-[#fcebea] text-[#c5221f] border-[#f3c8c6]";
  }

  if (
    normalized === "neutral" ||
    normalized === "none"
  ) {
    classes =
      "bg-[#f4f7fb] text-[#63748a] border-[#dce5ef]";
  }

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full border text-[11px] font-semibold uppercase ${classes}`}
    >
      {value || "N/A"}
    </span>
  );
}


function BooleanBadge({ value }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fff0ef] border border-[#f5cecc] text-[#c5221f] text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#d93025]" />
        Detected
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#edf8f1] border border-[#cfe9d7] text-[#188038] text-[11px] font-semibold">
        <span>✓</span>
        No
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-[#53657d]">
      {String(value)}
    </span>
  );
}


function ScoreCircle({
  score,
  title,
  description,
  type = "threat",
}) {
  const numericScore = Math.min(
    Math.max(Number(score) || 0, 0),
    100
  );

  const radius = 43;
  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference -
    (numericScore / 100) * circumference;

  const isThreat = type === "threat";

  return (
    <div className="flex items-center gap-5">

      <div className="relative w-28 h-28 shrink-0">

        <svg
          viewBox="0 0 110 110"
          className="w-28 h-28 -rotate-90"
        >
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            strokeWidth="9"
            className="stroke-[#eaf1f9]"
          />

          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            className={
              isThreat
                ? "stroke-[#2563eb]"
                : "stroke-[#4f8fe8]"
            }
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#12345b]">
            {numericScore}
          </span>

          <span className="text-[9px] text-[#7b8da6]">
            / 100
          </span>
        </div>

      </div>

      <div>
        <p className="text-sm font-semibold text-[#183b67]">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#6b7c93]">
          {description}
        </p>
      </div>
    </div>
  );
}


function FeatureCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e1eaf4] bg-[#f9fbfe] p-4 hover:border-[#bfd5f2] transition">
      <p className="text-[11px] leading-4 text-[#71839b]">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-[#173b66]">
        {String(value ?? 0)}
      </p>
    </div>
  );
}


function AuthenticationCard({
  title,
  description,
  values,
}) {
  const list = Array.isArray(values)
    ? values
    : values
      ? [values]
      : ["none"];

  return (
    <div className="rounded-xl border border-[#dce7f4] bg-[#f9fbfe] p-4">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#173b66]">
            {title}
          </h3>

          <p className="mt-0.5 text-[11px] text-[#7b8da6]">
            {description}
          </p>
        </div>

        <div className="w-9 h-9 rounded-lg bg-[#e8f1ff] flex items-center justify-center text-sm">
          ✓
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {list.map((item, index) => (
          <StatusBadge
            key={`${item}-${index}`}
            value={item}
          />
        ))}
      </div>

    </div>
  );
}


function AnalysisRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-[#e3ebf5] bg-[#fbfcfe]">
      <span className="text-xs text-[#536981]">
        {label}
      </span>

      <BooleanBadge value={value} />
    </div>
  );
}


function NavigationCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
}) {
  return (
    <div className="group bg-white border border-[#dbe7f5] rounded-2xl p-5 hover:border-[#8db6eb] hover:shadow-md transition-all">

      <div className="flex items-start justify-between">

        <div className="w-11 h-11 rounded-xl bg-[#eaf2ff] flex items-center justify-center text-xl">
          {icon}
        </div>

        <span className="text-xl text-[#8aa0ba] group-hover:text-[#2563eb] transition">
          →
        </span>

      </div>

      <h3 className="mt-4 text-sm font-semibold text-[#173b66]">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#6b7c93]">
        {description}
      </p>

      <button
        onClick={onClick}
        className="
          mt-4
          px-3.5
          py-2
          rounded-lg
          bg-[#e8f1ff]
          border
          border-[#c7dbf5]
          text-[#2563eb]
          text-xs
          font-semibold
          hover:bg-[#dbe9fc]
          cursor-pointer
          transition
        "
      >
        {buttonText} →
      </button>

    </div>
  );
}


// ============================================================
// MAIN ANALYZER DASHBOARD
// ============================================================

export default function AnalyzerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const messageId = searchParams.get("message_id");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // FETCH ANALYSIS
  // ==========================================================

  const fetchAnalysis = async () => {
    if (!messageId) {
      setError("Message ID is missing.");
      setLoading(false);
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setError("Authentication token is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/gmail/analyze/${encodeURIComponent(
          messageId
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to fetch analyzer data."
        );
      }

      if (!data.success) {
        throw new Error(
          "Email analysis was unsuccessful."
        );
      }

      setResult(data);

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load email analysis."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAnalysis();
  }, [messageId]);


  // ==========================================================
  // DATA
  // ==========================================================

  const detection =
    result?.Detection_engine_data || {};

  const features =
    detection?.features || {};

  const ai =
    detection?.ai_analysis || {};

  const email =
    result?.email_data || {};

  const authentication =
    email?.authentication || {};

  const subjectAnalysis =
    ai?.subject_analysis || {};

  const bodyAnalysis =
    ai?.body_analysis || {};


  const riskLevel = String(
    ai?.risk_level || "unknown"
  ).toLowerCase();


  const riskInfo = useMemo(() => {
    if (riskLevel === "high") {
      return {
        label: "HIGH RISK",
        description:
          "Multiple suspicious characteristics were detected in this email.",
        icon: "⚠",
        bg: "bg-[#fff0ef]",
        border: "border-[#f4cbc8]",
        text: "text-[#c5221f]",
      };
    }

    if (riskLevel === "medium") {
      return {
        label: "MEDIUM RISK",
        description:
          "Suspicious characteristics were detected and further investigation is recommended.",
        icon: "!",
        bg: "bg-[#eef5ff]",
        border: "border-[#c7dbf5]",
        text: "text-[#2563eb]",
      };
    }

    if (riskLevel === "low") {
      return {
        label: "LOW RISK",
        description:
          "The analysis detected relatively few suspicious characteristics.",
        icon: "✓",
        bg: "bg-[#edf8f1]",
        border: "border-[#cce8d5]",
        text: "text-[#188038]",
      };
    }

    return {
      label: "UNKNOWN",
      description:
        "The backend did not return a recognized risk level.",
      icon: "?",
      bg: "bg-[#f4f7fb]",
      border: "border-[#dce5ef]",
      text: "text-[#63748a]",
    };
  }, [riskLevel]);


  const featureLabels = {
    url_count: "URLs detected",
    ip_url_count: "IP-based URLs",
    suspicious_tld_count: "Suspicious TLDs",
    long_url_count: "Long URLs",
    urgent_count: "Urgency indicators",
    credential_count: "Credential indicators",
    threat_count: "Threat indicators",
    reply_to_mismatch: "Reply-To mismatch",
    attachment_count: "Attachments",
    suspicious_attachment_count:
      "Suspicious attachments",
    text_length: "Text length",
    exclamation_count: "Exclamation marks",
  };


  const aiLabels = {
    urgency: "Urgency",
    threats: "Threats",
    financial_request: "Financial request",
    credential_request: "Credential request",
    unusual_language: "Unusual language",
    fear: "Fear",
    pressure: "Pressure",
    password_request: "Password request",
    otp_request: "OTP request",
    fake_verification: "Fake verification",
    impersonation: "Impersonation",
    social_engineering: "Social engineering",
    suspicious_instructions:
      "Suspicious instructions",
    phishing_indicator:
      "Phishing indicator",
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f8fd] flex items-center justify-center">

        <div className="text-center">

          <div className="relative w-16 h-16 mx-auto">

            <div className="absolute inset-0 rounded-full border-4 border-[#dceaff]" />

            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2563eb] animate-spin" />

            <div className="absolute inset-0 flex items-center justify-center">
              🛡️
            </div>

          </div>

          <h2 className="mt-5 text-sm font-semibold text-[#173b66]">
            Analyzing Email
          </h2>

          <p className="mt-1 text-xs text-[#71839b]">
            MailGuard is processing the forensic data...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f8fd] flex items-center justify-center px-4">

        <div className="w-full max-w-md bg-white border border-[#dbe7f5] rounded-2xl shadow-sm p-7 text-center">

          <div className="w-14 h-14 mx-auto rounded-full bg-[#eef5ff] flex items-center justify-center text-xl text-[#2563eb]">
            !
          </div>

          <h2 className="mt-4 text-lg font-semibold text-[#173b66]">
            Unable to load analysis
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#6b7c93]">
            {error}
          </p>

          <div className="mt-6 flex justify-center gap-3">

            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-lg border border-[#d5e0ec] bg-white text-sm font-medium text-[#405572] hover:bg-[#f5f8fc]"
            >
              ← Back
            </button>

            <button
              onClick={fetchAnalysis}
              className="px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8]"
            >
              Try Again
            </button>

          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#f4f8fd] text-[#173b66]">

      {/* ======================================================
          TOP NAVIGATION
      ======================================================= */}

      <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#dbe7f5]">

        <div className="h-full max-w-[1500px] mx-auto px-4 md:px-6 flex items-center">

          <button
            onClick={() => navigate(-1)}
            className="
              w-10
              h-10
              rounded-full
              flex
              items-center
              justify-center
              text-[#60758f]
              hover:bg-[#eef4fb]
              hover:text-[#2563eb]
              cursor-pointer
              transition
            "
            title="Back to email"
          >
            ←
          </button>


          <div className="ml-3 flex items-center gap-3">

            <div className="w-9 h-9 rounded-xl bg-[#2563eb] flex items-center justify-center text-white">
              🛡
            </div>

            <div>
              <h1 className="text-sm font-bold text-[#173b66]">
                MailGuard
              </h1>

              <p className="text-[10px] text-[#71839b]">
                Email Security Analyzer
              </p>
            </div>

          </div>


          <div className="ml-auto flex items-center gap-3">

            <div className="hidden sm:block text-right">
              <p className="text-[10px] uppercase tracking-wider text-[#8293a9]">
                Analysis ID
              </p>

              <p className="max-w-[220px] truncate font-mono text-[10px] text-[#526983]">
                {messageId}
              </p>
            </div>

            <button
              onClick={fetchAnalysis}
              className="
                px-3
                py-2
                rounded-lg
                border
                border-[#d4e1ef]
                bg-white
                text-xs
                font-semibold
                text-[#2563eb]
                hover:bg-[#f3f7fc]
                cursor-pointer
              "
            >
              ↻ Refresh
            </button>

          </div>

        </div>

      </header>


      {/* ======================================================
          MAIN
      ======================================================= */}

      <main className="max-w-[1500px] mx-auto px-4 md:px-6 py-7">


        {/* ====================================================
            TITLE
        ===================================================== */}

        <div className="mb-6">

          <div className="flex flex-wrap items-end justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">

                <span className="text-xs font-semibold text-[#2563eb]">
                  MAILGUARD
                </span>

                <span className="text-[#a7b6c8]">
                  /
                </span>

                <span className="text-xs text-[#71839b]">
                  Analyzer
                </span>

              </div>

              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#12345b]">
                Analyzer Dashboard
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7c93]">
                A complete forensic overview of the selected
                email, combining message metadata,
                authentication information and detection-engine
                results.
              </p>

            </div>

          </div>

        </div>


        {/* ====================================================
            RISK OVERVIEW
        ===================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">

          {/* Risk */}

          <SectionCard className="p-5">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7b8da6]">
                  Overall Assessment
                </p>

                <h3 className="mt-2 text-2xl font-bold text-[#173b66]">
                  {riskLevel}
                </h3>

              </div>

              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${riskInfo.bg} ${riskInfo.text}`}
              >
                {riskInfo.icon}
              </div>

            </div>

            <div
              className={`mt-4 inline-flex px-3 py-1.5 rounded-full border text-[11px] font-bold ${riskInfo.bg} ${riskInfo.border} ${riskInfo.text}`}
            >
              {riskInfo.label}
            </div>

            <p className="mt-3 text-xs leading-5 text-[#6b7c93]">
              {riskInfo.description}
            </p>

          </SectionCard>


          {/* Threat Score */}

          <SectionCard className="p-5">

            <ScoreCircle
              score={ai?.threat_score}
              title="Threat Score"
              description="Suspicious signals detected by the analysis engine."
              type="threat"
            />

          </SectionCard>


          {/* Safe Score */}

          <SectionCard className="p-5">

            <ScoreCircle
              score={ai?.safe_score}
              title="Safe Score"
              description="Signals that support a safer classification."
              type="safe"
            />

          </SectionCard>

        </div>


        {/* ====================================================
            EMAIL INFORMATION
        ===================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="✉"
            title="Email Information"
            description="Basic identity and routing information extracted from the email."
          />

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <InfoItem
              label="From"
              value={email?.from}
            />

            <InfoItem
              label="To"
              value={email?.to}
            />

            <InfoItem
              label="Date"
              value={email?.date}
            />

            <InfoItem
              label="Subject"
              value={email?.subject}
              fullWidth
            />

            <InfoItem
              label="CC"
              value={email?.cc}
            />

            <InfoItem
              label="BCC"
              value={email?.bcc}
            />

            <InfoItem
              label="Reply-To"
              value={email?.reply_to}
            />

            <InfoItem
              label="Return-Path"
              value={email?.return_path}
            />

            <InfoItem
              label="Message-ID"
              value={email?.message_id}
              mono
              fullWidth
            />

            <InfoItem
              label="Thread ID"
              value={email?.thread_id}
              mono
            />

            <InfoItem
              label="Content Type"
              value={email?.["Content-type"]}
            />

            <InfoItem
              label="MIME Version"
              value={email?.["mime-version"]}
            />

          </div>

        </SectionCard>


        {/* ====================================================
            AUTHENTICATION
        ===================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="✓"
            title="Email Authentication"
            description="Authentication results extracted from the email's Authentication-Results headers."
          />

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">

            <AuthenticationCard
              title="SPF"
              description="Sender Policy Framework"
              values={authentication?.spf}
            />

            <AuthenticationCard
              title="DKIM"
              description="DomainKeys Identified Mail"
              values={authentication?.dkim}
            />

            <AuthenticationCard
              title="DMARC"
              description="Domain-based Message Authentication"
              values={authentication?.dmarc}
            />

          </div>

        </SectionCard>


        {/* ====================================================
            IP + GEOLOCATION
        ===================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="🌐"
            title="Origin & Network Information"
            description="Information extracted from the message's Received headers and IP intelligence."
          />

          <div className="p-5">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <div className="lg:col-span-2 rounded-xl bg-[#edf4ff] border border-[#d3e3f7] p-5">

                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#6e829c]">
                  Origin IP
                </p>

                <p className="mt-2 text-lg font-mono font-semibold text-[#1e4f8f] break-all">
                  {email?.origin_ip ||
                    "Not detected"}
                </p>

                <p className="mt-2 text-xs text-[#71839b]">
                  Extracted from the email's Received headers.
                </p>

              </div>


              {email?.geolocation &&
              typeof email.geolocation === "object" ? (
                Object.entries(email.geolocation)
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <InfoItem
                      key={key}
                      label={key
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (c) =>
                          c.toUpperCase()
                        )}
                      value={
                        typeof value === "object"
                          ? JSON.stringify(value)
                          : value
                      }
                    />
                  ))
              ) : (
                <div className="lg:col-span-2 flex items-center justify-center rounded-xl border border-dashed border-[#d4e0ec] p-6">
                  <p className="text-xs text-[#7b8da6]">
                    No geolocation data available.
                  </p>
                </div>
              )}

            </div>

          </div>

        </SectionCard>


        {/* ====================================================
            DETECTION FEATURES
        ===================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="◈"
            title="Detection Features"
            description="Numerical features extracted from the email by the detection engine."
          />

          <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">

            {Object.entries(features).map(
              ([key, value]) => (
                <FeatureCard
                  key={key}
                  label={
                    featureLabels[key] ||
                    key
                      .replaceAll("_", " ")
                      .replace(/\b\w/g, (c) =>
                        c.toUpperCase()
                      )
                  }
                  value={value}
                />
              )
            )}

          </div>

        </SectionCard>


        {/* ====================================================
            AI SUBJECT ANALYSIS
        ===================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="AI"
            title="AI Subject Analysis"
            description="Indicators detected specifically within the email subject."
          />

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

            {Object.entries(subjectAnalysis).map(
              ([key, value]) => (
                <AnalysisRow
                  key={key}
                  label={
                    aiLabels[key] ||
                    key
                      .replaceAll("_", " ")
                      .replace(/\b\w/g, (c) =>
                        c.toUpperCase()
                      )
                  }
                  value={value}
                />
              )
            )}

          </div>

        </SectionCard>


        {/* ====================================================
            AI BODY ANALYSIS
        ===================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="AI"
            title="AI Body Analysis"
            description="Behavioral and linguistic indicators detected within the email body."
          />

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

            {Object.entries(bodyAnalysis).map(
              ([key, value]) => (
                <AnalysisRow
                  key={key}
                  label={
                    aiLabels[key] ||
                    key
                      .replaceAll("_", " ")
                      .replace(/\b\w/g, (c) =>
                        c.toUpperCase()
                      )
                  }
                  value={value}
                />
              )
            )}

          </div>

        </SectionCard>


        {/* ====================================================
            ANALYSIS REASONS
        ===================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="!"
            title="Why MailGuard Reached This Result"
            description="Explanations returned by the detection engine."
          />

          <div className="p-5">

            {Array.isArray(ai?.reasons) &&
            ai.reasons.length > 0 ? (
              <div className="space-y-3">

                {ai.reasons.map(
                  (reason, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-4 rounded-xl bg-[#f8fbff] border border-[#e0eaf5]"
                    >

                      <div className="w-7 h-7 rounded-full bg-[#e8f1ff] text-[#2563eb] flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </div>

                      <p className="text-sm leading-6 text-[#405572]">
                        {reason}
                      </p>

                    </div>
                  )
                )}

              </div>
            ) : (
              <p className="text-sm text-[#71839b]">
                No reasons were returned by the analysis engine.
              </p>
            )}

          </div>

        </SectionCard>


        {/* ====================================================
            RECEIVED HEADERS
        ===================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="↪"
            title="Received Headers"
            description="Mail-server routing information extracted from the message."
          />

          <div className="p-5">

            {Array.isArray(email?.received) &&
            email.received.length > 0 ? (
              <div className="space-y-3">

                {email.received.map(
                  (header, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-[#e0e9f3] bg-[#f9fbfe] p-4"
                    >
                      <div className="flex gap-3">

                        <span className="w-6 h-6 rounded-full bg-[#e8f1ff] text-[#2563eb] flex items-center justify-center text-[10px] font-bold shrink-0">
                          {index + 1}
                        </span>

                        <p className="text-xs leading-6 font-mono text-[#526983] break-all">
                          {header}
                        </p>

                      </div>
                    </div>
                  )
                )}

              </div>
            ) : (
              <p className="text-sm text-[#71839b]">
                No Received headers available.
              </p>
            )}

          </div>

        </SectionCard>


        {/* ====================================================
            URLS
        ===================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="🔗"
            title="Detected URLs"
            description="URLs extracted from the plain-text and HTML portions of the email."
          />

          <div className="p-5">

            <div className="flex items-center justify-between mb-4">

              <span className="text-xs text-[#71839b]">
                Total URLs
              </span>

              <span className="px-3 py-1 rounded-full bg-[#e8f1ff] border border-[#cbdcf2] text-[#2563eb] text-xs font-semibold">
                {Array.isArray(email?.urls)
                  ? email.urls.length
                  : 0}
              </span>

            </div>


            {Array.isArray(email?.urls) &&
            email.urls.length > 0 ? (
              <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">

                {email.urls.map(
                  (url, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-[#f9fbfe] border border-[#e2eaf3]"
                    >

                      <span className="text-[10px] text-[#8ba0b8] mt-1 shrink-0">
                        {index + 1}
                      </span>

                      <span className="text-xs font-mono text-[#315d91] break-all">
                        {url}
                      </span>

                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-[#60758f]">
                  No URLs detected.
                </p>
              </div>
            )}

          </div>

        </SectionCard>


        {/* ====================================================
            ATTACHMENTS
        ===================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="📎"
            title="Attachments"
            description="Files detected in the email."
          />

          <div className="p-5">

            {Array.isArray(email?.attachments) &&
            email.attachments.length > 0 ? (
              <div className="space-y-3">

                {email.attachments.map(
                  (attachment, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border border-[#e0e9f3] bg-[#f9fbfe]"
                    >

                      <div className="w-10 h-10 rounded-lg bg-[#e8f1ff] flex items-center justify-center text-lg shrink-0">
                        📄
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-semibold text-[#173b66] break-all">
                          {attachment?.filename ||
                            "Unnamed attachment"}
                        </p>

                        <p className="mt-1 text-xs text-[#71839b]">
                          {attachment?.content_type ||
                            "Unknown type"}
                        </p>

                      </div>

                      <div className="text-xs text-[#60758f]">
                        {attachment?.size
                          ? `${attachment.size} bytes`
                          : "Size unavailable"}
                      </div>

                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="rounded-xl bg-[#f8fbff] border border-[#e0eaf5] p-7 text-center">

                <div className="text-2xl">
                  📎
                </div>

                <p className="mt-2 text-sm font-medium text-[#405572]">
                  No attachments detected
                </p>

                <p className="mt-1 text-xs text-[#7b8da6]">
                  This email does not contain any detected attachments.
                </p>

              </div>
            )}

          </div>

        </SectionCard>


        {/* ====================================================
            OTHER SECURITY TOOLS
        ===================================================== */}

        <div className="mt-8 mb-4">

          <h2 className="text-lg font-bold text-[#12345b]">
            Continue Security Analysis
          </h2>

          <p className="mt-1 text-xs leading-5 text-[#6b7c93]">
            Investigate this email further using MailGuard's
            specialized security analysis tools.
          </p>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* PHISHING */}

          <NavigationCard
            icon="🎣"
            title="Phishing Detection"
            description="Analyze suspicious links, impersonation, credential requests and other phishing indicators."
            buttonText="Open Phishing Detection"
            onClick={() =>
              navigate(
                `/phishing?message_id=${encodeURIComponent(
                  messageId
                )}`
              )
            }
          />


          {/* SOCIAL ENGINEERING */}

          <NavigationCard
            icon="👥"
            title="Social Engineering"
            description="Investigate manipulation tactics such as urgency, fear, pressure and impersonation."
            buttonText="Open Social Engineering"
            onClick={() =>
              navigate(
                `/social?message_id=${encodeURIComponent(
                  messageId
                )}`
              )
            }
          />


          {/* IP TRACING */}

          <NavigationCard
            icon="🌐"
            title="IP Tracing"
            description="Investigate the originating IP address, network information and geographic intelligence."
            buttonText="Open IP Tracing"
            onClick={() =>
              navigate(
                `/ip-tracing?message_id=${encodeURIComponent(
                  messageId
                )}`
              )
            }
          />

        </div>


        {/* ====================================================
            BOTTOM NAVIGATION
        ===================================================== */}

        <div className="mt-7 flex flex-wrap gap-3">

          <button
            onClick={() => navigate(-1)}
            className="
              px-4
              py-2.5
              rounded-lg
              bg-white
              border
              border-[#d5e1ee]
              text-sm
              font-semibold
              text-[#526983]
              hover:bg-[#f4f8fd]
              cursor-pointer
            "
          >
            ← Back to Email
          </button>

          <button
            onClick={() =>
              navigate(
                `/phishing?message_id=${encodeURIComponent(
                  messageId
                )}`
              )
            }
            className="
              px-4
              py-2.5
              rounded-lg
              bg-[#2563eb]
              text-white
              text-sm
              font-semibold
              hover:bg-[#1d4ed8]
              cursor-pointer
            "
          >
            Continue Investigation →
          </button>

        </div>


        {/* ====================================================
            FOOTER
        ===================================================== */}

        <div className="mt-10 pb-5 text-center">

          <p className="text-[11px] text-[#91a1b5]">
            MailGuard • Email Forensic Security
          </p>

          <p className="mt-1 text-[10px] text-[#a3b0c0]">
            Analysis generated from the connected Gmail message.
          </p>

        </div>

      </main>

    </div>
  );
}