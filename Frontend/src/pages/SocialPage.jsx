import React, { useEffect, useState } from "react";

const API_URL = "https://emailforensic.onrender.com";

const SocialPage = () => {
  const [data, setData] = useState(null);
  const [fullData, setFullData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  // ============================================================
  // FETCH ANALYSIS
  // ============================================================

  useEffect(() => {
    const fetchSocial = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const params = new URLSearchParams(
          window.location.search
        );

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
            result?.detail ||
              "Failed to fetch analysis"
          );
        }

        if (!result.success || !result.data) {
          throw new Error(
            "Analysis data not found"
          );
        }

        if (!result.data.social) {
          throw new Error(
            "Social engineering analysis is not available"
          );
        }

        // Store BOTH social and complete analysis
        setData(result.data.social);
        setFullData(result.data);

      } catch (err) {
        console.error("Social Error:", err);

        setError(
          err.message ||
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
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">

        <div className="text-center">

          <div className="relative mx-auto h-20 w-20">

            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />

            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />

            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              🧠
            </div>

          </div>

          <h1 className="mt-6 text-xl font-bold text-slate-900">
            Analyzing Social Engineering
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Loading behavioral threat intelligence...
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
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center p-6">

        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Analysis Unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Retry
          </button>

        </div>

      </div>
    );
  }

  // ============================================================
  // NO DATA
  // ============================================================

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">

        <p className="text-sm text-slate-500">
          No social engineering analysis found.
        </p>

      </div>
    );
  }

  // ============================================================
  // ACTUAL BACKEND DATA
  // ============================================================

  const score = Number(
    data.social_engineering_score ?? 0
  );

  const detected = Boolean(data.detected);

  const authorityImpersonation =
    Boolean(data.authority_impersonation);

  const urgency = Boolean(data.urgency);

  const fear = Boolean(data.fear);

  const reward = Boolean(data.reward);

  const secrecy = Boolean(data.secrecy);

  const evidence = Array.isArray(data.evidence)
    ? data.evidence
    : [];

  const techniques = Array.isArray(data.techniques)
    ? data.techniques
    : [];

  const explanation =
    data.explanation ||
    "No explanation was provided by the analysis engine.";

  const recommendation =
    data.recommendation ||
    "No recommendation was provided.";

  const riskImpact =
    data.risk_impact ||
    "No risk impact information was provided.";

  // ============================================================
  // RISK LEVEL
  // Based ONLY on social_engineering_score
  // ============================================================

  let riskLevel = "MINIMAL";
  let riskColor = "#16a34a";
  let riskBg = "bg-green-50";
  let riskBorder = "border-green-200";
  let riskText = "text-green-700";

  if (score >= 70) {
    riskLevel = "HIGH";
    riskColor = "#dc2626";
    riskBg = "bg-red-50";
    riskBorder = "border-red-200";
    riskText = "text-red-700";
  } else if (score >= 40) {
    riskLevel = "MEDIUM";
    riskColor = "#d97706";
    riskBg = "bg-amber-50";
    riskBorder = "border-amber-200";
    riskText = "text-amber-700";
  } else if (score >= 15) {
    riskLevel = "LOW";
    riskColor = "#2563eb";
    riskBg = "bg-blue-50";
    riskBorder = "border-blue-200";
    riskText = "text-blue-700";
  }

  // ============================================================
  // ACTUAL SOCIAL SIGNALS FROM BACKEND
  // ============================================================

  const signals = [
    {
      name: "Urgency",
      value: urgency,
      icon: "⏱️",
      description: urgency
        ? "Urgency cues detected."
        : "No urgency cues detected.",
    },

    {
      name: "Fear",
      value: fear,
      icon: "⚠️",
      description: fear
        ? "Fear or threat cues detected."
        : "No fear or threat cues detected.",
    },

    {
      name: "Authority Impersonation",
      value: authorityImpersonation,
      icon: "👤",
      description: authorityImpersonation
        ? "Authority impersonation detected."
        : "No authority impersonation detected.",
    },

    {
      name: "Reward",
      value: reward,
      icon: "🎁",
      description: reward
        ? "Reward-related manipulation detected."
        : "No reward cues detected.",
    },

    {
      name: "Secrecy",
      value: secrecy,
      icon: "🔒",
      description: secrecy
        ? "Secrecy cues detected."
        : "No secrecy cues detected.",
    },
  ];

  const detectedSignals = signals.filter(
    (signal) => signal.value
  );

  // ============================================================
  // SCORE CIRCLE
  // ============================================================

  const radius = 52;

  const circumference =
    2 * Math.PI * radius;

  const strokeOffset =
    circumference -
    (score / 100) * circumference;

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
      id: "signals",
      label: "Behavioral Indicators",
      icon: "◈",
    },
    {
      id: "techniques",
      label: "Detected Techniques",
      icon: "⚡",
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
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-900">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto max-w-[1450px] px-5 lg:px-8">

          <div className="flex min-h-[82px] items-center justify-between">

            {/* LEFT */}

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-blue-100 text-2xl">
                🧠
              </div>

              <div>

                <div className="flex items-center gap-3">

                  <h1 className="text-xl font-bold tracking-tight">
                    Social Engineering Analysis
                  </h1>

                  <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 sm:inline-flex">
                    AI Security
                  </span>

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Behavioral threat intelligence
                </p>

              </div>

            </div>


            {/* RIGHT */}

            <div className="hidden items-center gap-3 sm:flex">

              <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">

                <span className="h-2 w-2 rounded-full bg-green-500" />

                Analysis Loaded

              </div>

            </div>

          </div>

        </div>

      </header>


      {/* ========================================================
          TABS
      ======================================================== */}

      <div className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-[1450px] overflow-x-auto px-5 lg:px-8">

          <div className="flex min-w-max">

            {tabs.map((tab) => (

              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`relative flex items-center gap-2 px-5 py-4 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >

                <span>
                  {tab.icon}
                </span>

                {tab.label}

                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-blue-600" />
                )}

              </button>

            ))}

          </div>

        </div>

      </div>


      {/* ========================================================
          MAIN
      ======================================================== */}

      <main className="mx-auto max-w-[1450px] px-5 py-7 lg:px-8">


        {/* ======================================================
            OVERVIEW
        ====================================================== */}

        {activeTab === "overview" && (

          <>

            {/* HERO */}

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">

              {/* SCORE CARD */}

              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

                <div className="flex flex-col items-center gap-8 md:flex-row">

                  {/* SCORE */}

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
                        stroke="#e9eef3"
                        strokeWidth="9"
                      />

                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={riskColor}
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                      />

                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">

                      <span
                        className="text-5xl font-black"
                        style={{
                          color: riskColor,
                        }}
                      >
                        {score}
                      </span>

                      <span className="text-xs text-slate-400">
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
                        className={`rounded-full px-3 py-1 text-[10px] font-bold ${riskBg} ${riskText}`}
                      >
                        {riskLevel}
                      </span>

                    </div>


                    <h2 className="mt-3 text-3xl font-black tracking-tight">

                      {detected
                        ? "Social Engineering Detected"
                        : "No Strong Indicators"}

                    </h2>


                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">

                      {explanation}

                    </p>


                    <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">

                      <Metric
                        label="Risk Score"
                        value={`${score}/100`}
                      />

                      <Metric
                        label="Signals"
                        value={`${detectedSignals.length}/5`}
                      />

                      <Metric
                        label="Techniques"
                        value={`${techniques.length}`}
                      />

                      <Metric
                        label="Evidence"
                        value={`${evidence.length}`}
                      />

                    </div>

                  </div>

                </div>

              </div>


              {/* RISK IMPACT */}

              <div
                className={`rounded-3xl border ${riskBorder} ${riskBg} p-6 shadow-sm`}
              >

                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Risk Impact
                </p>


                <div className="mt-5 flex items-start gap-3">

                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        riskColor,
                    }}
                  />

                  <p className="text-sm font-semibold leading-6 text-slate-800">
                    {riskImpact}
                  </p>

                </div>


                <div className="mt-7 border-t border-white/80 pt-5">

                  <p className="text-xs text-slate-500">
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

                    <span className="text-lg font-bold">

                      {detected
                        ? "Threat detected"
                        : "No threat detected"}

                    </span>

                  </div>

                </div>


                <div className="mt-6 rounded-2xl bg-white/70 p-4">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Recommendation
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {recommendation}
                  </p>

                </div>

              </div>

            </section>


            {/* SIGNAL CARDS */}

            <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">

              {signals.map((signal) => (

                <SignalCard
                  key={signal.name}
                  signal={signal}
                />

              ))}

            </section>


            {/* TWO COLUMN */}

            <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">


              {/* RISK BREAKDOWN */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <SectionTitle
                  icon="◈"
                  title="Risk Factor Breakdown"
                  subtitle="Social-engineering indicators returned by the analysis engine"
                />


                <div className="mt-6 space-y-5">

                  {signals.map((signal) => (

                    <div key={signal.name}>

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-xs font-semibold text-slate-700">
                          {signal.name}
                        </span>

                        <StatusBadge
                          detected={
                            signal.value
                          }
                        />

                      </div>


                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: signal.value
                              ? "100%"
                              : "0%",
                            backgroundColor:
                              signal.value
                                ? "#dc2626"
                                : "#22c55e",
                          }}
                        />

                      </div>

                    </div>

                  ))}

                </div>


                {/* TOTAL */}

                <div className="mt-7 border-t border-slate-100 pt-5">

                  <div className="flex items-center justify-between">

                    <span className="text-xs font-bold text-slate-600">
                      Social Engineering Score
                    </span>

                    <span
                      className="text-sm font-black"
                      style={{
                        color: riskColor,
                      }}
                    >
                      {score}/100
                    </span>

                  </div>


                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${score}%`,
                        backgroundColor:
                          riskColor,
                      }}
                    />

                  </div>

                </div>

              </div>


              {/* COMMUNICATION */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <SectionTitle
                  icon="⌁"
                  title="Communication Pattern"
                  subtitle="Behavioral characteristics identified in the email"
                />


                <div className="mt-5 divide-y divide-slate-100">

                  {signals.map((signal) => (

                    <div
                      key={signal.name}
                      className="flex items-center justify-between py-4"
                    >

                      <div className="flex items-center gap-3">

                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                          {signal.icon}
                        </span>

                        <div>

                          <p className="text-xs font-bold text-slate-800">
                            {signal.name}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {signal.description}
                          </p>

                        </div>

                      </div>


                      <StatusBadge
                        detected={signal.value}
                      />

                    </div>

                  ))}

                </div>

              </div>

            </section>


            {/* TECHNIQUES + EVIDENCE */}

            <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

              {/* TECHNIQUES */}

              <TechniquesCard
                techniques={techniques}
              />


              {/* EVIDENCE */}

              <EvidenceCard
                evidence={evidence}
              />

            </section>


            {/* RECOMMENDATION */}

            <RecommendationCard
              score={score}
              recommendation={recommendation}
            />

          </>
        )}


        {/* ======================================================
            BEHAVIORAL INDICATORS
        ====================================================== */}

        {activeTab === "signals" && (

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <SectionTitle
              icon="◈"
              title="Behavioral Indicators"
              subtitle="Detailed social-engineering signal analysis"
            />


            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">

              <div className="grid grid-cols-[1.1fr_0.7fr_2fr] bg-slate-50 px-5 py-4">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Indicator
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Analysis
                </span>

              </div>


              {signals.map((signal) => (

                <div
                  key={signal.name}
                  className="grid grid-cols-[1.1fr_0.7fr_2fr] border-t border-slate-100 px-5 py-5"
                >

                  <div className="flex items-center gap-3">

                    <span>
                      {signal.icon}
                    </span>

                    <span className="text-sm font-semibold">
                      {signal.name}
                    </span>

                  </div>


                  <div>

                    <StatusBadge
                      detected={signal.value}
                    />

                  </div>


                  <p className="text-sm leading-6 text-slate-500">
                    {signal.description}
                  </p>

                </div>

              ))}

            </div>

          </section>
        )}


        {/* ======================================================
            TECHNIQUES
        ====================================================== */}

        {activeTab === "techniques" && (

          <TechniquesCard
            techniques={techniques}
            large
          />

        )}


        {/* ======================================================
            EVIDENCE
        ====================================================== */}

        {activeTab === "evidence" && (

          <EvidenceCard
            evidence={evidence}
            large
          />

        )}


        {/* ======================================================
            AI EXPLANATION
        ====================================================== */}

        {activeTab === "explanation" && (

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">


            {/* EXPLANATION */}

            <div className="rounded-3xl border border-blue-100 bg-white p-7 shadow-sm">

              <SectionTitle
                icon="✦"
                title="AI Explanation"
                subtitle="Explanation returned by the social-engineering analysis engine"
              />


              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                    ✦
                  </div>

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                      Analysis Result
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900">
                      {riskLevel} Risk
                    </p>

                  </div>

                </div>


                <p className="mt-6 text-sm leading-8 text-slate-600">
                  {explanation}
                </p>

              </div>

            </div>


            {/* SIGNAL SUMMARY */}

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

              <SectionTitle
                icon="✓"
                title="Analysis Summary"
                subtitle="Actual indicators returned by the backend"
              />


              <div className="mt-5 space-y-3">

                {signals.map((signal) => (

                  <div
                    key={signal.name}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                  >

                    <div className="flex items-center gap-3">

                      <span>
                        {signal.icon}
                      </span>

                      <span className="text-sm font-semibold">
                        {signal.name}
                      </span>

                    </div>

                    <StatusBadge
                      detected={signal.value}
                    />

                  </div>

                ))}

              </div>

            </div>

          </section>

        )}


        {/* ======================================================
            FOOTER SUMMARY
        ====================================================== */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Social Engineering Analysis
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Result generated from the behavioral indicators returned by the analysis engine.
              </p>

            </div>


            <div className="flex flex-wrap gap-3">

              <FooterMetric
                label="Score"
                value={`${score}/100`}
                color={riskColor}
              />

              <FooterMetric
                label="Techniques"
                value={techniques.length}
              />

              <FooterMetric
                label="Evidence"
                value={evidence.length}
              />

            </div>

          </div>

        </section>

      </main>

    </div>
  );
};


// ============================================================
// METRIC
// ============================================================

const Metric = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-800">
        {value}
      </p>

    </div>
  );
};


// ============================================================
// SIGNAL CARD
// ============================================================

const SignalCard = ({ signal }) => {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        signal.value
          ? "border-red-200"
          : "border-slate-200"
      }`}
    >

      <div className="flex items-center justify-between">

        <span className="text-xl">
          {signal.icon}
        </span>

        <StatusBadge
          detected={signal.value}
        />

      </div>

      <p className="mt-4 text-sm font-bold text-slate-800">
        {signal.name}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {signal.value
          ? "Indicator detected"
          : "No indicator detected"}
      </p>

    </div>
  );
};


// ============================================================
// STATUS BADGE
// ============================================================

const StatusBadge = ({ detected }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${
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

      {detected
        ? "Detected"
        : "Clear"}

    </span>
  );
};


// ============================================================
// SECTION TITLE
// ============================================================

const SectionTitle = ({
  icon,
  title,
  subtitle,
}) => {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>

        <h2 className="text-base font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {subtitle}
        </p>

      </div>

    </div>
  );
};


// ============================================================
// TECHNIQUES CARD
// ============================================================

const TechniquesCard = ({
  techniques,
  large = false,
}) => {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${
        large ? "min-h-[500px]" : ""
      }`}
    >

      <div className="flex items-start justify-between gap-4">

        <SectionTitle
          icon="⚡"
          title="Detected Techniques"
          subtitle="Social-engineering methods identified in the email"
        />

        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600">
          {techniques.length} detected
        </span>

      </div>


      {techniques.length === 0 ? (

        <div className="mt-6 flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-3xl">
            🛡️
          </div>

          <h3 className="mt-5 text-sm font-bold text-slate-800">
            No social-engineering techniques detected
          </h3>

          <p className="mt-2 max-w-md text-xs leading-6 text-slate-500">
            The analysis engine returned an empty techniques
            list for this email.
          </p>

        </div>

      ) : (

        <div className="mt-6 space-y-3">

          {techniques.map(
            (technique, index) => (

              <div
                key={index}
                className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-4"
              >

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  ⚠️
                </div>

                <div>

                  <p className="text-sm font-bold text-slate-800">
                    {typeof technique ===
                    "string"
                      ? technique
                      : technique?.name ||
                        "Unknown Technique"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Social-engineering technique returned by the analysis engine.
                  </p>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </section>
  );
};


// ============================================================
// EVIDENCE CARD
// ============================================================

const EvidenceCard = ({
  evidence,
  large = false,
}) => {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${
        large ? "min-h-[500px]" : ""
      }`}
    >

      <SectionTitle
        icon="⌕"
        title="Evidence"
        subtitle="Evidence snippets returned by the analysis engine"
      />


      {evidence.length === 0 ? (

        <div className="mt-6 flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-600">
            ✓
          </div>

          <h3 className="mt-5 text-sm font-bold text-slate-800">
            No evidence snippets returned
          </h3>

          <p className="mt-2 max-w-md text-xs leading-6 text-slate-500">
            The backend returned an empty evidence array
            for this social-engineering analysis.
          </p>

        </div>

      ) : (

        <div className="mt-6 space-y-3">

          {evidence.map((item, index) => (

            <div
              key={index}
              className="rounded-2xl border border-amber-100 bg-amber-50 p-5"
            >

              <div className="flex gap-3">

                <span className="text-xl text-amber-600">
                  "
                </span>

                <p className="text-sm leading-7 text-slate-700">
                  {String(item).replace(
                    /^"|"$/g,
                    ""
                  )}
                </p>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  );
};


// ============================================================
// RECOMMENDATION
// ============================================================

const RecommendationCard = ({
  score,
  recommendation,
}) => {

  const dangerous = score >= 40;

  return (
    <section
      className={`mt-5 rounded-3xl border p-6 shadow-sm ${
        dangerous
          ? "border-red-200 bg-red-50"
          : "border-green-200 bg-green-50"
      }`}
    >

      <div className="flex items-start gap-4">

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl ${
            dangerous
              ? "text-red-600"
              : "text-green-600"
          }`}
        >
          {dangerous ? "⚠️" : "🛡️"}
        </div>


        <div>

          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Security Recommendation
          </p>

          <h2 className="mt-2 text-base font-bold text-slate-900">
            {recommendation}
          </h2>

          <p className="mt-2 text-xs leading-6 text-slate-600">
            Recommendation returned by the social-engineering analysis engine.
          </p>

        </div>

      </div>

    </section>
  );
};


// ============================================================
// FOOTER METRIC
// ============================================================

const FooterMetric = ({
  label,
  value,
  color,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className="mt-1 text-sm font-black"
        style={{
          color: color || "#0f172a",
        }}
      >
        {value}
      </p>

    </div>
  );
};


export default SocialPage;