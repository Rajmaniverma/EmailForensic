import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_URL = "https://emailforensic.onrender.com";

function AnalyzerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get("message_id");

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("access_token");

  useEffect(() => {
    const loadCached = async () => {
      const token = getToken();

      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      if (!messageId) {
        setError("No message ID was provided.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/gmail/cached-analysis/${encodeURIComponent(messageId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const result = await response.json();

        if (response.ok && result.success && result.data) {
          setAnalysis(result.data);
        } else {
          setAnalysis(null);
        }
      } catch (err) {
        console.error("Analyzer dashboard cache error:", err);
        setError("Unable to load the saved analysis.");
      } finally {
        setLoading(false);
      }
    };

    loadCached();
  }, [messageId, navigate]);

  const runAnalysis = async () => {
    const token = getToken();

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    if (!messageId) {
      setError("No message ID was provided.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setProgress(5);

    const timers = [
      [15, 500],
      [30, 1200],
      [45, 2200],
      [60, 3500],
      [75, 5000],
      [88, 7000],
      [94, 9500],
    ].map(([value, delay]) =>
      setTimeout(() => {
        setProgress((current) => Math.max(current, value));
      }, delay)
    );

    try {
      const response = await fetch(
        `${API_URL}/gmail/full-analysis/${encodeURIComponent(messageId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.detail || result.message || "Analysis request failed."
        );
      }

      timers.forEach(clearTimeout);
      setProgress(100);
      setAnalysis(result.data);
    } catch (err) {
      timers.forEach(clearTimeout);
      setProgress(0);
      setError(err.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const email = analysis?.email || analysis?.email_data || {};
  const detection =
    analysis?.detection_engine ||
    analysis?.Detection_engine_data ||
    {};
  const phishing = analysis?.phishing || {};
  const social = analysis?.social || {};
  const ip = analysis?.ip_tracing || {};

  const phishingScore = Number(phishing?.phishing_score || 0);
  const legitimateScore = Number(phishing?.legitimate_score || 0);
  const socialScore = Number(
    social?.social_engineering_score ?? social?.score ?? 0
  );

  const overallRisk = useMemo(() => {
    if (phishingScore >= 70 || socialScore >= 70) {
      return {
        label: "High Risk",
        text: "Strong indicators of malicious or manipulative behavior were detected.",
        className: "bg-[#fce8e6] text-[#c5221f] border-[#f5c2c0]",
        dot: "bg-[#d93025]",
      };
    }

    if (phishingScore >= 40 || socialScore >= 40) {
      return {
        label: "Suspicious",
        text: "Some security indicators require additional verification.",
        className: "bg-[#fef7e0] text-[#b06000] border-[#f6d98b]",
        dot: "bg-[#f9ab00]",
      };
    }

    return {
      label: "Low Risk",
      text: "No strong phishing or social-engineering score was detected.",
      className: "bg-[#e6f4ea] text-[#137333] border-[#b7dfc2]",
      dot: "bg-[#1e8e3e]",
    };
  }, [phishingScore, socialScore]);

  const detectionPrediction =
    detection?.prediction ??
    detection?.result ??
    detection?.label ??
    "Unavailable";

  const aiAnalysis = safeJson(
    detection?.ai_analysis ||
      phishing?.ai_analysis ||
      {}
  );

  const urls = Array.isArray(email?.urls) ? email.urls : [];
  const attachments = Array.isArray(email?.attachments)
    ? email.attachments
    : [];

  const openTool = (path) => {
    if (!messageId) return;
    navigate(`${path}?message_id=${encodeURIComponent(messageId)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center">
            <span className="text-2xl animate-pulse">🛡️</span>
          </div>
          <p className="mt-4 text-sm font-medium text-[#3c4043]">
            Preparing Analyzer Dashboard
          </p>
          <p className="mt-1 text-xs text-[#80868b]">
            Loading the temporary security report...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#202124] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-[1500px] mx-auto px-5 lg:px-8 h-[72px] flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition"
            title="Go back"
          >
            ←
          </button>

          <div className="w-11 h-11 rounded-2xl bg-[#e8f0fe] flex items-center justify-center">
            <span className="text-xl">🛡️</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[#202124]">
                Analyzer Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] text-[10px] font-bold uppercase tracking-wide">
                MailGuard
              </span>
            </div>
            <p className="text-xs text-[#5f6368] truncate max-w-[620px]">
              Unified forensic security report for this email
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => openTool("/email/" + encodeURIComponent(messageId))}
              className="hidden sm:inline-flex px-4 py-2 rounded-lg border border-[#dadce0] bg-white text-xs font-medium text-[#3c4043] hover:bg-[#f8f9fa]"
            >
              View Email
            </button>

            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a73e8] text-white text-xs font-semibold hover:bg-[#1765cc] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              <span>{analyzing ? "⟳" : "⚡"}</span>
              {analyzing ? "Analyzing..." : analysis ? "Re-run Analysis" : "Analyze Email"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-5 lg:px-8 py-7">
        {/* Hero */}
        <section className="rounded-3xl overflow-hidden bg-[#102a56] text-white shadow-sm">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-[#b9d3ff] text-xs font-semibold uppercase tracking-[0.16em]">
                  <span className="w-2 h-2 rounded-full bg-[#34a853]" />
                  Security intelligence
                </div>
                <h2 className="mt-3 text-2xl lg:text-4xl font-semibold tracking-tight">
                  {email?.subject || "Email Security Report"}
                </h2>
                <p className="mt-2 text-sm text-[#d7e5ff]">
                  {email?.from || "Sender unavailable"}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 border border-white/15 px-5 py-4 min-w-[220px]">
                <div className="text-[10px] uppercase tracking-wider text-[#b9d3ff]">
                  Current assessment
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${overallRisk.dot}`} />
                  <span className="text-xl font-semibold">
                    {overallRisk.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {analyzing && (
            <div className="px-6 lg:px-8 pb-6">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[#d7e5ff]">
                    Running unified analysis
                  </span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-[#f5c2c0] bg-[#fce8e6] px-5 py-4 text-sm text-[#c5221f]">
            {error}
          </div>
        )}

        {!analysis && !analyzing && (
          <section className="mt-6 rounded-3xl border border-[#d2e3fc] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#e8f0fe] flex items-center justify-center text-3xl">
              🔎
            </div>
            <h3 className="mt-4 text-xl font-semibold">
              No analysis is cached for this email
            </h3>
            <p className="mt-2 max-w-xl mx-auto text-sm leading-6 text-[#5f6368]">
              Run the analysis once. MailGuard will collect the forensic,
              phishing, social-engineering and IP intelligence into this
              dashboard.
            </p>
            <button
              onClick={runAnalysis}
              className="mt-5 px-6 py-3 rounded-xl bg-[#1a73e8] text-white text-sm font-semibold hover:bg-[#1765cc]"
            >
              Analyze This Email
            </button>
          </section>
        )}

        {analysis && (
          <>
            {/* Summary cards */}
            <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard
                icon="🎣"
                label="Phishing score"
                value={`${phishingScore}%`}
                helper={phishing?.prediction === 1 ? "Phishing indicators found" : "No strong phishing verdict"}
                tone={phishingScore >= 70 ? "danger" : phishingScore >= 40 ? "warning" : "success"}
              />
              <MetricCard
                icon="👥"
                label="Social engineering"
                value={`${socialScore}%`}
                helper={social?.detected ? "Manipulation technique detected" : "No technique detected"}
                tone={socialScore >= 70 ? "danger" : socialScore >= 40 ? "warning" : "success"}
              />
              <MetricCard
                icon="🔗"
                label="URLs discovered"
                value={phishing?.features?.url_count ?? urls.length ?? 0}
                helper={`${phishing?.features?.long_url_count ?? 0} long URL(s)`}
                tone="blue"
              />
              <MetricCard
                icon="🌐"
                label="Origin IP"
                value={ip?.ip || email?.origin_ip || "N/A"}
                helper={ip?.country ? `${ip.city || ""}${ip.city ? ", " : ""}${ip.country}` : "Network location unavailable"}
                tone="purple"
              />
            </section>

            {/* Risk + quick actions */}
            <section className="mt-6 grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-5">
              <div className={`rounded-3xl border p-6 ${overallRisk.className}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center text-2xl">
                    {overallRisk.label === "High Risk" ? "🚨" : overallRisk.label === "Suspicious" ? "⚠️" : "✓"}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider font-bold opacity-70">
                      Overall security posture
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold">
                      {overallRisk.label}
                    </h3>
                    <p className="mt-2 text-sm leading-6 opacity-85">
                      {overallRisk.text}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ScoreMini label="Phishing" value={phishingScore} />
                  <ScoreMini label="Legitimate" value={legitimateScore} />
                  <ScoreMini label="Social" value={socialScore} />
                  <ScoreMini label="Threats" value={phishing?.features?.threat_count ?? 0} suffix="" />
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-[#e5e7eb] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#80868b]">
                      Investigation
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      Security modules
                    </h3>
                  </div>
                  <span className="text-xl">🧭</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <ModuleButton icon="🎣" label="Phishing" onClick={() => openTool("/phishing")} />
                  <ModuleButton icon="👥" label="Social" onClick={() => openTool("/social")} />
                  <ModuleButton icon="🌐" label="IP Tracing" onClick={() => openTool("/ip-tracing")} />
                  <ModuleButton icon="✉️" label="Email Detail" onClick={() => openTool("/email")} />
                </div>
              </div>
            </section>

            {/* Forensic intelligence */}
            <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-5">
              <Panel
                title="Forensic signal"
                subtitle="General detection engine output"
                icon="🧬"
              >
                <div className="grid grid-cols-2 gap-3">
                  <InfoBox label="Prediction" value={String(detectionPrediction)} />
                  <InfoBox
                    label="Text length"
                    value={phishing?.features?.text_length ?? "—"}
                  />
                  <InfoBox
                    label="Credential signals"
                    value={phishing?.features?.credential_count ?? 0}
                  />
                  <InfoBox
                    label="Urgency signals"
                    value={phishing?.features?.urgent_count ?? 0}
                  />
                  <InfoBox
                    label="Suspicious TLDs"
                    value={phishing?.features?.suspicious_tld_count ?? 0}
                  />
                  <InfoBox
                    label="Reply-to mismatch"
                    value={phishing?.features?.reply_to_mismatch ?? 0}
                  />
                </div>

                {Object.keys(aiAnalysis || {}).length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-[#5f6368] mb-3">
                      AI observations
                    </p>
                    <div className="space-y-2">
                      {Object.entries(aiAnalysis).slice(0, 8).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start justify-between gap-4 rounded-xl bg-[#f8f9fa] px-3 py-2.5"
                        >
                          <span className="text-xs font-medium text-[#3c4043]">
                            {pretty(key)}
                          </span>
                          <span className="text-xs text-[#5f6368] text-right">
                            {formatValue(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>

              <Panel
                title="Phishing intelligence"
                subtitle="Indicators extracted from the security model"
                icon="🎣"
              >
                <div className="flex items-center justify-between rounded-2xl bg-[#f8f9fa] p-4">
                  <div>
                    <p className="text-xs text-[#80868b]">Verdict</p>
                    <p className="mt-1 text-lg font-semibold">
                      {phishing?.prediction === 1
                        ? "Potential Phishing"
                        : "No phishing verdict"}
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-[#1a73e8]">
                    {phishingScore}%
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Finding
                    label="Suspicious sender"
                    value={phishing?.features?.suspicious_sender_count ?? phishing?.ai_analysis?.suspicious_sender}
                  />
                  <Finding
                    label="Lookalike domain"
                    value={aiAnalysis?.lookalike_domain}
                  />
                  <Finding
                    label="Malicious URLs"
                    value={countValue(phishing?.features?.ip_url_count)}
                  />
                  <Finding
                    label="Shortened URLs"
                    value={countValue(phishing?.features?.shortened_url_count)}
                  />
                </div>
              </Panel>
            </section>

            {/* Social + IP */}
            <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-5">
              <Panel
                title="Social engineering"
                subtitle="Behavioral manipulation and persuasion signals"
                icon="👥"
              >
                <div className="grid grid-cols-3 gap-3">
                  <InfoBox label="Detected" value={social?.detected ? "Yes" : "No"} />
                  <InfoBox label="Risk impact" value={social?.risk_impact || "—"} />
                  <InfoBox label="Score" value={`${socialScore}%`} />
                </div>

                {Array.isArray(social?.techniques) && social.techniques.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-[#5f6368] mb-2">
                      Techniques
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {social.techniques.map((item, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 rounded-full bg-[#fef7e0] text-[#8a4b00] text-xs font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {social?.explanation && (
                  <div className="mt-5 rounded-2xl bg-[#f8f9fa] p-4">
                    <p className="text-xs font-semibold text-[#5f6368] mb-1">
                      Explanation
                    </p>
                    <p className="text-sm leading-6 text-[#3c4043]">
                      {social.explanation}
                    </p>
                  </div>
                )}

                {social?.recommendation && (
                  <div className="mt-3 rounded-2xl border border-[#d2e3fc] bg-[#f8fbff] p-4">
                    <p className="text-xs font-semibold text-[#1a73e8] mb-1">
                      Recommended action
                    </p>
                    <p className="text-sm leading-6 text-[#3c4043]">
                      {social.recommendation}
                    </p>
                  </div>
                )}
              </Panel>

              <Panel
                title="Network intelligence"
                subtitle="Originating IP and infrastructure"
                icon="🌐"
              >
                <div className="rounded-2xl bg-[#f8f9fa] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-[#80868b]">Origin IP</p>
                      <p className="mt-1 font-mono text-lg font-semibold break-all">
                        {ip?.ip || email?.origin_ip || "Not found"}
                      </p>
                    </div>
                    <span className="text-2xl">📍</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <InfoBox label="Country" value={ip?.country || "—"} />
                  <InfoBox label="City" value={ip?.city || "—"} />
                  <InfoBox label="Region" value={ip?.region_name || ip?.region || "—"} />
                  <InfoBox label="Timezone" value={ip?.timezone || "—"} />
                  <InfoBox label="ISP" value={ip?.isp || "—"} />
                  <InfoBox label="Organization" value={ip?.organization || "—"} />
                  <InfoBox label="ASN" value={ip?.asn || "—"} />
                  <InfoBox label="Hosting" value={ip?.is_hosting ? "Yes" : "No"} />
                </div>
              </Panel>
            </section>

            {/* Email evidence */}
            <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
              <Panel title="Message metadata" subtitle="Identity and routing details" icon="✉️">
                <div className="space-y-3">
                  <MetaRow label="From" value={email?.from || "—"} />
                  <MetaRow label="To" value={email?.to || "—"} />
                  <MetaRow label="CC" value={email?.cc || "—"} />
                  <MetaRow label="Reply-To" value={email?.reply_to || "—"} />
                  <MetaRow label="Return-Path" value={email?.return_path || "—"} />
                  <MetaRow label="Date" value={email?.date || "—"} />
                </div>
              </Panel>

              <Panel title="URL evidence" subtitle="Links discovered in the message" icon="🔗">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#80868b]">
                    Total discovered
                  </span>
                  <span className="text-lg font-semibold">
                    {phishing?.features?.url_count ?? urls.length}
                  </span>
                </div>

                {urls.length > 0 ? (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {urls.slice(0, 12).map((url, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-[#e5e7eb] px-3 py-2.5 bg-white"
                      >
                        <p className="text-xs font-mono text-[#3c4043] break-all">
                          {typeof url === "string"
                            ? url
                            : url?.url || url?.href || JSON.stringify(url)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty text="No URL list was returned by the backend." />
                )}
              </Panel>

              <Panel title="Attachments" subtitle="Files detected in the email" icon="📎">
                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((att, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] px-3 py-3"
                      >
                        <span className="text-xl">📄</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {att?.name ||
                              att?.filename ||
                              `Attachment ${index + 1}`}
                          </p>
                          <p className="text-[11px] text-[#80868b]">
                            {att?.size || "Size unavailable"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty text="No attachments detected." />
                )}
              </Panel>
            </section>

            {/* Bottom identity */}
            <section className="mt-6 rounded-3xl bg-white border border-[#e5e7eb] p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#80868b]">
                    Analysis identity
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#5f6368] break-all">
                    {analysis?.message_id || messageId}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#5f6368]">
                  <span className="w-2 h-2 rounded-full bg-[#34a853]" />
                  Temporary analysis cache
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Panel({ title, subtitle, icon, children }) {
  return (
    <section className="rounded-3xl bg-white border border-[#e5e7eb] shadow-sm p-5 lg:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#f1f3f4] flex items-center justify-center text-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-[#80868b]">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ icon, label, value, helper, tone }) {
  const tones = {
    danger: "bg-[#fce8e6] border-[#f5c2c0]",
    warning: "bg-[#fef7e0] border-[#f6d98b]",
    success: "bg-[#e6f4ea] border-[#b7dfc2]",
    blue: "bg-[#e8f0fe] border-[#c6dafc]",
    purple: "bg-[#f3e8fd] border-[#dec5f2]",
  };

  return (
    <div className={`rounded-2xl border p-5 ${tones[tone] || tones.blue}`}>
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-[#5f6368]">
          {label}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold break-all">{value}</p>
      <p className="mt-1 text-xs text-[#5f6368]">{helper}</p>
    </div>
  );
}

function ScoreMini({ label, value, suffix = "%" }) {
  return (
    <div className="rounded-xl bg-white/65 border border-black/5 p-3">
      <p className="text-[10px] uppercase tracking-wide opacity-65">{label}</p>
      <p className="mt-1 text-lg font-bold">
        {value}
        {suffix}
      </p>
    </div>
  );
}

function ModuleButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 py-3 text-left hover:bg-[#f8f9fa] hover:border-[#c8d7ee] transition"
    >
      <span>{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#edf0f2] bg-[#fafbfc] p-3 min-w-0">
      <p className="text-[10px] uppercase tracking-wide font-semibold text-[#80868b]">
        {label}
      </p>
      <p className="mt-1 text-xs font-medium text-[#3c4043] break-words">
        {formatValue(value)}
      </p>
    </div>
  );
}

function Finding({ label, value }) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === 0 ||
    value === "0"
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#edf0f2] px-3 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-sm">⚠️</span>
        <div>
          <p className="text-xs font-semibold">{label}</p>
          <p className="mt-1 text-xs leading-5 text-[#5f6368] break-words">
            {formatValue(value)}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3 text-xs">
      <span className="font-semibold text-[#80868b]">{label}</span>
      <span className="text-[#3c4043] break-words">{formatValue(value)}</span>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-xl bg-[#f8f9fa] p-5 text-center text-xs text-[#80868b]">
      {text}
    </div>
  );
}

function safeJson(value) {
  if (!value) return {};

  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { observation: value };
    }
  }

  return {};
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function countValue(value) {
  if (value === undefined || value === null) return "0";
  return String(value);
}

function pretty(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default AnalyzerDashboard;
