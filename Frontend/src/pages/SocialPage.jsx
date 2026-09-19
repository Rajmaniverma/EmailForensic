import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://emailforensic.onrender.com";

const SocialPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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
          `${API_URL}/gmail/full-analysis/${encodeURIComponent(messageId)}`,
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

        /*
         * IMPORTANT:
         * We keep the complete analysis object because the page
         * also uses phishing score, legitimate score, IP status,
         * message ID and email information.
         */
        setData({
          social: socialData,
          full: result.data,
        });
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

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-[5px] border-blue-100" />

            <div className="absolute inset-0 rounded-full border-[5px] border-transparent border-t-blue-600 animate-spin" />

            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              🧠
            </div>
          </div>

          <h1 className="mt-6 text-xl font-bold text-slate-900">
            Analyzing Social Engineering
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Processing behavioral threat intelligence...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Analysis Unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center">
        <p className="text-slate-500">
          No social engineering analysis found.
        </p>
      </div>
    );
  }

  // ============================================================
  // DATA
  // ============================================================

  const social = data.social || {};
  const full = data.full || {};

  const score = Number(
    social.social_engineering_score ?? 0
  );

  const detected = Boolean(social.detected);

  const techniques = Array.isArray(social.techniques)
    ? social.techniques
    : [];

  const evidence = Array.isArray(social.evidence)
    ? social.evidence
    : [];

  const phishingScore = Number(
    full.phishing_score ?? 0
  );

  const legitimateScore = Number(
    full.legitimate_score ?? 0
  );

  const ipTracing = full.ip_tracing || {};

  // ============================================================
  // RISK
  // ============================================================

  const risk = useMemo(() => {
    if (score >= 70) {
      return {
        level: "HIGH",
        color: "#dc2626",
        text: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        ring: "#dc2626",
        description:
          "Multiple social-engineering indicators were detected.",
      };
    }

    if (score >= 40) {
      return {
        level: "MEDIUM",
        color: "#d97706",
        text: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        ring: "#d97706",
        description:
          "Some behavioral indicators require additional review.",
      };
    }

    if (score >= 15) {
      return {
        level: "LOW",
        color: "#2563eb",
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        ring: "#2563eb",
        description:
          "Limited social-engineering indicators were detected.",
      };
    }

    return {
      level: "MINIMAL",
      color: "#16a34a",
      text: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      ring: "#16a34a",
      description:
        "No significant social-engineering indicators were detected.",
    };
  }, [score]);

  // ============================================================
  // INDICATORS
  // ============================================================

  const indicators = [
    {
      key: "urgency",
      label: "Urgency",
      icon: "⏱️",
      detected: Boolean(social.urgency),
      description: social.urgency
        ? "Artificial time pressure detected."
        : "No artificial time pressure found.",
    },

    {
      key: "fear",
      label: "Fear / Threat",
      icon: "⚠️",
      detected: Boolean(social.fear),
      description: social.fear
        ? "Threatening or fear-inducing language detected."
        : "No threatening language found.",
    },

    {
      key: "authority",
      label: "Authority Impersonation",
      icon: "👤",
      detected: Boolean(
        social.authority_impersonation
      ),
      description: social.authority_impersonation
        ? "Possible trusted-entity impersonation detected."
        : "No trusted-entity impersonation detected.",
    },

    {
      key: "reward",
      label: "Reward / Prize",
      icon: "🎁",
      detected: Boolean(social.reward),
      description: social.reward
        ? "Reward or prize manipulation detected."
        : "No unusual reward or prize language found.",
    },

    {
      key: "secrecy",
      label: "Secrecy",
      icon: "🔒",
      detected: Boolean(social.secrecy),
      description: social.secrecy
        ? "Secrecy-related instructions detected."
        : "No secrecy-related instructions found.",
    },
  ];

  const detectedIndicators = indicators.filter(
    (item) => item.detected
  );

  // ============================================================
  // TABS
  // ============================================================

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: "◉",
    },
    {
      id: "behavior",
      label: "Behavioral Indicators",
      icon: "◈",
    },
    {
      id: "evidence",
      label: "Evidence",
      icon: "⌕",
    },
    {
      id: "explanation",
      label: "AI Explanation",
      icon: "✦",
    },
    {
      id: "correlation",
      label: "Correlation",
      icon: "⌁",
    },
  ];

  // ============================================================
  // SCORE CIRCLE
  // ============================================================

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress =
    circumference - (score / 100) * circumference;

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8">

          <div className="flex min-h-[82px] items-center justify-between gap-5">

            {/* LEFT */}

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-blue-100 text-2xl shadow-sm">
                🧠
              </div>

              <div>
                <div className="flex items-center gap-3">

                  <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    Social Engineering Analysis
                  </h1>

                  <span className="hidden rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 sm:inline-flex">
                    AI Security
                  </span>

                </div>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Behavioral threat intelligence & forensic analysis
                </p>
              </div>

            </div>

            {/* RIGHT */}

            <div className="hidden items-center gap-3 md:flex">

              <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.12)]" />
                Analysis Loaded
              </div>

              <div className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600">
                ✦ ML + AI
              </div>

            </div>

          </div>

        </div>
      </header>


      {/* ======================================================
          TABS
      ====================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] overflow-x-auto px-5 lg:px-8">

          <div className="flex min-w-max items-center gap-1">

            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-4 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{tab.icon}</span>

                {tab.label}

                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-blue-600" />
                )}
              </button>
            ))}

          </div>

        </div>
      </div>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8 lg:py-8">

        {/* ==================================================
            OVERVIEW
        ================================================== */}

        {(activeTab === "overview" ||
          activeTab === "behavior") && (

          <>

            {/* HERO */}

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">

              {/* SCORE */}

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                <div className="p-6 sm:p-8">

                  <div className="flex flex-col items-center gap-8 md:flex-row">

                    {/* CIRCLE */}

                    <div className="relative h-48 w-48 shrink-0">

                      <svg
                        viewBox="0 0 120 120"
                        className="h-full w-full -rotate-90"
                      >

                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="none"
                          stroke="#edf1f5"
                          strokeWidth="9"
                        />

                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="none"
                          stroke={risk.ring}
                          strokeWidth="9"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={progress}
                          className="transition-all duration-1000"
                        />

                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center">

                        <span
                          className="text-5xl font-black tracking-tight"
                          style={{
                            color: risk.color,
                          }}
                        >
                          {score}
                        </span>

                        <span className="text-xs font-medium text-slate-400">
                          / 100
                        </span>

                      </div>

                    </div>


                    {/* INFORMATION */}

                    <div className="flex-1 text-center md:text-left">

                      <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">

                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Social Engineering Risk
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${risk.bg} ${risk.text}`}
                        >
                          {risk.level}
                        </span>

                      </div>

                      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">

                        {detected
                          ? "Social Engineering Detected"
                          : "No Strong Indicators"}

                      </h2>

                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">

                        {social.explanation ||
                          risk.description}

                      </p>

                      <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">

                        <MiniStat
                          label="Risk Score"
                          value={`${score}/100`}
                        />

                        <MiniStat
                          label="Indicators"
                          value={`${detectedIndicators.length}`}
                        />

                        <MiniStat
                          label="Techniques"
                          value={`${techniques.length}`}
                        />

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* ACTION */}

              <div
                className={`rounded-3xl border p-6 shadow-sm ${risk.bg} ${risk.border}`}
              >

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Recommended Action
                    </p>

                    <h3 className="mt-3 text-xl font-black text-slate-900">
                      {score < 40
                        ? "No Immediate Action Required"
                        : score < 70
                        ? "Review Before Taking Action"
                        : "Investigation Recommended"}
                    </h3>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                    {score < 40 ? "✓" : "⚠"}
                  </div>

                </div>

                <p className="mt-5 text-sm leading-7 text-slate-600">
                  {social.recommendation ||
                    "No recommendation available."}
                </p>

                <div className="mt-6 rounded-2xl border border-white/80 bg-white/70 p-4">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Detection Status
                  </p>

                  <div className="mt-2 flex items-center gap-2">

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        detected
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    />

                    <span className="text-sm font-bold text-slate-800">

                      {detected
                        ? "Threat indicators found"
                        : "No threat detected"}

                    </span>

                  </div>

                </div>

              </div>

            </section>


            {/* SIGNAL CARDS */}

            <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">

              {indicators.map((item) => (
                <SignalCard
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  detected={item.detected}
                />
              ))}

            </section>


            {/* RISK FACTORS */}

            <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <SectionTitle
                  icon="◈"
                  title="Risk Factor Breakdown"
                  subtitle="Behavioral signals contributing to the assessment"
                />

                <div className="mt-6 space-y-5">

                  {indicators.map((item) => {

                    const percentage = item.detected
                      ? 100
                      : 0;

                    return (
                      <div key={item.key}>

                        <div className="mb-2 flex items-center justify-between">

                          <span className="text-xs font-semibold text-slate-700">
                            {item.label}
                          </span>

                          <span
                            className={`text-[11px] font-bold ${
                              item.detected
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {item.detected
                              ? "Detected"
                              : "Clear"}
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: item.detected
                                ? "#dc2626"
                                : "#22c55e",
                            }}
                          />

                        </div>

                      </div>
                    );
                  })}

                </div>

                <div className="mt-7 flex items-center gap-4 border-t border-slate-100 pt-5">

                  <div className="flex-1">

                    <p className="text-xs font-semibold text-slate-500">
                      Overall Social Engineering Score
                    </p>

                  </div>

                  <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${score}%`,
                        backgroundColor: risk.color,
                      }}
                    />

                  </div>

                  <span
                    className="text-sm font-black"
                    style={{
                      color: risk.color,
                    }}
                  >
                    {score}/100
                  </span>

                </div>

              </div>


              {/* COMMUNICATION PATTERN */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <SectionTitle
                  icon="⌁"
                  title="Communication Pattern"
                  subtitle="Behavioral characteristics detected in the message"
                />

                <div className="mt-5 divide-y divide-slate-100">

                  {indicators.map((item) => (

                    <div
                      key={item.key}
                      className="flex items-center justify-between py-4"
                    >

                      <div className="flex items-center gap-3">

                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-sm">
                          {item.icon}
                        </span>

                        <span className="text-xs font-semibold text-slate-700">
                          {item.label}
                        </span>

                      </div>

                      <StatusBadge
                        detected={item.detected}
                      />

                    </div>

                  ))}

                </div>

              </div>

            </section>

          </>
        )}


        {/* ==================================================
            BEHAVIORAL INDICATORS
        ================================================== */}

        {activeTab === "behavior" && (
          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <SectionTitle
              icon="🎯"
              title="Behavioral Indicators"
              subtitle="Detailed analysis of social-engineering patterns"
            />

            <div className="mt-6 overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead>

                  <tr className="border-b border-slate-100 text-left">

                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Indicator
                    </th>

                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Analysis
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {indicators.map((item) => (

                    <tr
                      key={item.key}
                      className="border-b border-slate-50 last:border-0"
                    >

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-3">

                          <span>
                            {item.icon}
                          </span>

                          <span className="text-sm font-semibold">
                            {item.label}
                          </span>

                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <StatusBadge
                          detected={item.detected}
                        />

                      </td>

                      <td className="px-4 py-4 text-sm text-slate-500">

                        {item.description}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </section>
        )}


        {/* ==================================================
            EVIDENCE
        ================================================== */}

        {activeTab === "evidence" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <SectionTitle
              icon="⌕"
              title="Evidence"
              subtitle="Content that contributed to the social-engineering assessment"
            />

            <div className="mt-6">

              {evidence.length > 0 ? (

                <div className="space-y-3">

                  {evidence.map((item, index) => (

                    <div
                      key={index}
                      className="flex gap-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-5"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        "
                      </div>

                      <div>

                        <p className="text-sm leading-7 text-slate-700">
                          {String(item).replace(
                            /^"|"$/g,
                            ""
                          )}
                        </p>

                        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                          Behavioral Evidence
                        </p>

                      </div>

                    </div>

                  ))}

                </div>

              ) : (

                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                    ✓
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-800">
                    No suspicious evidence detected
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
                    The analysis did not return evidence snippets
                    associated with social-engineering behavior.
                  </p>

                </div>

              )}

            </div>

          </section>
        )}


        {/* ==================================================
            AI EXPLANATION
        ================================================== */}

        {activeTab === "explanation" && (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">

            <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">

              <SectionTitle
                icon="✦"
                title="AI Explanation"
                subtitle="Why the system produced this assessment"
              />

              <div className="mt-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                    ✦
                  </div>

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                      AI Assessment
                    </p>

                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      {risk.level} Social Engineering Risk
                    </h3>

                  </div>

                </div>

                <p className="mt-6 text-sm leading-8 text-slate-600">
                  {social.explanation ||
                    "No AI explanation was returned by the backend."}
                </p>

              </div>

            </div>


            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <SectionTitle
                icon="✓"
                title="Why This Score?"
                subtitle="Detected and cleared indicators"
              />

              <div className="mt-5 space-y-3">

                {indicators.map((item) => (

                  <div
                    key={item.key}
                    className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
                  >

                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        item.detected
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {item.detected ? "!" : "✓"}
                    </span>

                    <div>

                      <p className="text-xs font-bold text-slate-800">
                        {item.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </section>
        )}


        {/* ==================================================
            CORRELATION
        ================================================== */}

        {activeTab === "correlation" && (
          <section className="space-y-5">

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <SectionTitle
                icon="⌁"
                title="Forensic Correlation"
                subtitle="Cross-module intelligence from the complete email analysis"
              />

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <CorrelationCard
                  title="Social Engineering"
                  value={`${score}/100`}
                  subtitle={risk.level}
                  color={risk.color}
                />

                <CorrelationCard
                  title="Phishing Score"
                  value={`${phishingScore}%`}
                  subtitle="ML classification"
                  color="#7c3aed"
                />

                <CorrelationCard
                  title="Legitimate Score"
                  value={`${legitimateScore}%`}
                  subtitle="ML classification"
                  color="#16a34a"
                />

                <CorrelationCard
                  title="IP Intelligence"
                  value={
                    ipTracing.status || "N/A"
                  }
                  subtitle="Infrastructure analysis"
                  color={
                    ipTracing.status === "SUCCESS"
                      ? "#16a34a"
                      : "#64748b"
                  }
                />

              </div>

            </div>


            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <SectionTitle
                icon="◎"
                title="Forensic Investigation Flow"
                subtitle="How this analysis connects to the wider email-threat pipeline"
              />

              <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-5">

                <FlowStep
                  number="01"
                  title="Email"
                  description="Message ingested"
                />

                <FlowLine />

                <FlowStep
                  number="02"
                  title="Behavior"
                  description="Social signals"
                />

                <FlowLine />

                <FlowStep
                  number="03"
                  title="Phishing"
                  description={`${phishingScore}% score`}
                />

                <FlowLine />

                <FlowStep
                  number="04"
                  title="IP Intelligence"
                  description={
                    ipTracing.status || "Pending"
                  }
                />

                <FlowLine />

                <FlowStep
                  number="05"
                  title="Forensics"
                  description="Investigation report"
                />

              </div>

            </div>

          </section>
        )}


        {/* ==================================================
            TECHNIQUES + FOOTER INFORMATION
        ================================================== */}

        <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* TECHNIQUES */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-start justify-between gap-4">

              <SectionTitle
                icon="◉"
                title="Detected Techniques"
                subtitle="Social-engineering methods identified"
              />

              <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600">
                {techniques.length} detected
              </span>

            </div>

            <div className="mt-6">

              {techniques.length > 0 ? (

                <div className="space-y-3">

                  {techniques.map((technique, index) => (

                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-4"
                    >

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                        ⚠
                      </div>

                      <div>

                        <p className="text-sm font-bold text-slate-800">
                          {typeof technique === "string"
                            ? technique
                            : technique?.name ||
                              "Unknown Technique"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Behavioral attack pattern detected
                        </p>

                      </div>

                    </div>

                  ))}

                </div>

              ) : (

                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">

                  <div className="text-3xl">
                    🛡️
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-slate-800">
                    No social-engineering techniques detected
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-slate-500">
                    The analyzed message does not contain
                    significant behavioral attack patterns.
                  </p>

                </div>

              )}

            </div>

          </div>


          {/* SUMMARY */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <SectionTitle
              icon="◎"
              title="Investigation Summary"
              subtitle="Current intelligence available for this message"
            />

            <div className="mt-5 divide-y divide-slate-100">

              <SummaryRow
                label="Social Engineering"
                value={`${score}/100`}
                color={risk.color}
              />

              <SummaryRow
                label="Detection"
                value={
                  detected
                    ? "Threat detected"
                    : "No threat detected"
                }
                color={
                  detected
                    ? "#dc2626"
                    : "#16a34a"
                }
              />

              <SummaryRow
                label="Techniques"
                value={`${techniques.length} detected`}
              />

              <SummaryRow
                label="Evidence"
                value={`${evidence.length} snippets`}
              />

              <SummaryRow
                label="Phishing Score"
                value={`${phishingScore}%`}
              />

              <SummaryRow
                label="IP Intelligence"
                value={
                  ipTracing.status || "Not available"
                }
                color={
                  ipTracing.status === "SUCCESS"
                    ? "#16a34a"
                    : "#64748b"
                }
              />

            </div>

          </div>

        </section>


        {/* ==================================================
            RECOMMENDATION
        ================================================== */}

        <section
          className={`mt-5 rounded-3xl border p-6 shadow-sm ${
            score >= 70
              ? "border-red-200 bg-red-50"
              : score >= 40
              ? "border-amber-200 bg-amber-50"
              : "border-green-200 bg-green-50"
          }`}
        >

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ${
                score >= 40
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {score >= 40 ? "⚠️" : "🛡️"}
            </div>

            <div className="flex-1">

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Security Recommendation
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-900">
                {social.recommendation ||
                  "No recommendation available."}
              </h2>

              <p className="mt-2 text-xs leading-6 text-slate-600">
                This recommendation is based on the behavioral
                indicators returned by the social-engineering
                analysis engine.
              </p>

            </div>

          </div>

        </section>


        {/* ==================================================
            MESSAGE METADATA
        ================================================== */}

        <div className="mt-5 flex flex-col gap-2 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">

          <span>
            Social Engineering Analysis Engine
          </span>

          <span>
            Message ID:{" "}
            {full.message_id || "Unavailable"}
          </span>

        </div>

      </main>

    </div>
  );
};


// ============================================================
// COMPONENTS
// ============================================================

const MiniStat = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
};


const SignalCard = ({
  icon,
  label,
  detected,
}) => {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        detected
          ? "border-red-200"
          : "border-slate-200"
      }`}
    >

      <div className="flex items-center justify-between">

        <span className="text-xl">
          {icon}
        </span>

        <StatusBadge detected={detected} />

      </div>

      <p className="mt-4 text-xs font-bold text-slate-800">
        {label}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {detected
          ? "Indicator detected"
          : "No indicator detected"}
      </p>

    </div>
  );
};


const StatusBadge = ({ detected }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold ${
        detected
          ? "bg-red-50 text-red-600"
          : "bg-green-50 text-green-600"
      }`}
    >

      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          detected
            ? "bg-red-500"
            : "bg-green-500"
        }`}
      />

      {detected ? "Detected" : "Clear"}

    </span>
  );
};


const SectionTitle = ({
  icon,
  title,
  subtitle,
}) => {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm text-blue-600">
        {icon}
      </div>

      <div>

        <h2 className="text-base font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>

      </div>

    </div>
  );
};


const CorrelationCard = ({
  title,
  value,
  subtitle,
  color,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

      <div
        className="h-1.5 w-10 rounded-full"
        style={{
          backgroundColor: color,
        }}
      />

      <p className="mt-4 text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p
        className="mt-2 text-2xl font-black"
        style={{
          color,
        }}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {subtitle}
      </p>

    </div>
  );
};


const FlowStep = ({
  number,
  title,
  description,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">

      <span className="text-[9px] font-black text-blue-500">
        {number}
      </span>

      <p className="mt-2 text-sm font-bold text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>

    </div>
  );
};


const FlowLine = () => {
  return (
    <div className="hidden items-center justify-center md:flex">
      <span className="text-slate-300">
        →
      </span>
    </div>
  );
};


const SummaryRow = ({
  label,
  value,
  color,
}) => {
  return (
    <div className="flex items-center justify-between py-3.5">

      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>

      <span
        className="text-xs font-bold text-slate-800"
        style={{
          color: color || undefined,
        }}
      >
        {value}
      </span>

    </div>
  );
};


export default SocialPage;