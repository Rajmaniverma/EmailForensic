import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_URL = "https://emailforensic.onrender.com";

/*
  AnalyzerDashboard
  ------------------
  Main/general security overview only.

  This dashboard uses the existing unified analysis response:
  {
    message_id,
    email,
    detection_engine,
    phishing,
    social,
    ip_tracing
  }

  The detailed phishing, social-engineering and IP intelligence
  stays on their respective pages.
*/

export default function AnalyzerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get("message_id");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("access_token");

  const fetchCachedAnalysis = async () => {
    if (!messageId) {
      setError("Message ID is missing.");
      setLoading(false);
      return false;
    }

    const token = getToken();
    if (!token) {
      navigate("/", { replace: true });
      return false;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/gmail/cached-analysis/${encodeURIComponent(messageId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setResult(data.data);
        return true;
      }

      setResult(null);
      return false;
    } catch (err) {
      console.error("Cache fetch error:", err);
      setResult(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const runFullAnalysis = async () => {
    const token = getToken();

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    if (!messageId) {
      setError("Message ID is missing.");
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

      const data = await response.json();

      if (!response.ok || !data.success || !data.data) {
        throw new Error(
          data?.detail || data?.message || "Analysis request failed."
        );
      }

      timers.forEach(clearTimeout);
      setProgress(100);
      setResult(data.data);
    } catch (err) {
      timers.forEach(clearTimeout);
      setProgress(0);
      setError(err.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchCachedAnalysis();
  }, [messageId]);

  // ------------------------------------------------------------
  // DATA FROM THE ACTUAL ANALYSIS RESPONSE
  // ------------------------------------------------------------

  const detection =
    result?.detection_engine ||
    result?.Detection_engine_data ||
    {};

  const features = detection?.features || {};
  const ai = detection?.ai_analysis || {};

  // Detection reasons returned by the backend.
  const reasons = Array.isArray(ai?.reasons) ? ai.reasons : [];
  const email = result?.email || result?.email_data || {};
  const authentication = email?.authentication || {};
  const ipForensics = result?.ip_tracing?.ip_forensics || {};

const ipSummary = ipForensics?.summary || {};

const originAnalysis = ipForensics?.origin_analysis || {};

const ipRecords = Array.isArray(ipForensics?.ip_records)
  ? ipForensics.ip_records
  : [];

  const threatScore = Number(
    detection?.threat_score ??
    detection?.ai_analysis?.threat_score ??
    0
  );

  const safeScore = Number(
    detection?.safe_score ??
    detection?.ai_analysis?.safe_score ??
    0
  );

  // The backend response contains urgency/pressure inside ai_analysis.body.
  // Calculate this BEFORE overallRisk uses it.
  const urgency =
    Boolean(ai?.body?.urgency) ||
    Boolean(ai?.body?.pressure) ||
    Boolean(ai?.body_analysis?.urgency) ||
    Boolean(ai?.body_analysis?.pressure) ||
    Boolean(ai?.subject_analysis?.urgency) ||
    Number(features?.urgent_count ?? 0) > 0;

  const riskLevel = String(
    ai?.risk_level ||
    detection?.risk_level ||
    (threatScore >= 70 ? "high" : threatScore >= 40 ? "medium" : "low")
  ).toLowerCase();

  const overallRisk = useMemo(() => {
    if (threatScore >= 70 || riskLevel === "high") {
      return {
        label: "High Risk",
        description:
          "Strong indicators of malicious or manipulative behavior were detected.",
        bg: "bg-[#fce8e6]",
        border: "border-[#f5c2c0]",
        text: "text-[#c5221f]",
        dot: "bg-[#d93025]",
      };
    }

    if (threatScore >= 40 || riskLevel === "medium") {
      return {
        label: "Medium Risk",
        description:
          "Some security indicators require additional verification.",
        bg: "bg-[#fef7e0]",
        border: "border-[#f6d98b]",
        text: "text-[#b06000]",
        dot: "bg-[#f9ab00]",
      };
    }

    return {
      label: "Low Risk",
      description: urgency
        ? "No strong phishing indicators were detected, but urgency or pressure language was identified."
        : "No strong indicators of malicious or suspicious behavior were detected.",
      bg: "bg-[#e6f4ea]",
      border: "border-[#b7dfc2]",
      text: "text-[#137333]",
      dot: "bg-[#1e8e3e]",
    };
  }, [threatScore, riskLevel]);

  const auth = {
    spf: normalizeAuth(authentication?.spf),
    dkim: normalizeAuth(authentication?.dkim),
    dmarc: normalizeAuth(authentication?.dmarc),
  };

  const authPassed =
    [auth.spf, auth.dkim, auth.dmarc].filter(
      (value) => String(value).toLowerCase() === "pass"
    ).length;

  const urlCount = Number(
    features?.url_count ??
    email?.urls?.length ??
    0
  );

  const attachmentCount = Number(
    features?.attachment_count ??
    email?.attachments?.length ??
    0
  );

  const textLength = Number(features?.text_length ?? 0);

  const suspiciousTldCount = Number(
    features?.suspicious_tld_count ?? 0
  );

  const replyToMismatch = Number(
    features?.reply_to_mismatch ?? 0
  );

  const credentialCount = Number(
    features?.credential_count ?? 0
  );

const ipAddress =
  originAnalysis?.original_sender_ip ||
  originAnalysis?.earliest_observable_ip ||
  ipSummary?.earliest_observable_ip ||
  "Not available";

const firstIpRecord =
  ipRecords.find(
    (record) => record?.ip === ipAddress
  ) ||
  ipRecords[0] ||
  {};

const country =
  firstIpRecord?.geolocation?.country ||
  originAnalysis?.geolocation?.country ||
  "Not available";

const city =
  firstIpRecord?.geolocation?.city ||
  originAnalysis?.geolocation?.city ||
  "Not available";

  const detectionPrediction =
    detection?.prediction ||
    detection?.label ||
    detection?.risk_level ||
    ai?.risk_level ||
    (threatScore >= 70 ? "Malicious" : threatScore >= 40 ? "Suspicious" : "Likely Safe");

  const safePercent = Math.min(100, Math.max(0, safeScore || 0));

  const openTool = (path) => {
    navigate(`${path}?message_id=${encodeURIComponent(messageId || "")}`);
  };

  // ------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="bg-white border border-[#dbe7f5] rounded-2xl px-8 py-7 shadow-sm text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-[#dbe7f5] border-t-[#2563eb] animate-spin" />
          <p className="mt-4 text-sm font-semibold text-[#173b66]">
            Loading email analysis...
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // NO ANALYSIS
  // ------------------------------------------------------------

  if (!result) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            navigate={navigate}
            onAnalyze={runFullAnalysis}
            analyzing={analyzing}
          />

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-[#fce8e6] border border-[#f5c2c0] text-[#c5221f] text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 bg-white border border-[#dbe7f5] rounded-2xl p-10 text-center">
            <div className="text-5xl">🔍</div>
            <h2 className="mt-4 text-xl font-bold text-[#173b66]">
              No analysis available
            </h2>
            <p className="mt-2 text-sm text-[#6b7c93]">
              Run the analysis to generate the security overview for this email.
            </p>
            <button
              onClick={runFullAnalysis}
              disabled={analyzing}
              className="mt-6 px-5 py-3 rounded-xl bg-[#2563eb] text-white text-sm font-semibold hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {analyzing ? `Analyzing ${progress}%` : "Analyze Email"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // DASHBOARD
  // ------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-[#173b66]">
      <div className="max-w-[1500px] mx-auto p-5 lg:p-7">

        <PageHeader
          navigate={navigate}
          onAnalyze={runFullAnalysis}
          analyzing={analyzing}
          progress={progress}
        />

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-[#fce8e6] border border-[#f5c2c0] text-[#c5221f] text-sm">
            {error}
          </div>
        )}

        {/* ====================================================
            TOP: OVERALL SECURITY + AUTHENTICATION
        ==================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-5">

          {/* Overall security */}
          <div
            className={`xl:col-span-5 rounded-2xl border ${overallRisk.border} ${overallRisk.bg} p-6`}
          >
            <div className="flex items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3.5 h-3.5 rounded-full ${overallRisk.dot}`}
                  />
                  <h2 className={`text-2xl font-bold ${overallRisk.text}`}>
                    {overallRisk.label}
                  </h2>
                </div>

                <p className="mt-4 max-w-md text-sm leading-6 text-[#536981]">
                  {overallRisk.description}
                </p>

                <div className="mt-5 flex gap-3">
                  <div className="rounded-xl bg-white/75 border border-black/5 px-4 py-2.5">
                    <p className="text-[11px] text-[#71839a]">Threat score</p>
                    <p className={`text-lg font-bold ${overallRisk.text}`}>
                      {threatScore}/100
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/75 border border-black/5 px-4 py-2.5">
                    <p className="text-[11px] text-[#71839a]">Safe score</p>
                    <p className="text-lg font-bold text-[#137333]">
                      {safeScore}/100
                    </p>
                  </div>
                </div>
              </div>

              <ScoreRing value={threatScore} />
            </div>
          </div>

          {/* Authentication */}
          <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
            <AuthenticationCard
              title="SPF"
              description="Sender Policy Framework"
              value={auth.spf}
            />
            <AuthenticationCard
              title="DKIM"
              description="DomainKeys Identified Mail"
              value={auth.dkim}
            />
            <AuthenticationCard
              title="DMARC"
              description="Domain-based Message Authentication"
              value={auth.dmarc}
            />
          </div>
        </div>

        {/* Authentication summary */}
        <div className="bg-white border border-[#dbe7f5] rounded-2xl p-4 mb-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#e6f4ea] text-[#137333] flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-semibold text-[#173b66]">
                Authentication Summary
              </h3>
              <p className="mt-1 text-sm text-[#536981]">
                {authPassed === 3
                  ? "SPF, DKIM and DMARC all passed. The email passed the available sender-authentication checks."
                  : `${authPassed}/3 authentication checks passed. Additional verification is recommended.`}
              </p>
            </div>
          </div>
        </div>

        {/* ====================================================
            EMAIL / IP / CONTENT
        ==================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-5">

          <InfoPanel
            className="xl:col-span-5"
            icon="✉"
            title="Email Information"
          >
            <InfoRow label="Subject" value={email?.subject} />
            <InfoRow label="From" value={email?.from} />
            <InfoRow label="To" value={email?.to} />
            <InfoRow label="Reply-To" value={email?.reply_to} />
            <InfoRow label="Return-Path" value={email?.return_path} />
            <InfoRow label="Date" value={email?.date} />
            <InfoRow label="Message ID" value={email?.message_id} mono />
          </InfoPanel>

<InfoPanel
  className="xl:col-span-3"
  icon="●"
  title="IP Information"
>
  <InfoRow
    label="Original Sender IP"
    value={
      originAnalysis?.original_sender_ip ||
      "Not established"
    }
    mono
  />

  <InfoRow
    label="Earliest Observable IP"
    value={
      originAnalysis?.earliest_observable_ip ||
      "Not available"
    }
    mono
  />

  <InfoRow
    label="Location"
    value={country}
  />

  <InfoRow
    label="City"
    value={city}
  />

  <InfoRow
    label="Status"
    value={
      originAnalysis?.origin_status ||
      "Unknown"
    }
  />

  <InfoRow
    label="Confidence"
    value={
      originAnalysis?.confidence ||
      "Unknown"
    }
  />
</InfoPanel>
          <InfoPanel
            className="xl:col-span-4"
            icon="▤"
            title="Content Overview"
          >
            <InfoRow label="URL Count" value={urlCount} />
            <InfoRow label="Attachment Count" value={attachmentCount} />
            <InfoRow
              label="Text Length"
              value={`${textLength.toLocaleString()} characters`}
            />
            <InfoRow
              label="Content Type"
              value={email?.["Content-type"] || "Not available"}
            />
            <InfoRow
              label="Suspicious TLDs"
              value={suspiciousTldCount}
            />
            <InfoRow
              label="Reply-To Mismatch"
              value={replyToMismatch > 0 ? "Yes" : "No"}
            />
          </InfoPanel>
        </div>

        {/* ====================================================
            SECURITY INDICATORS / SUMMARY / DETECTION
        ==================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

          <InfoPanel icon="◆" title="Security Indicators">
            <IndicatorRow
              label="Credential Signals"
              value={credentialCount > 0 ? "Yes" : "No"}
              positive={credentialCount === 0}
            />
            <IndicatorRow
              label="Urgency Signals"
              value={urgency ? "Yes" : "No"}
              positive={!urgency}
            />
            <IndicatorRow
              label="Suspicious TLDs"
              value={suspiciousTldCount > 0 ? "Yes" : "No"}
              positive={suspiciousTldCount === 0}
            />
            <IndicatorRow
              label="Reply-To Mismatch"
              value={replyToMismatch > 0 ? "Yes" : "No"}
              positive={replyToMismatch === 0}
            />
          </InfoPanel>

          <InfoPanel icon="▣" title="Quick Summary">
            <div className="text-sm leading-6 text-[#536981]">
              {threatScore === 0 && authPassed === 3 ? (
                <>
                  <strong className="text-[#173b66]">
                    The email currently appears low risk.
                  </strong>{" "}
                  SPF, DKIM and DMARC passed, and the threat score is{" "}
                  <strong>{threatScore}/100</strong>.
                  {urgency && (
                    <>
                      {" "}However, urgency or pressure language was detected,
                      so normal verification is still recommended.
                    </>
                  )}
                </>
              ) : (
                <>
                  The email requires additional review based on the available
                  security indicators. Check the detailed analysis modules
                  before taking action.
                </>
              )}
            </div>
          </InfoPanel>

          <InfoPanel icon="◎" title="Detection Result">
            <div
              className={`rounded-xl border p-5 ${
                threatScore >= 70
                  ? "bg-[#fce8e6] border-[#f5c2c0]"
                  : threatScore >= 40
                  ? "bg-[#fef7e0] border-[#f6d98b]"
                  : "bg-[#e6f4ea] border-[#b7dfc2]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                    threatScore >= 70
                      ? "bg-[#d93025] text-white"
                      : threatScore >= 40
                      ? "bg-[#f9ab00] text-white"
                      : "bg-[#1e8e3e] text-white"
                  }`}
                >
                  {threatScore >= 70 ? "!" : "✓"}
                </span>
                <div>
                  <p className="font-bold text-[#173b66]">
                    {String(detectionPrediction)}
                  </p>
                  <p className="text-xs text-[#6b7c93] mt-0.5">
                    Based on the analyzed security indicators.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-[#6b7c93]">
                <span>Safe score</span>
                <span className="font-semibold text-[#173b66]">
                  {safePercent}/100
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#e7edf5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1e8e3e]"
                  style={{ width: `${safePercent}%` }}
                />
              </div>
            </div>
          </InfoPanel>
        </div>

        {/* ====================================================
            DETECTION REASONS
        ==================================================== */}
        <section className="bg-white border border-[#dbe7f5] rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-[#e7edf5] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#edf4ff] text-[#173b66] flex items-center justify-center font-bold">
              🔎
            </div>

            <div>
              <h2 className="font-bold text-[#173b66]">
                Detection Reasons
              </h2>

              <p className="text-[11px] text-[#7b8da6] mt-0.5">
                Key reasons contributing to the security assessment.
              </p>
            </div>
          </div>

          <div className="p-5">
            {reasons.length > 0 ? (
              <div className="space-y-3">
                {reasons.map((reason, index) => {
                  const positive =
                    / no_request|no_fake|no_suspicious|no_phishing/i.test(
                      String(reason)
                    );

                  return (
                    <div
                      key={`${index}-${reason}`}
                      className={`flex items-start gap-3 rounded-xl border p-4 ${
                        positive
                          ? "bg-[#f8fbfd] border-[#e3ebf5]"
                          : "bg-[#f8fbfd] border-[#e3ebf5]"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold ${
                          positive
                            ? "bg-[#e6f4ea] text-[#137333]"
                            : "bg-[#e6f4ea] text-[#137333]"
                        }`}
                      >
                        {positive ? "✓" : "🔸"}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#173b66]">
                          Reason {index + 1}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[#536981] break-words">
                          {reason}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-[#f8fafc] border border-[#e3ebf5] p-4 text-sm text-[#6b7c93]">
                No detection reasons were returned by the analysis engine.
              </div>
            )}
          </div>
        </section>

        {/* ====================================================
            DETAILED MODULE NAVIGATION
        ==================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

          <NavigationCard
            icon="🎣"
            title="Phishing Analysis"
            description="Open the detailed phishing page for links, impersonation, credentials, suspicious indicators and phishing-specific findings."
            buttonText="Open Phishing Analysis"
            onClick={() => openTool("/phishing")}
          />

          <NavigationCard
            icon="👥"
            title="Social Engineering"
            description="Open the detailed social-engineering analysis for urgency, pressure, fear, manipulation and impersonation signals."
            buttonText="Open Social Engineering"
            onClick={() => openTool("/social")}
          />

          <NavigationCard
            icon="🌐"
            title="IP Tracing"
            description="Open the complete IP intelligence page for ASN, ISP, organization, hosting, proxy, coordinates and map information."
            buttonText="Open IP Tracing"
            onClick={() => openTool("/ip-tracing")}
          />
        </div>

        {/* Bottom information bar */}
        <div className="rounded-xl bg-[#e8f1ff] border border-[#c7dbf5] px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold">
            i
          </div>
          <p className="text-sm text-[#174ea6]">
            This dashboard is the general email-security overview. Use
            Phishing Analysis, Social Engineering and IP Tracing for detailed
            forensic investigation.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HEADER
// ============================================================

function PageHeader({ navigate, onAnalyze, analyzing, progress }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-[#102a43]">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm lg:text-base text-[#536981]">
          Quick overview of email security analysis
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#dbe7f5] text-[#536981] text-sm font-semibold hover:bg-[#f8fbff]"
        >
          ← Back
        </button>
        <button
          onClick={() => openTool("/Forensicreport")}
          className="px-5 py-2.5 rounded-xl bg-[#2563eb] text-white text-sm font-semibold shadow-sm hover:bg-[#1d4ed8] disabled:opacity-60 hover:scale-105 active:scale-95 cursor-pointer"
        >
          Forensic Report
        </button>

        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className="px-5 py-2.5 rounded-xl bg-[#2563eb] text-white text-sm font-semibold shadow-sm hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          {analyzing ? `Analyzing ${progress || 0}%` : "↥  Analyze New Email"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function ScoreRing({ value }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  const ringColor =
    safeValue >= 70
      ? "#d93025"
      : safeValue >= 40
      ? "#f9ab00"
      : "#1e8e3e";

  const ringTrack =
    safeValue >= 70
      ? "#f5d2cf"
      : safeValue >= 40
      ? "#f7e4b7"
      : "#dcebe2";

  return (
    <div
      className="relative w-28 h-28 rounded-full flex items-center justify-center shrink-0"
      style={{
        background: `conic-gradient(${ringColor} ${safeValue * 3.6}deg, ${ringTrack} 0deg)`,
      }}
    >
      <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#173b66]">
          {safeValue}
        </span>
        <span className="text-[11px] text-[#71839a]">/ 100</span>
      </div>
    </div>
  );
}

function AuthenticationCard({ title, description, value }) {
  const passed = String(value || "").toLowerCase() === "pass";

  return (
    <div
      className={`rounded-2xl border p-5 ${
        passed
          ? "bg-[#eaf7ef] border-[#c5e5d0]"
          : "bg-[#fff7e8] border-[#f2d89d]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            passed
              ? "bg-[#1e8e3e] text-white"
              : "bg-[#f9ab00] text-white"
          }`}
        >
          {passed ? "✓" : "!"}
        </div>

        <div>
          <p className="text-sm font-bold text-[#173b66]">{title}</p>
          <p
            className={`text-xl font-bold ${
              passed ? "text-[#137333]" : "text-[#b06000]"
            }`}
          >
            {value || "Unknown"}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-[#6b7c93]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoPanel({ title, icon, children, className = "" }) {
  return (
    <section
      className={`bg-white border border-[#dbe7f5] rounded-2xl shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 border-b border-[#e7edf5] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#edf4ff] text-[#173b66] flex items-center justify-center font-bold">
          {icon}
        </div>
        <h2 className="font-bold text-[#173b66]">{title}</h2>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="grid grid-cols-[115px_1fr] gap-4 py-2.5 border-b border-[#edf1f6] last:border-b-0">
      <span className="text-xs font-medium text-[#536981]">{label}</span>
      <span
        className={`text-xs text-[#173b66] break-all ${
          mono ? "font-mono" : ""
        }`}
      >
        {formatValue(value)}
      </span>
    </div>
  );
}

function IndicatorRow({ label, value, positive }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[#edf1f6] last:border-b-0">
      <span className="text-xs text-[#536981]">{label}</span>
      <span
        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          positive
            ? "bg-[#e8edf3] text-[#40556d]"
            : "bg-[#fce8e6] text-[#c5221f]"
        }`}
      >
        {value}
      </span>
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
      <div className="w-11 h-11 rounded-xl bg-[#eaf2ff] flex items-center justify-center text-xl">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-[#173b66]">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#6b7c93]">
        {description}
      </p>

      <button
        onClick={onClick}
        className="mt-4 px-3.5 py-2 rounded-lg bg-[#e8f1ff] border border-[#c7dbf5] text-[#2563eb] text-xs font-semibold hover:bg-[#dbe9fc] transition"
      >
        {buttonText} →
      </button>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function normalizeAuth(value) {
  if (Array.isArray(value)) {
    const pass = value.find((item) =>
      String(item).toLowerCase().includes("pass")
    );

    if (pass) return "Pass";
    if (value.length) return String(value[0]);
    return "";
  }

  if (typeof value === "string") {
    const match = value.match(/pass|fail|none|neutral/i);
    return match ? match[0][0].toUpperCase() + match[0].slice(1).toLowerCase() : value;
  }

  if (value && typeof value === "object") {
    if (value.result) return normalizeAuth(value.result);
    if (value.status) return normalizeAuth(value.status);
  }

  return "";
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "None";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
