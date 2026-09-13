import React, { useEffect, useState } from "react";

const API_URL = "https://emailforensic.onrender.com";

const SocialPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSocial = async () => {
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
            result?.detail || "Failed to fetch analysis"
          );
        }

        if (!result.success || !result.data) {
          throw new Error("Analysis data not found");
        }

        const socialData = result.data.social;

        if (!socialData) {
          throw new Error(
            "Social engineering analysis is not available"
          );
        }

        setData(socialData);

      } catch (error) {
        console.error("Social Error:", error);

        setError(
          error.message ||
            "Failed to load social engineering analysis"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSocial();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center">

          <div className="relative mx-auto w-16 h-16 mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-[#dbeafe]" />

            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1a73e8] animate-spin" />

            <div className="absolute inset-0 flex items-center justify-center text-xl">
              🛡️
            </div>
          </div>

          <h1 className="text-xl font-semibold text-[#202124]">
            Analyzing Social Engineering
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

  // ==========================================
  // NO DATA
  // ==========================================

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <p className="text-[#6b7280]">
          No social engineering analysis found.
        </p>
      </div>
    );
  }

  // ==========================================
  // DATA
  // ==========================================

  const score = Number(
    data.social_engineering_score ?? 0
  );

  const techniques = Array.isArray(data.techniques)
    ? data.techniques
    : [];

  const evidence = Array.isArray(data.evidence)
    ? data.evidence
    : [];

  const riskImpact =
    data.risk_impact || "Unknown";

  const detected = Boolean(data.detected);

  // Score styling
  const getScoreColor = () => {
    if (score >= 70) return "text-[#c5221f]";
    if (score >= 40) return "text-[#f29900]";
    return "text-[#188038]";
  };

  const getScoreBg = () => {
    if (score >= 70) return "bg-[#fce8e6]";
    if (score >= 40) return "bg-[#fef7e0]";
    return "bg-[#e6f4ea]";
  };

  const getRiskColor = () => {
    if (riskImpact.toLowerCase() === "high") {
      return "bg-[#fce8e6] text-[#c5221f]";
    }

    if (riskImpact.toLowerCase() === "medium") {
      return "bg-[#fef7e0] text-[#b06000]";
    }

    return "bg-[#e6f4ea] text-[#137333]";
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc]">

      {/* ==========================================
          TOP HEADER
      ========================================== */}

      <div className="bg-white border-b border-[#e5e7eb]">

        <div className="max-w-6xl mx-auto px-6 py-5">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-4">

              <div className="w-12 h-12 rounded-xl bg-[#e8f0fe] flex items-center justify-center text-2xl">
                🧠
              </div>

              <div>
                <h1 className="text-xl font-bold text-[#202124]">
                  Social Engineering Analysis
                </h1>

                <p className="text-sm text-[#6b7280] mt-1">
                  Behavioral threat intelligence
                </p>
              </div>

            </div>

            {/* Cache indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-[#e6f4ea] text-[#137333] text-xs font-medium">

              <span className="w-2 h-2 rounded-full bg-[#34a853]" />

              Analysis Loaded

            </div>

          </div>

        </div>

      </div>

      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ==========================================
            HERO / SCORE
        ========================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Score Card */}

          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-7">

            <div className="flex flex-col sm:flex-row items-center gap-8">

              {/* Circular score */}

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
                    stroke={
                      score >= 70
                        ? "#c5221f"
                        : score >= 40
                        ? "#f29900"
                        : "#188038"
                    }
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${score * 3.14} 314`}
                  />

                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">

                  <span
                    className={`text-3xl font-bold ${getScoreColor()}`}
                  >
                    {score}
                  </span>

                  <span className="text-xs text-[#6b7280]">
                    / 100
                  </span>

                </div>

              </div>

              {/* Score information */}

              <div className="flex-1 text-center sm:text-left">

                <p className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold">
                  Social Engineering Risk
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#202124]">
                  {detected
                    ? "Social Engineering Detected"
                    : "No Strong Indicators"}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#5f6368]">
                  {data.explanation ||
                    "No explanation available."}
                </p>

              </div>

            </div>

          </div>

          {/* Risk Card */}

          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">

            <p className="text-xs uppercase tracking-wider font-semibold text-[#6b7280]">
              Risk Impact
            </p>

            <div className="mt-5">

              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor()}`}
              >
                <span className="w-2 h-2 rounded-full mr-2 bg-current" />
                {riskImpact}
              </span>

            </div>

            <div className="mt-7 pt-5 border-t border-[#edf0f2]">

              <p className="text-xs text-[#6b7280]">
                Detection Status
              </p>

              <p className="mt-1 text-lg font-semibold text-[#202124]">
                {detected ? "Threat indicators found" : "No threat detected"}
              </p>

            </div>

          </div>

        </div>

        {/* ==========================================
            TECHNIQUES
        ========================================== */}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 mb-6">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="text-lg font-semibold text-[#202124]">
                Detected Techniques
              </h2>

              <p className="text-sm text-[#6b7280] mt-1">
                Social engineering methods identified in the email
              </p>
            </div>

            <div className="px-3 py-1 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-xs font-semibold">
              {techniques.length} detected
            </div>

          </div>

          {techniques.length > 0 ? (
            <div className="flex flex-wrap gap-3">

              {techniques.map((technique, index) => (
                <div
                  key={`${technique}-${index}`}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#fff8e1] border border-[#f6d365]"
                >
                  <span className="text-lg">
                    🎯
                  </span>

                  <span className="text-sm font-medium text-[#7a4f01]">
                    {technique}
                  </span>

                </div>
              ))}

            </div>
          ) : (
            <p className="text-sm text-[#6b7280]">
              No specific social engineering techniques were detected.
            </p>
          )}

        </div>

        {/* ==========================================
            SIGNAL GRID
        ========================================== */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <SignalCard
            label="Reward"
            detected={data.reward}
            icon="🎁"
          />

          <SignalCard
            label="Urgency"
            detected={data.urgency}
            icon="⏱️"
          />

          <SignalCard
            label="Fear"
            detected={data.fear}
            icon="⚠️"
          />

          <SignalCard
            label="Secrecy"
            detected={data.secrecy}
            icon="🔒"
          />

        </div>

        {/* ==========================================
            AUTHORITY
        ========================================== */}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 mb-6">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-4">

              <div className="w-11 h-11 rounded-xl bg-[#f1f3f4] flex items-center justify-center text-xl">
                👤
              </div>

              <div>
                <h2 className="font-semibold text-[#202124]">
                  Authority Impersonation
                </h2>

                <p className="text-sm text-[#6b7280] mt-1">
                  Attempts to exploit trust in an authority or organization
                </p>
              </div>

            </div>

            <StatusBadge
              detected={data.authority_impersonation}
            />

          </div>

        </div>

        {/* ==========================================
            EVIDENCE
        ========================================== */}

        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 mb-6">

          <div className="mb-5">

            <h2 className="text-lg font-semibold text-[#202124]">
              Evidence
            </h2>

            <p className="text-sm text-[#6b7280] mt-1">
              Content that contributed to the detection
            </p>

          </div>

          {evidence.length > 0 ? (
            <div className="space-y-3">

              {evidence.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-4 rounded-xl bg-[#f8f9fa] border border-[#edf0f2]"
                >

                  <span className="text-[#f29900] text-lg">
                    "
                  </span>

                  <p className="text-sm leading-6 text-[#3c4043]">
                    {String(item).replace(/^"|"$/g, "")}
                  </p>

                </div>
              ))}

            </div>
          ) : (
            <p className="text-sm text-[#6b7280]">
              No evidence snippets were returned.
            </p>
          )}

        </div>

        {/* ==========================================
            RECOMMENDATION
        ========================================== */}

        <div className="rounded-2xl border border-[#c8e6c9] bg-[#f1f8f4] p-6">

          <div className="flex gap-4">

            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#e6f4ea] flex items-center justify-center text-xl">
              🛡️
            </div>

            <div>

              <h2 className="font-semibold text-[#137333]">
                Security Recommendation
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#3c4043]">
                {data.recommendation ||
                  "No recommendation available."}
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
};


// ==========================================
// SIGNAL CARD
// ==========================================

const SignalCard = ({
  label,
  detected,
  icon,
}) => {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">

      <div className="flex items-center justify-between">

        <span className="text-xl">
          {icon}
        </span>

        <StatusBadge detected={detected} />

      </div>

      <p className="mt-4 text-sm font-medium text-[#202124]">
        {label}
      </p>

      <p className="mt-1 text-xs text-[#6b7280]">
        {detected
          ? "Indicator detected"
          : "Not detected"}
      </p>

    </div>
  );
};


// ==========================================
// STATUS BADGE
// ==========================================

const StatusBadge = ({ detected }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
        detected
          ? "bg-[#fce8e6] text-[#c5221f]"
          : "bg-[#e6f4ea] text-[#137333]"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />

      {detected ? "Detected" : "Clear"}
    </span>
  );
};

export default SocialPage;