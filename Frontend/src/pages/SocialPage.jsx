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


function TechniqueStatus({
  label,
  value,
  description,
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        p-4
        transition
        ${
          value
            ? "border-[#c8dbf3] bg-[#f1f6ff]"
            : "border-[#e1e8f1] bg-[#fafcfe]"
        }
      `}
    >

      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <div
            className={`
              w-9
              h-9
              rounded-lg
              flex
              items-center
              justify-center
              text-sm
              font-bold
              ${
                value
                  ? "bg-[#dceaff] text-[#2563eb]"
                  : "bg-[#edf2f7] text-[#8393a7]"
              }
            `}
          >
            {value ? "!" : "✓"}
          </div>

          <div>

            <p className="text-sm font-semibold text-[#274568]">
              {label}
            </p>

            <p className="mt-0.5 text-[11px] text-[#7b8da6]">
              {description}
            </p>

          </div>

        </div>


        <span
          className={`
            px-2.5
            py-1
            rounded-full
            border
            text-[10px]
            font-bold
            ${
              value
                ? "bg-[#e8f1ff] text-[#2563eb] border-[#c8dbf3]"
                : "bg-[#f3f6f9] text-[#71839b] border-[#dfe6ee]"
            }
          `}
        >
          {value ? "DETECTED" : "NO"}
        </span>

      </div>

    </div>
  );
}


function ScoreCircle({ score }) {

  const value = Math.min(
    Math.max(Number(score) || 0, 0),
    100
  );

  const radius = 48;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (value / 100) * circumference;


  return (
    <div className="relative w-36 h-36">

      <svg
        viewBox="0 0 120 120"
        className="w-36 h-36 -rotate-90"
      >

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-[#e8eff7]"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-[#2563eb]"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />

      </svg>


      <div className="absolute inset-0 flex flex-col items-center justify-center">

        <span className="text-3xl font-bold text-[#173b66]">
          {value}
        </span>

        <span className="text-[10px] text-[#7b8da6]">
          / 100
        </span>

      </div>

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

export default function SocialPage() {

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
  // FETCH SOCIAL ENGINEERING ANALYSIS
  // ==========================================================

  const fetchSocialAnalysis =
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
            `${API_URL}/gmail/Social/${encodeURIComponent(
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
        console.log("fetch the social page: ", data)

        if (!response.ok) {

          throw new Error(
            data?.detail ||
              "Failed to fetch social engineering analysis."
          );

        }


        setResult(data);

      } catch (err) {

        console.error(
          "Social engineering error:",
          err
        );

        setError(
          err.message ||
            "Unable to load social engineering analysis."
        );

      } finally {

        setLoading(false);

      }

    };


  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {

    fetchSocialAnalysis();

  }, [messageId]);


  // ==========================================================
  // BACKEND DATA
  // ==========================================================

  const urgency =
    result?.urgency ?? false;

  const authorityImpersonation =
    result?.authority_impersonation ??
    false;

  const fear =
    result?.fear ?? false;

  const reward =
    result?.reward ?? false;

  const secrecy =
    result?.secrecy ?? false;

  const detected =
    result?.detected ?? false;

  const score =
    Number(
      result?.social_engineering_score ?? 0
    );


  // ==========================================================
  // VERDICT
  // ==========================================================

  const verdict = useMemo(() => {

    if (detected) {

      if (score >= 70) {

        return {
          title:
            "High Social Engineering Risk",

          description:
            "The email contains strong indicators of social engineering and manipulation.",

          label:
            "HIGH RISK",

          icon:
            "⚠",

          bg:
            "bg-[#eef5ff]",

          border:
            "border-[#c7dbf5]",

          text:
            "text-[#1d4ed8]",
        };

      }


      if (score >= 40) {

        return {
          title:
            "Social Engineering Detected",

          description:
            "The email contains behavioral or psychological manipulation techniques.",

          label:
            "DETECTED",

          icon:
            "!",

          bg:
            "bg-[#f1f6ff]",

          border:
            "border-[#cbdcf3]",

          text:
            "text-[#2563eb]",
        };

      }


      return {
        title:
          "Potential Social Engineering",

        description:
          "Some manipulation indicators were detected in the email.",

        label:
          "POTENTIAL RISK",

        icon:
          "?",

        bg:
          "bg-[#f5f8fc]",

        border:
          "border-[#dce6f0]",

        text:
          "text-[#55708f]",
      };

    }


    return {
      title:
        "No Social Engineering Detected",

      description:
        "The analysis did not detect the configured social engineering techniques.",

      label:
        "NOT DETECTED",

      icon:
        "✓",

      bg:
        "bg-[#edf8f1]",

      border:
        "border-[#cce8d5]",

      text:
        "text-[#188038]",
    };

  }, [
    detected,
    score,
  ]);


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
              👥
            </div>

          </div>


          <h2 className="mt-5 text-sm font-semibold text-[#173b66]">
            Analyzing Social Engineering
          </h2>


          <p className="mt-1 text-xs text-[#71839b]">
            MailGuard is looking for manipulation techniques...
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
            Unable to load analysis
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
                fetchSocialAnalysis
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
  // MAIN PAGE
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
            title="Back"
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
                Social Engineering Detection
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
                fetchSocialAnalysis
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
              Social Engineering
            </span>

          </div>


          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#12345b]">
            Social Engineering Detection
          </h2>


          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7c93]">
            Identify psychological manipulation techniques
            commonly used to influence recipients into taking
            unsafe actions.
          </p>

        </div>


        {/* ==================================================
            VERDICT + SCORE
        =================================================== */}

        <SectionCard className="mb-6">

          <div className="p-6">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


              {/* VERDICT */}

              <div>

                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7b8da6]">
                  Detection Result
                </p>


                <div className="mt-4 flex items-center gap-4">

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
                      className={`inline-flex mt-2 px-2.5 py-1 rounded-full border text-[10px] font-bold ${verdict.bg} ${verdict.border} ${verdict.text}`}
                    >
                      {verdict.label}
                    </span>

                  </div>

                </div>


                <p className="mt-5 max-w-xl text-sm leading-7 text-[#60758f]">
                  {verdict.description}
                </p>

              </div>


              {/* SCORE */}

              <div className="flex items-center justify-center lg:justify-end">

                <ScoreCircle
                  score={score}
                />

                <div className="ml-5">

                  <p className="text-sm font-semibold text-[#173b66]">
                    Social Engineering Score
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#71839b] max-w-xs">
                    Higher scores indicate stronger evidence
                    of manipulation or social engineering
                    behavior.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </SectionCard>


        {/* ==================================================
            TECHNIQUES
        =================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="🧠"
            title="Manipulation Techniques"
            description="Individual social engineering techniques evaluated by the detection system."
          />


          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">

            <TechniqueStatus
              label="Urgency"
              value={urgency}
              description="Attempts to make the recipient act immediately."
            />


            <TechniqueStatus
              label="Authority Impersonation"
              value={authorityImpersonation}
              description="Pretending to represent a trusted or authoritative entity."
            />


            <TechniqueStatus
              label="Fear"
              value={fear}
              description="Uses fear or negative consequences to influence the recipient."
            />


            <TechniqueStatus
              label="Reward"
              value={reward}
              description="Uses rewards, benefits or incentives to encourage action."
            />


            <TechniqueStatus
              label="Secrecy"
              value={secrecy}
              description="Encourages the recipient to keep information or actions secret."
            />

          </div>

        </SectionCard>


        {/* ==================================================
            DETECTED TECHNIQUES
        =================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="🔎"
            title="Detected Techniques"
            description="Specific techniques returned by the social engineering analysis."
          />


          <div className="p-5">

            {Array.isArray(
              result?.techniques
            ) &&
            result.techniques.length > 0 ? (

              <div className="flex flex-wrap gap-2">

                {result.techniques.map(
                  (technique, index) => (

                    <span
                      key={index}
                      className="
                        px-3
                        py-2
                        rounded-lg
                        bg-[#eaf2ff]
                        border
                        border-[#cbdcf3]
                        text-[#2563eb]
                        text-xs
                        font-semibold
                      "
                    >
                      {technique}
                    </span>

                  )
                )}

              </div>

            ) : (

              <div className="rounded-xl bg-[#f8fbff] border border-[#e1eaf4] p-6 text-center">

                <p className="text-sm font-medium text-[#536981]">
                  No specific techniques detected.
                </p>

                <p className="mt-1 text-xs text-[#8193aa]">
                  The backend did not return any detected techniques.
                </p>

              </div>

            )}

          </div>

        </SectionCard>


        {/* ==================================================
            EXPLANATION
        =================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="💡"
            title="Analysis Explanation"
            description="Explanation generated by the social engineering detector."
          />


          <div className="p-5">

            <div className="rounded-xl bg-[#f5f9ff] border border-[#dce7f4] p-5">

              <p className="text-sm leading-7 text-[#405572] whitespace-pre-line">
                {result?.explanation ||
                  "No explanation was returned."}
              </p>

            </div>

          </div>

        </SectionCard>


        {/* ==================================================
            EVIDENCE
        =================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="📌"
            title="Evidence"
            description="Evidence identified by the analysis system that supports the result."
          />


          <div className="p-5">

            {Array.isArray(
              result?.evidence
            ) &&
            result.evidence.length > 0 ? (

              <div className="space-y-3">

                {result.evidence.map(
                  (item, index) => (

                    <div
                      key={index}
                      className="
                        flex
                        items-start
                        gap-3
                        rounded-xl
                        border
                        border-[#e1e9f3]
                        bg-[#f9fbfe]
                        p-4
                      "
                    >

                      <div className="
                        w-7
                        h-7
                        rounded-full
                        bg-[#e8f1ff]
                        text-[#2563eb]
                        flex
                        items-center
                        justify-center
                        text-xs
                        font-bold
                        shrink-0
                      ">
                        {index + 1}
                      </div>


                      <p className="text-sm leading-6 text-[#405572]">
                        {item}
                      </p>

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="text-sm text-[#71839b]">
                No evidence was returned.
              </p>

            )}

          </div>

        </SectionCard>


        {/* ==================================================
            RISK IMPACT
        =================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="⚠"
            title="Risk Impact"
            description="Potential security impact associated with the detected behavior."
          />


          <div className="p-5">

            <div className="rounded-xl border border-[#dce7f4] bg-[#f5f9ff] p-5">

              <p className="text-sm leading-7 text-[#405572] whitespace-pre-line">
                {result?.risk_impact ||
                  "No risk impact information was returned."}
              </p>

            </div>

          </div>

        </SectionCard>


        {/* ==================================================
            RECOMMENDATION
        =================================================== */}

        <SectionCard className="mb-6">

          <SectionHeader
            icon="🛡"
            title="Security Recommendation"
            description="Recommended action based on the social engineering analysis."
          />


          <div className="p-5">

            <div className="rounded-xl bg-[#edf5ff] border border-[#cddff5] p-5">

              <div className="flex items-start gap-3">

                <div className="w-9 h-9 rounded-lg bg-[#dceaff] flex items-center justify-center text-[#2563eb] shrink-0">
                  ✓
                </div>


                <p className="text-sm leading-7 text-[#31577f]">
                  {result?.recommendation ||
                    "No recommendation was returned."}
                </p>

              </div>

            </div>

          </div>

        </SectionCard>


        {/* ==================================================
            OTHER SECURITY TOOLS
        =================================================== */}

        <div className="mt-8 mb-4">

          <h2 className="text-lg font-bold text-[#12345b]">
            Continue Security Analysis
          </h2>

          <p className="mt-1 text-xs leading-5 text-[#6b7c93]">
            Continue investigating the same email with the
            other MailGuard security tools.
          </p>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


          {/* ANALYZER */}

          <NavigationCard
            icon="🔍"
            title="Email Analyzer"
            description="View the complete forensic analysis including metadata, authentication, URLs and detection features."
            buttonText="Open Analyzer"
            onClick={() =>
              navigate(
                `/analyzer?message_id=${encodeURIComponent(
                  messageId
                )}`
              )
            }
          />


          {/* PHISHING */}

          <NavigationCard
            icon="🎣"
            title="Phishing Detection"
            description="Analyze suspicious links, credential requests, threats and other phishing indicators."
            buttonText="Open Phishing Detection"
            onClick={() =>
              navigate(
                `/phishing?message_id=${encodeURIComponent(
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
            MailGuard • Social Engineering Detection
          </p>

          <p className="mt-1 text-[10px] text-[#a3b0c0]">
            Results generated from the connected Gmail message.
          </p>

        </div>

      </main>

    </div>
  );
}