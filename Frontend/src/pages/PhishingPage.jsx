import React, { useEffect, useState } from "react";

const API_URL = "https://emailforensic.onrender.com";

const PhishingPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPhishing = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const params = new URLSearchParams(window.location.search);
        const messageId = params.get("message_id");

        if (!messageId) {
          setError("Message ID is missing");
          setLoading(false);
          return;
        }

        if (!token) {
          setError("Authentication token is missing");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_URL}/gmail/full-analysis/${encodeURIComponent(
            messageId
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        console.log("Full Analysis:", result);

        if (!response.ok) {
          throw new Error(
            result?.detail || "Failed to fetch phishing analysis"
          );
        }

        if (!result.success || !result.data) {
          throw new Error("Analysis data not found");
        }

        const phishingData = result.data.phishing;

        if (!phishingData) {
          throw new Error(
            "Phishing analysis is not available"
          );
        }

        setData(phishingData);
      } catch (error) {
        console.error("Phishing Error:", error);

        setError(
          error.message ||
            "Failed to load phishing analysis"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPhishing();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center">

          <div className="relative mx-auto w-16 h-16 mb-5">

            <div className="absolute inset-0 rounded-full border-4 border-[#fee2e2]" />

            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#c5221f] animate-spin" />

            <div className="absolute inset-0 flex items-center justify-center text-xl">
              🎣
            </div>

          </div>

          <h1 className="text-xl font-semibold text-[#202124]">
            Analyzing Phishing Risk
          </h1>

          <p className="mt-2 text-sm text-[#6b7280]">
            Loading security intelligence...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center p-6">

        <div className="max-w-md w-full bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8 text-center">

          <div className="w-14 h-14 mx-auto rounded-full bg-[#fce8e6] flex items-center justify-center text-2xl">
            ⚠️
          </div>

          <h1 className="mt-4 text-xl font-semibold text-[#202124]">
            Analysis Unavailable
          </h1>

          <p className="mt-2 text-sm text-[#6b7280]">
            {error}
          </p>

        </div>

      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <p className="text-[#6b7280]">
          No phishing analysis found.
        </p>
      </div>
    );
  }

  // ==========================================
  // DATA
  // ==========================================

  const phishingScore = Number(
    data.phishing_score ?? 0
  );

  const legitimateScore = Number(
    data.legitimate_score ?? 0
  );

  const prediction =
    Number(data.prediction) === 1
      ? "Phishing Detected"
      : "Likely Legitimate";

  const predictionDetected =
    Number(data.prediction) === 1;

  // ==========================================
  // PARSE AI ANALYSIS
  // ==========================================

  let aiAnalysis = {};

  try {
    if (typeof data.ai_analysis === "string") {
      aiAnalysis = JSON.parse(data.ai_analysis);
    } else {
      aiAnalysis = data.ai_analysis || {};
    }
  } catch {
    aiAnalysis = {
      raw_analysis: data.ai_analysis,
    };
  }

  // ==========================================
  // AI SIGNALS
  // ==========================================

  const aiSignals = [
    {
      key: "lookalike_domain",
      label: "Lookalike Domain",
      icon: "🌐",
    },
    {
      key: "spoofed_sender",
      label: "Spoofed Sender",
      icon: "🎭",
    },
    {
      key: "suspicious_sender",
      label: "Suspicious Sender",
      icon: "📧",
    },
    {
      key: "credential_harvesting",
      label: "Credential Harvesting",
      icon: "🔑",
    },
    {
      key: "fake_login_pages",
      label: "Fake Login Page",
      icon: "🔐",
    },
    {
      key: "malicious_URL",
      label: "Malicious URL",
      icon: "🔗",
    },
    {
      key: "obfuscated_URL",
      label: "Obfuscated URL",
      icon: "🕵️",
    },
    {
      key: "shortened_URL",
      label: "Shortened URL",
      icon: "↪️",
    },
    {
      key: "suspicious_attachment",
      label: "Suspicious Attachment",
      icon: "📎",
    },
    {
      key: "suspicious_redirects",
      label: "Suspicious Redirects",
      icon: "↗️",
    },
  ];

  const activeAISignals = aiSignals.filter(
    (signal) => {
      const value = aiAnalysis[signal.key];

      if (value === null || value === undefined) {
        return false;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      return Boolean(value);
    }
  );

  // ==========================================
  // SCORE COLOR
  // ==========================================

  const scoreColor =
    phishingScore >= 70
      ? "#c5221f"
      : phishingScore >= 40
      ? "#f29900"
      : "#188038";

  const scoreTextClass =
    phishingScore >= 70
      ? "text-[#c5221f]"
      : phishingScore >= 40
      ? "text-[#f29900]"
      : "text-[#188038]";

  // ==========================================
  // FEATURES
  // ==========================================

  const featureItems = [
    {
      key: "credential_count",
      label: "Credential Indicators",
      icon: "🔑",
    },
    {
      key: "url_count",
      label: "URLs",
      icon: "🔗",
    },
    {
      key: "long_url_count",
      label: "Long URLs",
      icon: "📏",
    },
    {
      key: "threat_count",
      label: "Threat Indicators",
      icon: "⚠️",
    },
    {
      key: "exclamation_count",
      label: "Exclamation Marks",
      icon: "❗",
    },
    {
      key: "urgent_count",
      label: "Urgency Indicators",
      icon: "⏱️",
    },
    {
      key: "attachment_count",
      label: "Attachments",
      icon: "📎",
    },
    {
      key: "text_length",
      label: "Text Length",
      icon: "📝",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f8fc]">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="bg-white border-b border-[#e5e7eb]">

        <div className="max-w-6xl mx-auto px-6 py-5">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-4">

              <div className="w-12 h-12 rounded-xl bg-[#fce8e6] flex items-center justify-center text-2xl">
                🎣
              </div>

              <div>

                <h1 className="text-xl font-bold text-[#202124]">
                  Phishing Detection
                </h1>

                <p className="text-sm text-[#6b7280] mt-1">
                  Email threat and malicious-link intelligence
                </p>

              </div>

            </div>

            {/* Status */}

            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium ${
                predictionDetected
                  ? "bg-[#fce8e6] text-[#c5221f]"
                  : "bg-[#e6f4ea] text-[#137333]"
              }`}
            >

              <span
                className={`w-2 h-2 rounded-full ${
                  predictionDetected
                    ? "bg-[#ea4335]"
                    : "bg-[#34a853]"
                }`}
              />

              {predictionDetected
                ? "Threat Detected"
                : "No Threat Detected"}

            </div>

          </div>

        </div>

      </div>

      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ==========================================
            SCORE HERO
        ========================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Main Score */}

          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-7">

            <div className="flex flex-col sm:flex-row items-center gap-8">

              {/* Circle */}

              <div className="relative w-40 h-40 shrink-0">

                <svg
                  viewBox="0 0 120 120"
                  className="w-full h-full -rotate-90"
                >

                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#edf0f2"
                    strokeWidth="10"
                  />

                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${phishingScore * 3.14} 314`}
                  />

                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">

                  <span
                    className={`text-3xl font-bold ${scoreTextClass}`}
                  >
                    {phishingScore}
                  </span>

                  <span className="text-xs text-[#6b7280]">
                    / 100
                  </span>

                </div>

              </div>

              {/* Description */}

              <div className="flex-1 text-center sm:text-left">

                <p className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold">
                  Phishing Risk
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#202124]">
                  {prediction}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#5f6368]">
                  {data.explanation ||
                    "The detection engine identified indicators that may suggest phishing activity."}
                </p>

              </div>

            </div>

          </div>

          {/* Legitimate Score */}

          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">

            <p className="text-xs uppercase tracking-wider font-semibold text-[#6b7280]">
              Legitimacy Assessment
            </p>

            <div className="mt-5 flex items-end gap-2">

              <span className="text-4xl font-bold text-[#188038]">
                {legitimateScore}
              </span>

              <span className="text-sm text-[#6b7280] mb-1">
                / 100
              </span>

            </div>

            <div className="mt-5 h-2 bg-[#edf0f2] rounded-full overflow-hidden">

              <div
                className="h-full bg-[#34a853] rounded-full"
                style={{
                  width: `${Math.min(
                    legitimateScore,
                    100
                  )}%`,
                }}
              />

            </div>

            <p className="mt-4 text-xs leading-5 text-[#6b7280]">
              Higher values indicate characteristics
              consistent with a legitimate email.
            </p>

          </div>

        </div>

        {/* ==========================================
            AI THREAT SIGNALS
        ========================================== */}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 mb-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h2 className="text-lg font-semibold text-[#202124]">
                AI Threat Signals
              </h2>

              <p className="text-sm text-[#6b7280] mt-1">
                Indicators identified by the AI analysis
              </p>

            </div>

            <div className="px-3 py-1 rounded-full bg-[#fce8e6] text-[#c5221f] text-xs font-semibold">
              {activeAISignals.length} detected
            </div>

          </div>

          {activeAISignals.length > 0 ? (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {activeAISignals.map((signal) => (

                <div
                  key={signal.key}
                  className="p-4 rounded-xl bg-[#fff8f7] border border-[#f5c2c0]"
                >

                  <div className="flex items-start gap-3">

                    <div className="w-10 h-10 shrink-0 rounded-lg bg-[#fce8e6] flex items-center justify-center text-lg">
                      {signal.icon}
                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-[#202124]">
                        {signal.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#5f6368] break-words">
                        {String(
                          aiAnalysis[signal.key]
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="p-5 rounded-xl bg-[#e6f4ea] text-[#137333]">
              No additional AI threat signals were detected.
            </div>

          )}

        </div>

        {/* ==========================================
            DETECTION FEATURES
        ========================================== */}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 mb-6">

          <div className="mb-5">

            <h2 className="text-lg font-semibold text-[#202124]">
              Detection Features
            </h2>

            <p className="text-sm text-[#6b7280] mt-1">
              Signals used by the phishing detection engine
            </p>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {featureItems.map((feature) => (

              <div
                key={feature.key}
                className="rounded-xl bg-[#f8f9fa] border border-[#edf0f2] p-4"
              >

                <div className="flex items-center justify-between">

                  <span className="text-lg">
                    {feature.icon}
                  </span>

                  <span className="text-xl font-bold text-[#202124]">
                    {data.features?.[feature.key] ?? 0}
                  </span>

                </div>

                <p className="mt-3 text-xs text-[#6b7280]">
                  {feature.label}
                </p>

              </div>

            ))}

          </div>

        </div>

        {/* ==========================================
            KEY FINDINGS
        ========================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Domain */}

          <FindingCard
            icon="🌐"
            title="Domain Intelligence"
            value={
              aiAnalysis.lookalike_domain ||
              "No lookalike domain identified"
            }
            dangerous={Boolean(
              aiAnalysis.lookalike_domain
            )}
          />

          {/* Sender */}

          <FindingCard
            icon="📧"
            title="Sender Intelligence"
            value={
              aiAnalysis.suspicious_sender ||
              aiAnalysis.spoofed_sender ||
              "No suspicious sender indicator identified"
            }
            dangerous={
              Boolean(aiAnalysis.suspicious_sender) ||
              Boolean(aiAnalysis.spoofed_sender)
            }
          />

        </div>

        {/* ==========================================
            AI ANALYSIS DETAILS
        ========================================== */}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 mb-6">

          <div className="mb-5">

            <h2 className="text-lg font-semibold text-[#202124]">
              AI Analysis Details
            </h2>

            <p className="text-sm text-[#6b7280] mt-1">
              Detailed reasoning returned by the AI security engine
            </p>

          </div>

          <div className="space-y-3">

            {Object.entries(aiAnalysis).map(
              ([key, value]) => {

                if (
                  value === null ||
                  value === undefined
                ) {
                  return null;
                }

                const displayValue =
                  Array.isArray(value)
                    ? value.length
                      ? value.join(", ")
                      : "None"
                    : String(value);

                return (
                  <div
                    key={key}
                    className="p-4 rounded-xl bg-[#f8f9fa] border border-[#edf0f2]"
                  >

                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">

                      <span className="sm:w-56 shrink-0 text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                        {key.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                      <span className="text-sm leading-6 text-[#3c4043] break-words">
                        {displayValue}
                      </span>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

        {/* ==========================================
            SECURITY RECOMMENDATION
        ========================================== */}

        <div
          className={`rounded-2xl p-6 border ${
            predictionDetected
              ? "bg-[#fff8f7] border-[#f5c2c0]"
              : "bg-[#f1f8f4] border-[#c8e6c9]"
          }`}
        >

          <div className="flex gap-4">

            <div
              className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl ${
                predictionDetected
                  ? "bg-[#fce8e6]"
                  : "bg-[#e6f4ea]"
              }`}
            >
              {predictionDetected
                ? "🚨"
                : "🛡️"}
            </div>

            <div>

              <h2
                className={`font-semibold ${
                  predictionDetected
                    ? "text-[#c5221f]"
                    : "text-[#137333]"
                }`}
              >
                Security Recommendation
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#3c4043]">
                {predictionDetected
                  ? "Treat this email as potentially malicious. Avoid clicking links, entering credentials, or downloading unexpected attachments until the sender and destination are independently verified."
                  : "No strong phishing indicators were detected. Continue to verify unexpected requests before interacting with links or attachments."}
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
};


// ==========================================
// FINDING CARD
// ==========================================

const FindingCard = ({
  icon,
  title,
  value,
  dangerous,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-6 ${
        dangerous
          ? "border-[#f5c2c0]"
          : "border-[#e5e7eb]"
      }`}
    >

      <div className="flex items-start gap-4">

        <div
          className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl ${
            dangerous
              ? "bg-[#fce8e6]"
              : "bg-[#e8f0fe]"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <h3 className="font-semibold text-[#202124]">
              {title}
            </h3>

            {dangerous && (
              <span className="px-2 py-0.5 rounded-full bg-[#fce8e6] text-[#c5221f] text-[10px] font-semibold">
                FLAGGED
              </span>
            )}

          </div>

          <p className="mt-2 text-sm leading-6 text-[#5f6368] break-words">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
};

export default PhishingPage;