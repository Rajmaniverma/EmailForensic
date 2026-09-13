import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_URL = "https://emailforensic.onrender.com";


// ============================================================
// HELPER COMPONENTS
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


function SectionHeader({
  icon,
  title,
  description,
}) {
  return (
    <div className="px-5 py-5 border-b border-[#e4edf7]">
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


function ScoreBar({
  label,
  score,
  description,
  danger = false,
}) {
  const value = Math.min(
    Math.max(Number(score) || 0, 0),
    100
  );

  return (
    <div>

      <div className="flex items-end justify-between gap-3">

        <div>
          <p className="text-sm font-semibold text-[#173b66]">
            {label}
          </p>

          <p className="mt-1 text-xs text-[#71839b]">
            {description}
          </p>
        </div>

        <div className="text-right">
          <span
            className={`text-2xl font-bold ${
              danger
                ? "text-[#2563eb]"
                : "text-[#4f7fba]"
            }`}
          >
            {value}
          </span>

          <span className="text-xs text-[#8193aa]">
            /100
          </span>
        </div>

      </div>

      <div className="mt-3 h-3 rounded-full bg-[#edf2f8] overflow-hidden">

        <div
          className={`h-full rounded-full transition-all duration-700 ${
            danger
              ? "bg-[#2563eb]"
              : "bg-[#7da6dc]"
          }`}
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}


function FeatureCard({
  label,
  value,
  type = "normal",
}) {
  let valueClass = "text-[#173b66]";

  if (type === "danger" && Number(value) > 0) {
    valueClass = "text-[#2563eb]";
  }

  return (
    <div className="rounded-xl border border-[#e1eaf4] bg-[#f9fbfe] p-4 hover:border-[#bfd5f2] transition">

      <p className="text-[11px] leading-4 text-[#71839b]">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClass}`}
      >
        {String(value ?? 0)}
      </p>

    </div>
  );
}


function BooleanBadge({ value }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eef5ff] border border-[#c8dcf5] text-[#2563eb] text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
        Detected
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#edf8f1] border border-[#cce8d5] text-[#188038] text-[11px] font-semibold">
        ✓ No
      </span>
    );
  }

  return (
    <span className="text-xs font-semibold text-[#526983]">
      {String(value)}
    </span>
  );
}


function AnalysisRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-[#e2eaf4] bg-[#fbfcfe]">

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

        <span className="text-xl text-[#8ba0b8] group-hover:text-[#2563eb] transition">
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
// MAIN PAGE
// ============================================================

export default function PhishingPage() {

  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const messageId =
    searchParams.get("message_id");

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // FETCH PHISHING ANALYSIS
  // ==========================================================

  const fetchPhishingAnalysis =
    async () => {

      if (!messageId) {
        setError(
          "Message ID is missing."
        );

        setLoading(false);

        return;
      }

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        setError(
          "Authentication token is missing."
        );

        setLoading(false);

        return;
      }

      try {

        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/gmail/Phising/${encodeURIComponent(
              messageId
            )}`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();
        console.log("the phising data is ",data)
        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Failed to fetch phishing analysis."
          );
        }

        if (data?.success === false) {
          throw new Error(
            "Phishing analysis failed."
          );
        }

        setResult(data);

      } catch (err) {

        console.error(
          "Phishing analysis error:",
          err
        );

        setError(
          err.message ||
            "Unable to load phishing analysis."
        );

      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // LOAD
  // ==========================================================

  useEffect(() => {

    fetchPhishingAnalysis();

  }, [messageId]);


  // ==========================================================
  // GET DATA
  // ==========================================================

  /*
    Expected backend:

    {
      features: {...},
      prediction: 0,
      phishing_score: 82.5,
      legitimate_score: 17.5,
      explanation: ...,
      ai_analysis: {...}
    }
  */

  const features =
    result?.features || {};

  const phishingScore =
    Number(
      result?.phishing_score ?? 0
    );

  const legitimateScore =
    Number(
      result?.legitimate_score ?? 0
    );

  const prediction =
    result?.prediction;


  const aiAnalysis =
    result?.ai_analysis || {};


  // ==========================================================
  // PHISHING VERDICT
  // ==========================================================

  const verdict = useMemo(() => {

    if (
      phishingScore >
      legitimateScore
    ) {

      if (phishingScore >= 70) {
        return {
          title: "High Phishing Risk",
          description:
            "The email contains strong indicators associated with phishing activity.",
          badge: "HIGH RISK",
          bg: "bg-[#eef5ff]",
          border:
            "border-[#c6daf4]",
          text: "text-[#1d4ed8]",
          icon: "⚠",
        };
      }

      if (phishingScore >= 40) {
        return {
          title: "Suspicious Email",
          description:
            "The email contains characteristics that may indicate phishing activity.",
          badge: "SUSPICIOUS",
          bg: "bg-[#f0f6ff]",
          border:
            "border-[#cddff5]",
          text: "text-[#2563eb]",
          icon: "!",
        };
      }

      return {
        title: "Potential Phishing",
        description:
          "Some phishing indicators were detected in the email.",
        badge: "POTENTIAL RISK",
        bg: "bg-[#f4f8fd]",
        border:
          "border-[#dbe7f5]",
        text: "text-[#356aa3]",
        icon: "?",
      };
    }

    return {
      title: "Likely Legitimate",
      description:
        "The model found stronger indicators supporting a legitimate classification.",
      badge: "LOW RISK",
      bg: "bg-[#edf8f1]",
      border:
        "border-[#cce8d5]",
      text: "text-[#188038]",
      icon: "✓",
    };

  }, [
    phishingScore,
    legitimateScore,
  ]);


  // ==========================================================
  // FEATURE LABELS
  // ==========================================================

  const featureLabels = {

    url_count:
      "URLs detected",

    ip_url_count:
      "IP-based URLs",

    suspicious_tld_count:
      "Suspicious TLDs",

    long_url_count:
      "Long URLs",

    urgent_count:
      "Urgency indicators",

    credential_count:
      "Credential indicators",

    threat_count:
      "Threat indicators",

    reply_to_mismatch:
      "Reply-To mismatch",

    attachment_count:
      "Attachments",

    suspicious_attachment_count:
      "Suspicious attachments",

    text_length:
      "Text length",

    exclamation_count:
      "Exclamation marks",

  };


  // ==========================================================
  // AI LABELS
  // ==========================================================

  const aiLabels = {

    urgency:
      "Urgency",

    threats:
      "Threats",

    financial_request:
      "Financial request",

    credential_request:
      "Credential request",

    unusual_language:
      "Unusual language",

    fear:
      "Fear",

    pressure:
      "Pressure",

    password_request:
      "Password request",

    otp_request:
      "OTP request",

    fake_verification:
      "Fake verification",

    impersonation:
      "Impersonation",

    social_engineering:
      "Social engineering",

    suspicious_instructions:
      "Suspicious instructions",

    phishing_indicator:
      "Phishing indicator",

  };


  // ==========================================================
  // LOADING UI
  // ==========================================================

  if (loading) {

    return (
      <div className="min-h-screen bg-[#f4f8fd] flex items-center justify-center">

        <div className="text-center">

          <div className="relative w-16 h-16 mx-auto">

            <div className="absolute inset-0 rounded-full border-4 border-[#dceaff]" />

            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2563eb] animate-spin" />

            <div className="absolute inset-0 flex items-center justify-center">
              🎣
            </div>

          </div>

          <h2 className="mt-5 text-sm font-semibold text-[#173b66]">
            Checking for Phishing
          </h2>

          <p className="mt-1 text-xs text-[#71839b]">
            MailGuard is analyzing suspicious indicators...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // ERROR UI
  // ==========================================================

  if (error) {

    return (
      <div className="min-h-screen bg-[#f4f8fd] flex items-center justify-center px-4">

        <div className="w-full max-w-md bg-white border border-[#dbe7f5] rounded-2xl shadow-sm p-7 text-center">

          <div className="w-14 h-14 mx-auto rounded-full bg-[#eef5ff] flex items-center justify-center text-xl text-[#2563eb]">
            !
          </div>

          <h2 className="mt-4 text-lg font-semibold text-[#173b66]">
            Unable to load phishing analysis
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#6b7c93]">
            {error}
          </p>

          <div className="mt-6 flex justify-center gap-3">

            <button
              onClick={() =>
                navigate(-1)
              }
              className="px-4 py-2.5 rounded-lg border border-[#d5e0ec] bg-white text-sm font-medium text-[#405572] hover:bg-[#f5f8fc]"
            >
              ← Back
            </button>

            <button
              onClick={
                fetchPhishingAnalysis
              }
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
  // MAIN UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#f4f8fd] text-[#173b66]">


      {/* ====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#dbe7f5]">

        <div className="h-full max-w-[1500px] mx-auto px-4 md:px-6 flex items-center">

          <button
            onClick={() =>
              navigate(-1)
            }
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
                Phishing Detection
              </p>

            </div>

          </div>


          <div className="ml-auto flex items-center gap-3">

            <div className="hidden sm:block text-right">

              <p className="text-[10px] uppercase tracking-wider text-[#8293a9]">
                Message ID
              </p>

              <p className="max-w-[220px] truncate font-mono text-[10px] text-[#526983]">
                {messageId}
              </p>

            </div>

            <button
              onClick={
                fetchPhishingAnalysis
              }
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


      {/* ====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-[1500px] mx-auto px-4 md:px-6 py-7">


        {/* ==================================================
            TITLE
        =================================================== */}

        <div className="mb-6">

          <div className="flex items-center gap-2">

            <span className="text-xs font-semibold text-[#2563eb]">
              MAILGUARD
            </span>

            <span className="text-[#a7b6c8]">
              /
            </span>

            <span className="text-xs text-[#71839b]">
              Phishing Detection
            </span>

          </div>

          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#12345b]">
            Phishing Detection
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7c93]">
            MailGuard evaluates the selected email for
            phishing indicators including suspicious URLs,
            credential requests, threats, unusual patterns
            and other behavioral signals.
          </p>

        </div>


        {/* ==================================================
            VERDICT
        =================================================== */}

        <SectionCard className="mb-6 overflow-hidden">

          <div className="p-6">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


              {/* VERDICT */}

              <div className="lg:col-span-1">

                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7b8da6]">
                  Detection Result
                </p>

                <div className="mt-3 flex items-center gap-4">

                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold ${verdict.bg} ${verdict.text}`}
                  >
                    {verdict.icon}
                  </div>

                  <div>

                    <h3 className="text-xl font-bold text-[#173b66]">
                      {verdict.title}
                    </h3>

                    <span
                      className={`inline-flex mt-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${verdict.bg} ${verdict.border} ${verdict.text}`}
                    >
                      {verdict.badge}
                    </span>

                  </div>

                </div>

                <p className="mt-4 text-xs leading-6 text-[#6b7c93]">
                  {verdict.description}
                </p>

              </div>


              {/* SCORES */}

              <div className="lg:col-span-2 space-y-6">

                <ScoreBar
                  label="Phishing Score"
                  score={phishingScore}
                  description="Probability / strength of phishing indicators"
                  danger
                />

                <ScoreBar
                  label="Legitimate Score"
                  score={legitimateScore}
                  description="Probability / strength of legitimate indicators"
                />

              </div>

            </div>

          </div>


          {/* PREDICTION */}

          <div className="px-6 py-4 bg-[#f8fbff] border-t border-[#e2ebf5] flex flex-wrap items-center justify-between gap-3">

            <div>

              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8193aa]">
                Model Prediction
              </p>

              <p className="mt-1 text-xs text-[#526983]">
                Classification returned by the phishing model
              </p>

            </div>

            <div className="px-4 py-2 rounded-lg bg-white border border-[#d7e3ef] font-mono text-sm font-bold text-[#2563eb]">
              {prediction === undefined ||
              prediction === null
                ? "N/A"
                : prediction}
            </div>

          </div>

        </SectionCard>


        {/* ==================================================
            EXPLANATION
        =================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="💡"
            title="Detection Explanation"
            description="Explanation generated by the phishing detection system."
          />

          <div className="p-5">

            <div className="rounded-xl bg-[#f4f8fd] border border-[#dce7f3] p-5">

              <p className="text-sm leading-7 text-[#405572] whitespace-pre-line">
                {result?.explanation ||
                  "No explanation was returned by the backend."}
              </p>

            </div>

          </div>

        </SectionCard>


        {/* ==================================================
            PHISHING FEATURES
        =================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="◈"
            title="Phishing Indicators"
            description="Feature values used by the phishing detection model."
          />

          <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">

            {Object.entries(features).map(
              ([key, value]) => {

                const isRiskFeature = [
                  "url_count",
                  "ip_url_count",
                  "suspicious_tld_count",
                  "long_url_count",
                  "urgent_count",
                  "credential_count",
                  "threat_count",
                  "reply_to_mismatch",
                  "suspicious_attachment_count",
                  "exclamation_count",
                ].includes(key);

                return (
                  <FeatureCard
                    key={key}
                    label={
                      featureLabels[key] ||
                      key
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, c =>
                          c.toUpperCase()
                        )
                    }
                    value={value}
                    type={
                      isRiskFeature
                        ? "danger"
                        : "normal"
                    }
                  />
                );
              }
            )}

          </div>

        </SectionCard>


        {/* ==================================================
            IMPORTANT INDICATORS
        =================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="⚠"
            title="Important Phishing Signals"
            description="Key indicators that may contribute to the phishing classification."
          />

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">


            {/* URL */}

            <div className="rounded-xl border border-[#dce7f4] p-4">

              <div className="flex items-center justify-between">

                <span className="text-xs font-semibold text-[#405572]">
                  URLs
                </span>

                <span className="text-lg">
                  🔗
                </span>

              </div>

              <p className="mt-3 text-2xl font-bold text-[#2563eb]">
                {features?.url_count ??
                  0}
              </p>

              <p className="mt-1 text-[11px] text-[#7b8da6]">
                URLs found in message
              </p>

            </div>


            {/* CREDENTIAL */}

            <div className="rounded-xl border border-[#dce7f4] p-4">

              <div className="flex items-center justify-between">

                <span className="text-xs font-semibold text-[#405572]">
                  Credentials
                </span>

                <span className="text-lg">
                  🔐
                </span>

              </div>

              <p className="mt-3 text-2xl font-bold text-[#2563eb]">
                {features?.credential_count ??
                  0}
              </p>

              <p className="mt-1 text-[11px] text-[#7b8da6]">
                Credential-related indicators
              </p>

            </div>


            {/* THREATS */}

            <div className="rounded-xl border border-[#dce7f4] p-4">

              <div className="flex items-center justify-between">

                <span className="text-xs font-semibold text-[#405572]">
                  Threats
                </span>

                <span className="text-lg">
                  ⚠
                </span>

              </div>

              <p className="mt-3 text-2xl font-bold text-[#2563eb]">
                {features?.threat_count ??
                  0}
              </p>

              <p className="mt-1 text-[11px] text-[#7b8da6]">
                Threat-related indicators
              </p>

            </div>


            {/* REPLY TO */}

            <div className="rounded-xl border border-[#dce7f4] p-4">

              <div className="flex items-center justify-between">

                <span className="text-xs font-semibold text-[#405572]">
                  Reply-To
                </span>

                <span className="text-lg">
                  ↩
                </span>

              </div>

              <p className="mt-3 text-2xl font-bold text-[#2563eb]">
                {features?.reply_to_mismatch ??
                  0}
              </p>

              <p className="mt-1 text-[11px] text-[#7b8da6]">
                Reply address mismatches
              </p>

            </div>

          </div>

        </SectionCard>


        {/* ==================================================
            AI ANALYSIS
        =================================================== */}

        {Object.keys(aiAnalysis).length >
          0 && (

          <SectionCard className="mb-6">

            <SectionHeader
              icon="AI"
              title="AI Phishing Analysis"
              description="Additional phishing indicators identified through AI analysis."
            />

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

              {Object.entries(
                aiAnalysis
              ).map(
                ([key, value]) => {

                  // Arrays / objects
                  if (
                    typeof value ===
                      "object" &&
                    value !== null
                  ) {

                    return (
                      <div
                        key={key}
                        className="sm:col-span-2 lg:col-span-3 rounded-xl border border-[#e1e9f3] bg-[#f9fbfe] p-4"
                      >

                        <p className="text-xs font-semibold text-[#526983]">
                          {key
                            .replaceAll(
                              "_",
                              " "
                            )
                            .replace(
                              /\b\w/g,
                              c =>
                                c.toUpperCase()
                            )}
                        </p>

                        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 font-mono text-[#536981]">
                          {JSON.stringify(
                            value,
                            null,
                            2
                          )}
                        </pre>

                      </div>
                    );
                  }


                  return (
                    <AnalysisRow
                      key={key}
                      label={
                        aiLabels[key] ||
                        key
                          .replaceAll(
                            "_",
                            " "
                          )
                          .replace(
                            /\b\w/g,
                            c =>
                              c.toUpperCase()
                          )
                      }
                      value={value}
                    />
                  );

                }
              )}

            </div>

          </SectionCard>

        )}


        {/* ==================================================
            OTHER SECURITY TOOLS
        =================================================== */}

        <div className="mt-8 mb-4">

          <h2 className="text-lg font-bold text-[#12345b]">
            Continue Security Analysis
          </h2>

          <p className="mt-1 text-xs leading-5 text-[#6b7c93]">
            Continue investigating this email with the other
            MailGuard security tools.
          </p>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


          {/* ANALYZER */}

          <NavigationCard
            icon="🔍"
            title="Email Analyzer"
            description="View the complete forensic analysis including email metadata, authentication, URLs, headers and detection features."
            buttonText="Open Analyzer"
            onClick={() =>
              navigate(
                `/analyzer?message_id=${encodeURIComponent(
                  messageId
                )}`
              )
            }
          />


          {/* SOCIAL */}

          <NavigationCard
            icon="👥"
            title="Social Engineering"
            description="Investigate manipulation tactics such as urgency, pressure, fear, impersonation and suspicious instructions."
            buttonText="Open Social Engineering"
            onClick={() =>
              navigate(
                `/social?message_id=${encodeURIComponent(
                  messageId
                )}`
              )
            }
          />


          {/* IP */}

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


        {/* ==================================================
            BOTTOM
        =================================================== */}

        <div className="mt-7 flex flex-wrap gap-3">

          <button
            onClick={() =>
              navigate(-1)
            }
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
            ← Back
          </button>

          <button
            onClick={() =>
              navigate(
                `/analyzer?message_id=${encodeURIComponent(
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
            Back to Analyzer →
          </button>

        </div>


        {/* ==================================================
            FOOTER
        =================================================== */}

        <div className="mt-10 pb-6 text-center">

          <p className="text-[11px] text-[#91a1b5]">
            MailGuard • Phishing Detection
          </p>

          <p className="mt-1 text-[10px] text-[#a3b0c0]">
            Results generated from the connected Gmail message.
          </p>

        </div>

      </main>

    </div>
  );
}