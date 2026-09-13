import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://emailforensic.onrender.com";

// =====================================================
// ANALYSIS TOOLS
// =====================================================

const ANALYSIS_TOOLS = [
  {
    key: "analyze",
    label: "Email Analyzer",
    description: "General forensic analysis of this email.",
    icon: "🔍",
    path: (id) => `/gmail/analyze/${id}`,
  },
  {
    key: "phishing",
    label: "Phishing Detection",
    description: "Check this email for phishing indicators.",
    icon: "🎣",
    path: (id) => `/gmail/Phising/${id}`,
  },
  {
    key: "social",
    label: "Social Engineering",
    description: "Look for manipulation and impersonation tactics.",
    icon: "👥",
    path: (id) => `/gmail/Social/${id}`,
  },
];

function EmailDetail() {
  const { messageId } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // { [key]: { loading, result, error } }
  const [analysis, setAnalysis] = useState({});

  const getToken = () => localStorage.getItem("access_token");

  // =====================================================
  // LOAD EMAIL
  // =====================================================

  useEffect(() => {
    const loadEmail = async () => {
      const token = getToken();

      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/gmail/message/${messageId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch this email");
        }

        const data = await response.json();

        console.log("Gmail message detail:", data);

        setEmail(data.message || data);
      } catch (err) {
        console.error("Email detail error:", err);
        setError("This email couldn't be loaded.");
      } finally {
        setLoading(false);
      }
    };

    loadEmail();
  }, [messageId, navigate]);

  // =====================================================
  // RUN ANALYSIS
  // =====================================================

  const runAnalysis = async (tool) => {
    const token = getToken();

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    setAnalysis((prev) => ({
      ...prev,
      [tool.key]: {
        loading: true,
        result: prev[tool.key]?.result,
        error: null,
      },
    }));

    try {
      const response = await fetch(
        `${API_URL}${tool.path(messageId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`${tool.label} request failed`);
      }

      const data = await response.json();

      setAnalysis((prev) => ({
        ...prev,
        [tool.key]: {
          loading: false,
          result: data,
          error: null,
        },
      }));
    } catch (err) {
      console.error(`${tool.label} error:`, err);

      setAnalysis((prev) => ({
        ...prev,
        [tool.key]: {
          loading: false,
          result: null,
          error: "Analysis failed.",
        },
      }));
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f6f8fc] text-[#5f6368] text-sm">
        <div
          className="
            w-9 h-9
            rounded-full
            border-[3px]
            border-[#dadce0]
            border-t-[#1a73e8]
            animate-spin
          "
        />

        <p>Opening email…</p>
      </div>
    );
  }

  // =====================================================
  // EMAIL DATA
  // =====================================================

  const subject = email?.name || email?.subject;
  const from = email?.from || email?.sender;
  const date = email?.date;
  const body = email?.body || email?.snippet;
  const attachments = email?.attachments;

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div
      className="
        h-screen
        flex flex-col
        bg-[#f6f8fc]
        text-[#1f1f1f]
        font-sans
        overflow-hidden
      "
    >

      {/* =================================================
          TOP ACTION BAR
      ================================================== */}

      <header
        className="
          h-[60px]
          min-h-[60px]
          flex items-center justify-between
          px-5
          bg-white
          border-b border-[#e6e8ec]
        "
      >

        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="
            flex items-center gap-2
            px-3 py-2
            rounded-md
            border-none
            bg-transparent
            text-sm
            text-[#5f6368]
            cursor-pointer
            hover:bg-[#f1f3f4]
            hover:text-[#1f1f1f]
            transition-colors
          "
        >
          <span className="text-lg" aria-hidden="true">
            ←
          </span>

          Back to Inbox
        </button>


        {/* Toolbar Actions */}
        <div className="flex items-center gap-1">

          <button
            className="
              w-[38px] h-[38px]
              flex items-center justify-center
              rounded-full
              border-none
              bg-transparent
              text-[#5f6368]
              text-[15px]
              cursor-pointer
              hover:bg-[#f1f3f4]
              transition-colors
            "
            title="Archive"
          >
            🗃
          </button>

          <button
            className="
              w-[38px] h-[38px]
              flex items-center justify-center
              rounded-full
              border-none
              bg-transparent
              text-[#5f6368]
              text-[15px]
              cursor-pointer
              hover:bg-[#f1f3f4]
              transition-colors
            "
            title="Report spam"
          >
            🚫
          </button>

          <button
            className="
              w-[38px] h-[38px]
              flex items-center justify-center
              rounded-full
              border-none
              bg-transparent
              text-[#5f6368]
              text-[15px]
              cursor-pointer
              hover:bg-[#f1f3f4]
              transition-colors
            "
            title="Delete"
          >
            🗑
          </button>

          <button
            className="
              w-[38px] h-[38px]
              flex items-center justify-center
              rounded-full
              border-none
              bg-transparent
              text-[#5f6368]
              text-[15px]
              cursor-pointer
              hover:bg-[#f1f3f4]
              transition-colors
            "
            title="More"
          >
            ⋮
          </button>

        </div>
      </header>


      {/* =================================================
          BODY
      ================================================== */}

      <div
        className="
          flex-1
          flex
          gap-4
          p-4
          min-h-0
          overflow-hidden
        "
      >

        {/* =================================================
            EMAIL CONTENT PANEL
        ================================================== */}

        <main
          className="
            flex-1
            min-w-0
            bg-white
            rounded-[10px]
            shadow-[0_1px_2px_rgba(60,64,67,0.08),0_1px_3px_rgba(60,64,67,0.08)]
            px-6 md:px-10
            py-8
            overflow-y-auto
          "
        >

          {error ? (

            <div className="text-sm text-[#c5221f]">
              {error}
            </div>

          ) : (

            <>

              {/* Subject */}
              <h1
                className="
                  text-[22px]
                  font-medium
                  leading-tight
                  m-0
                  mb-5
                  text-[#1f1f1f]
                  break-words
                "
              >
                {subject || "(No subject available)"}
              </h1>


              {/* =================================================
                  EMAIL META
              ================================================== */}

              <div
                className="
                  flex items-center
                  gap-3.5
                  pb-5
                  mb-6
                  border-b border-[#e6e8ec]
                "
              >

                {/* Avatar */}
                <div
                  className="
                    w-10 h-10
                    shrink-0
                    rounded-full
                    flex items-center justify-center
                    bg-[#1a73e8]
                    text-white
                    font-semibold
                  "
                  aria-hidden="true"
                >
                  {(from || "?").charAt(0).toUpperCase()}
                </div>


                {/* Sender */}
                <div className="min-w-0">

                  <div
                    className="
                      text-sm
                      font-medium
                      text-[#1f1f1f]
                      break-words
                    "
                  >
                    {from || "Sender information unavailable"}
                  </div>

                  {date && (
                    <div
                      className="
                        text-xs
                        text-[#5f6368]
                        mt-0.5
                      "
                    >
                      {date}
                    </div>
                  )}

                </div>

              </div>


              {/* =================================================
                  EMAIL BODY
              ================================================== */}

              <div
                className="
                  text-sm
                  leading-[1.7]
                  text-[#1f1f1f]
                  whitespace-pre-wrap
                  break-words
                "
              >
                {body ? (
                  body
                ) : (
                  <span
                    className="
                      text-[#5f6368]
                      italic
                    "
                  >
                    This email has no body content available from the
                    backend.
                  </span>
                )}
              </div>


              {/* =================================================
                  ATTACHMENTS
              ================================================== */}

              {Array.isArray(attachments) &&
                attachments.length > 0 && (
                  <div
                    className="
                      mt-7
                      pt-5
                      border-t border-[#e6e8ec]
                    "
                  >

                    <div
                      className="
                        text-[13px]
                        font-medium
                        text-[#5f6368]
                        mb-2.5
                      "
                    >
                      Attachments ({attachments.length})
                    </div>


                    <div
                      className="
                        flex flex-wrap
                        gap-2
                      "
                    >
                      {attachments.map((att, i) => (
                        <div
                          key={i}
                          className="
                            border border-[#e6e8ec]
                            rounded-lg
                            px-3 py-2
                            text-[13px]
                            bg-[#f8f9fa]
                            text-[#3c4043]
                            break-all
                          "
                        >
                          📎{" "}
                          {att.name ||
                            att.filename ||
                            `Attachment ${i + 1}`}
                        </div>
                      ))}
                    </div>

                  </div>
                )}


              {/* =================================================
                  MESSAGE ID
              ================================================== */}

              <div
                className="
                  mt-8
                  text-[11px]
                  text-[#9aa0a6]
                "
              >
                Message ID:{" "}
                <code
                  className="
                    font-mono
                    break-all
                  "
                >
                  {messageId}
                </code>
              </div>

            </>
          )}

        </main>


        {/* =================================================
            MAILGUARD SECURITY PANEL
        ================================================== */}

        <aside
          className="
            w-[340px]
            shrink-0
            bg-white
            rounded-[10px]
            shadow-[0_1px_2px_rgba(60,64,67,0.08),0_1px_3px_rgba(60,64,67,0.08)]
            p-5
            overflow-y-auto
          "
        >

          {/* Panel Header */}
          <div
            className="
              flex items-center
              gap-2
              text-sm
              font-semibold
              text-[#1e7e5a]
              pb-4
              mb-4
              border-b border-[#e6e8ec]
            "
          >
            <span aria-hidden="true">
              🛡
            </span>

            MailGuard Security Analysis
          </div>


          {/* Tools */}
          <div className="flex flex-col gap-5">

            {ANALYSIS_TOOLS.map((tool) => {
              const state = analysis[tool.key];

              return (
                <div
                  className="
                    flex flex-col
                    gap-2.5
                  "
                  key={tool.key}
                >

                  {/* Tool Header */}
                  <div
                    className="
                      flex items-start
                      gap-2.5
                    "
                  >

                    <span
                      className="
                        text-lg
                        mt-0.5
                        shrink-0
                      "
                    >
                      {tool.icon}
                    </span>


                    <div className="min-w-0">

                      <div
                        className="
                          text-[13px]
                          font-medium
                          text-[#1f1f1f]
                        "
                      >
                        {tool.label}
                      </div>

                      <div
                        className="
                          text-xs
                          text-[#5f6368]
                          mt-0.5
                          leading-relaxed
                        "
                      >
                        {tool.description}
                      </div>

                    </div>

                  </div>


                  {/* Analyze Button */}
                  <button
                    onClick={() => runAnalysis(tool)}
                    disabled={state?.loading}
                    className="
                      self-start
                      border border-[#1e7e5a]
                      bg-[#e6f4ee]
                      text-[#1e7e5a]
                      text-[12.5px]
                      font-medium
                      px-3.5 py-1.5
                      rounded-md
                      cursor-pointer
                      transition-colors
                      hover:bg-[#d3ece0]
                      disabled:opacity-60
                      disabled:cursor-default
                    "
                  >
                    {state?.loading
                      ? "Analyzing…"
                      : state?.result
                      ? "Re-analyze"
                      : "Analyze"}
                  </button>


                  {/* Error */}
                  {state?.error && (
                    <div
                      className="
                        text-[11.5px]
                        text-[#c5221f]
                        bg-[#f8f9fa]
                        border border-[#e6e8ec]
                        rounded-md
                        p-2.5
                      "
                    >
                      {state.error}
                    </div>
                  )}


                  {/* Result */}
                  {state?.result && !state.loading && (
                    <pre
                      className="
                        text-[11.5px]
                        leading-relaxed
                        bg-[#f8f9fa]
                        border border-[#e6e8ec]
                        rounded-md
                        p-2.5
                        max-h-[180px]
                        overflow-auto
                        whitespace-pre-wrap
                        break-words
                        text-[#1f1f1f]
                        font-mono
                      "
                    >
                      {JSON.stringify(
                        state.result,
                        null,
                        2
                      )}
                    </pre>
                  )}

                </div>
              );
            })}


            {/* =================================================
                IP TRACING
            ================================================== */}

            <div
              className="
                flex flex-col
                gap-2.5
              "
            >

              <div
                className="
                  flex items-start
                  gap-2.5
                "
              >

                <span
                  className="
                    text-lg
                    mt-0.5
                    shrink-0
                  "
                >
                  🌐
                </span>

                <div>

                  <div
                    className="
                      text-[13px]
                      font-medium
                      text-[#1f1f1f]
                    "
                  >
                    IP Tracing
                  </div>

                  <div
                    className="
                      text-xs
                      text-[#5f6368]
                      mt-0.5
                      leading-relaxed
                    "
                  >
                    Trace originating IPs from this email's headers.
                  </div>

                </div>

              </div>


              <button
                onClick={() =>
                  navigate(
                    `/ip-tracing?message_id=${messageId}`
                  )
                }
                className="
                  self-start
                  border border-[#1e7e5a]
                  bg-[#e6f4ee]
                  text-[#1e7e5a]
                  text-[12.5px]
                  font-medium
                  px-3.5 py-1.5
                  rounded-md
                  cursor-pointer
                  transition-colors
                  hover:bg-[#d3ece0]
                "
              >
                Trace IP
              </button>

            </div>

          </div>
        </aside>

      </div>
    </div>
  );
}

export default EmailDetail;