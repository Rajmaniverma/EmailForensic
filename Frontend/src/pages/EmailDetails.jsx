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

// =====================================================
// MAIN COMPONENT
// =====================================================

function EmailDetail() {
  const { messageId } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Per-tool analysis state
  const [analysis, setAnalysis] = useState({});

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

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

      if (!messageId) {
        setError("No Gmail message ID was provided.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/gmail/message/${encodeURIComponent(messageId)}`,
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

        // Backend returns:
        // {
        //   success: true,
        //   email: {...}
        // }

        setEmail(data.email || data.message || data);
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
        result: prev[tool.key]?.result || null,
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
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-[#f6f8fc] text-[#5f6368]">
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

        <p className="text-sm">
          Opening email…
        </p>
      </div>
    );
  }

  // =====================================================
  // EMAIL DATA
  // =====================================================

  const subject =
    email?.subject ||
    email?.name ||
    "(No subject)";

  const from =
    email?.from ||
    email?.sender ||
    "Unknown sender";

  const senderName =
    email?.sender_name ||
    email?.from_name ||
    extractSenderName(from);

  const senderEmail =
    email?.sender_email ||
    extractEmail(from);

  const date =
    email?.date ||
    "";

  // Plain-text fallback
  const body =
    email?.body ||
    email?.plain_text ||
    email?.text ||
    email?.snippet ||
    "";

  // =====================================================
  // ORIGINAL HTML EMAIL
  // =====================================================

  const htmlBody =
    email?.html_body ||
    email?.html ||
    email?.body_html ||
    "";

  const attachments = Array.isArray(email?.attachments)
    ? email.attachments
    : [];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="
        h-screen
        w-full
        flex
        flex-col
        bg-[#f6f8fc]
        text-[#202124]
        font-sans
        overflow-hidden
      "
    >

      {/* =================================================
          GMAIL TOP HEADER
      ================================================== */}

      <header
        className="
          h-[64px]
          min-h-[64px]
          flex
          items-center
          px-4
          bg-[#f6f8fc]
        "
      >

        {/* ---------------------------------------------
            MENU + GMAIL LOGO
        ---------------------------------------------- */}

        <div
          className="
            flex
            items-center
            gap-3
            w-[250px]
            shrink-0
          "
        >

          <button
            className="
              w-10
              h-10
              rounded-full
              flex
              items-center
              justify-center
              border-none
              bg-transparent
              text-[#5f6368]
              text-xl
              cursor-pointer
              hover:bg-[#e8eaed]
            "
            aria-label="Main menu"
          >
            ☰
          </button>

          {/* Gmail-style logo */}

          <div className="flex items-center gap-2">

            <div
              className="
                text-3xl
                font-bold
                leading-none
                bg-gradient-to-r
                from-[#4285f4]
                via-[#ea4335]
                to-[#34a853]
                bg-clip-text
                text-transparent
              "
            >
              M
            </div>

            <span
              className="
                text-[22px]
                text-[#3c4043]
                font-normal
              "
            >
              Gmail
            </span>

          </div>

        </div>


        {/* ---------------------------------------------
            SEARCH
        ---------------------------------------------- */}

        <div
          className="
            hidden
            md:flex
            flex-1
            max-w-[820px]
            h-[48px]
            items-center
            px-4
            bg-[#e9eef6]
            rounded-full
          "
        >

          <span className="text-[#5f6368] text-xl">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search mail"
            className="
              flex-1
              ml-3
              bg-transparent
              outline-none
              border-none
              text-sm
              text-[#202124]
              placeholder:text-[#5f6368]
            "
          />

          <button
            className="
              w-9
              h-9
              flex
              items-center
              justify-center
              rounded-full
              border-none
              bg-transparent
              text-[#5f6368]
              hover:bg-[#dfe5ee]
              cursor-pointer
            "
            title="Search options"
          >
            ☷
          </button>

        </div>


        {/* ---------------------------------------------
            RIGHT HEADER
        ---------------------------------------------- */}

        <div
          className="
            ml-auto
            flex
            items-center
            gap-1
          "
        >

          <button
            className={headerButtonClass}
            title="Help"
          >
            ?
          </button>

          <button
            className={headerButtonClass}
            title="Settings"
          >
            ⚙
          </button>

          <button
            className={headerButtonClass}
            title="Google apps"
          >
            ✦
          </button>

          <button
            className={headerButtonClass}
            title="More"
          >
            ⋮⋮
          </button>

          <div
            className="
              ml-2
              w-9
              h-9
              rounded-full
              bg-[#137333]
              text-white
              flex
              items-center
              justify-center
              font-medium
              border-2
              border-[#aecbfa]
            "
          >
            R
          </div>

        </div>

      </header>


      {/* =================================================
          MAIN GMAIL AREA
      ================================================== */}

      <div
        className="
          flex-1
          min-h-0
          flex
        "
      >

        {/* =================================================
            LEFT SIDEBAR
        ================================================== */}

        <aside
          className="
            hidden
            lg:flex
            w-[250px]
            shrink-0
            flex-col
            bg-[#f6f8fc]
            px-2
            overflow-y-auto
          "
        >

          {/* Compose */}

          <button
            onClick={() => navigate("/analyzer")}
            className="
              w-fit
              min-w-[150px]
              h-[56px]
              px-5
              mb-4
              flex
              items-center
              gap-3
              rounded-2xl
              border-none
              bg-[#c2e7ff]
              text-[#001d35]
              text-sm
              font-medium
              cursor-pointer
              hover:shadow-md
              transition-shadow
            "
          >
            <span className="text-xl">
              ✎
            </span>

            Compose
          </button>


          {/* Inbox */}

          <button
            className="
              h-9
              w-full
              flex
              items-center
              gap-4
              px-4
              rounded-r-full
              border-none
              bg-[#d3e3fd]
              text-[#001d35]
              text-sm
              font-medium
              text-left
            "
          >
            <span>
              📥
            </span>

            <span className="flex-1">
              Inbox
            </span>

            <span className="font-semibold">
              1,797
            </span>
          </button>


          <SidebarItem
            icon="☆"
            label="Starred"
          />

          <SidebarItem
            icon="◷"
            label="Snoozed"
          />

          <SidebarItem
            icon="➤"
            label="Sent"
          />

          <SidebarItem
            icon="📝"
            label="Drafts"
            count="1"
            bold
          />

          <SidebarItem
            icon="🛍"
            label="Purchases"
            count="5"
            bold
          />

          <SidebarItem
            icon="⌄"
            label="More"
          />


          {/* Labels */}

          <div className="mt-7 px-4">

            <div
              className="
                flex
                items-center
                justify-between
                mb-3
              "
            >

              <span className="font-medium text-sm">
                Labels
              </span>

              <button
                className="
                  text-xl
                  text-[#5f6368]
                  border-none
                  bg-transparent
                  cursor-pointer
                "
              >
                +
              </button>

            </div>

          </div>


          {/* MailGuard */}

          <div
            className="
              mt-3
              px-3
              pb-5
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                px-2
                pb-3
                mb-2
                border-b
                border-[#dadce0]
                text-sm
                font-semibold
                text-[#1e7e5a]
              "
            >
              🛡
              MailGuard Security
            </div>


            <button
              onClick={() => navigate("/phishing")}
              className={securitySidebarClass}
            >
              🎣
              Phishing Detection
            </button>

            <button
              onClick={() => navigate("/social")}
              className={securitySidebarClass}
            >
              👥
              Social Analysis
            </button>

            <button
              onClick={() =>
                navigate(
                  `/ip-tracing?message_id=${encodeURIComponent(
                    messageId
                  )}`
                )
              }
              className={securitySidebarClass}
            >
              🌐
              IP Tracing
            </button>

            <button
              onClick={() => navigate("/analyzer")}
              className={securitySidebarClass}
            >
              🔍
              Email Analyzer
            </button>

          </div>

        </aside>


        {/* =================================================
            EMAIL + SECURITY
        ================================================== */}

        <div
          className="
            flex-1
            min-w-0
            flex
            flex-col
            overflow-hidden
          "
        >

          {/* =================================================
              GMAIL MESSAGE TOOLBAR
          ================================================== */}

          <div
            className="
              h-[56px]
              min-h-[56px]
              flex
              items-center
              justify-between
              px-4
              bg-white
              border-b
              border-[#e5e7eb]
            "
          >

            <div className="flex items-center gap-1">

              {/* Back */}

              <button
                onClick={() => navigate("/dashboard")}
                className={messageToolbarButton}
                title="Back to Inbox"
              >
                ←
              </button>


              {/* Archive */}

              <button
                className={messageToolbarButton}
                title="Archive"
              >
                ▣
              </button>


              {/* Report spam */}

              <button
                className={messageToolbarButton}
                title="Report spam"
              >
                !
              </button>


              {/* Delete */}

              <button
                className={messageToolbarButton}
                title="Delete"
              >
                🗑
              </button>


              <div className="h-6 w-px bg-[#dadce0] mx-2" />


              {/* Mark unread */}

              <button
                className={messageToolbarButton}
                title="Mark as unread"
              >
                ✉
              </button>


              {/* Snooze */}

              <button
                className={messageToolbarButton}
                title="Snooze"
              >
                ◷
              </button>


              {/* More */}

              <button
                className={messageToolbarButton}
                title="More"
              >
                ⋮
              </button>

            </div>


            {/* Right */}

            <div className="flex items-center gap-1">

              <button
                className={messageToolbarButton}
                title="Previous"
              >
                ‹
              </button>

              <button
                className={messageToolbarButton}
                title="Next"
              >
                ›
              </button>

            </div>

          </div>


          {/* =================================================
              MESSAGE AREA
          ================================================== */}

          <div
            className="
              flex-1
              min-h-0
              flex
              gap-4
              p-0
              overflow-hidden
            "
          >

            {/* =================================================
                ORIGINAL GMAIL MESSAGE
            ================================================== */}

            <main
              className="
                flex-1
                min-w-0
                bg-white
                overflow-y-auto
              "
            >

              {error ? (

                <div
                  className="
                    p-8
                    text-sm
                    text-[#c5221f]
                  "
                >
                  {error}
                </div>

              ) : (

                <article className="w-full">

                  {/* =========================================
                      SUBJECT
                  ========================================== */}

                  <div
                    className="
                      px-6
                      md:px-10
                      pt-7
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        flex-wrap
                      "
                    >

                      <h1
                        className="
                          text-[24px]
                          md:text-[26px]
                          font-normal
                          text-[#202124]
                          leading-tight
                          break-words
                        "
                      >
                        {subject}
                      </h1>


                      <span
                        className="
                          px-2
                          py-1
                          rounded
                          bg-[#e8eaed]
                          text-[11px]
                          text-[#5f6368]
                        "
                      >
                        Inbox
                      </span>

                    </div>

                  </div>


                  {/* =========================================
                      SENDER HEADER
                  ========================================== */}

                  <div
                    className="
                      px-6
                      md:px-10
                      py-5
                      flex
                      items-start
                      gap-4
                    "
                  >

                    {/* Avatar */}

                    <div
                      className="
                        w-10
                        h-10
                        shrink-0
                        rounded-full
                        bg-[#1a73e8]
                        text-white
                        flex
                        items-center
                        justify-center
                        font-medium
                        text-lg
                      "
                    >
                      {(senderName || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>


                    {/* Sender */}

                    <div className="flex-1 min-w-0">

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          flex-wrap
                        "
                      >

                        <span
                          className="
                            font-medium
                            text-sm
                            text-[#202124]
                          "
                        >
                          {senderName}
                        </span>

                        <span
                          className="
                            text-xs
                            text-[#5f6368]
                          "
                        >
                          &lt;{senderEmail}&gt;
                        </span>

                      </div>


                      <div
                        className="
                          text-xs
                          text-[#5f6368]
                          mt-1
                        "
                      >
                        to me
                        <span className="ml-1">
                          ▾
                        </span>
                      </div>

                    </div>


                    {/* Date */}

                    <div
                      className="
                        hidden
                        sm:block
                        text-xs
                        text-[#5f6368]
                        whitespace-nowrap
                      "
                    >
                      {formatDate(date)}
                    </div>


                    {/* Actions */}

                    <div className="flex items-center gap-1">

                      <button
                        className={smallIconButton}
                        title="Star"
                      >
                        ☆
                      </button>

                      <button
                        className={smallIconButton}
                        title="Reply"
                      >
                        ↩
                      </button>

                      <button
                        className={smallIconButton}
                        title="More"
                      >
                        ⋮
                      </button>

                    </div>

                  </div>


                  {/* =========================================
                      ORIGINAL HTML EMAIL
                  ========================================== */}

                  <div
                    className="
                      px-6
                      md:px-10
                      pb-8
                    "
                  >

                    {htmlBody ? (

                      <div
                        className="
                          w-full
                          bg-white
                          overflow-hidden
                        "
                      >

                        <iframe
                          title="Original Gmail Email"
                          srcDoc={htmlBody}
                          sandbox=""
                          scrolling="no"
                          className="
                            block
                            w-full
                            min-h-[700px]
                            border-0
                            bg-white
                          "
                          onLoad={(event) => {

                            try {

                              const iframe =
                                event.currentTarget;

                              const iframeDocument =
                                iframe.contentDocument ||
                                iframe.contentWindow?.document;

                              if (
                                !iframeDocument ||
                                !iframeDocument.body
                              ) {
                                return;
                              }

                              // Give the browser a moment
                              // to finish rendering images
                              setTimeout(() => {

                                try {

                                  const bodyHeight =
                                    iframeDocument.body
                                      .scrollHeight;

                                  const documentHeight =
                                    iframeDocument.documentElement
                                      ?.scrollHeight || 0;

                                  const height = Math.max(
                                    bodyHeight,
                                    documentHeight,
                                    700
                                  );

                                  iframe.style.height =
                                    `${height + 30}px`;

                                } catch (error) {

                                  console.error(
                                    "Iframe resize error:",
                                    error
                                  );

                                }

                              }, 300);

                            } catch (error) {

                              console.error(
                                "Unable to access email iframe:",
                                error
                              );

                            }

                          }}
                        />

                      </div>

                    ) : body ? (

                      /* ---------------------------------------
                         PLAIN TEXT FALLBACK
                      ---------------------------------------- */

                      <div
                        className="
                          max-w-[900px]
                          whitespace-pre-wrap
                          break-words
                          text-sm
                          leading-7
                          text-[#202124]
                        "
                      >
                        {body}
                      </div>

                    ) : (

                      <div
                        className="
                          py-10
                          text-sm
                          text-[#5f6368]
                          italic
                        "
                      >
                        This email has no body content available
                        from the backend.
                      </div>

                    )}

                  </div>


                  {/* =========================================
                      ATTACHMENTS
                  ========================================== */}

                  {attachments.length > 0 && (

                    <div
                      className="
                        mx-6
                        md:mx-10
                        pt-5
                        border-t
                        border-[#e5e7eb]
                      "
                    >

                      <div
                        className="
                          text-sm
                          font-medium
                          text-[#3c4043]
                          mb-3
                        "
                      >
                        {attachments.length} Attachment
                        {attachments.length !== 1 ? "s" : ""}
                      </div>


                      <div
                        className="
                          flex
                          flex-wrap
                          gap-3
                        "
                      >

                        {attachments.map(
                          (att, index) => (

                            <div
                              key={index}
                              className="
                                min-w-[190px]
                                max-w-[280px]
                                flex
                                items-center
                                gap-3
                                px-3
                                py-3
                                border
                                border-[#dadce0]
                                rounded-lg
                                bg-white
                                hover:bg-[#f8f9fa]
                                cursor-pointer
                              "
                            >

                              <span className="text-xl">
                                📎
                              </span>

                              <div className="min-w-0">

                                <div
                                  className="
                                    text-sm
                                    font-medium
                                    truncate
                                  "
                                >
                                  {att.name ||
                                    att.filename ||
                                    `Attachment ${index + 1}`}
                                </div>

                                {att.size && (

                                  <div
                                    className="
                                      text-xs
                                      text-[#5f6368]
                                      mt-1
                                    "
                                  >
                                    {att.size}
                                  </div>

                                )}

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}


                  {/* =========================================
                      REPLY / FORWARD
                  ========================================== */}

                  <div
                    className="
                      px-6
                      md:px-10
                      py-8
                      flex
                      items-center
                      gap-3
                    "
                  >

                    <button
                      className="
                        flex
                        items-center
                        gap-2
                        px-5
                        py-2
                        rounded-full
                        border
                        border-[#747775]
                        bg-white
                        text-sm
                        text-[#3c4043]
                        hover:bg-[#f1f3f4]
                        cursor-pointer
                      "
                    >
                      ↩
                      Reply
                    </button>


                    <button
                      className="
                        flex
                        items-center
                        gap-2
                        px-5
                        py-2
                        rounded-full
                        border
                        border-[#747775]
                        bg-white
                        text-sm
                        text-[#3c4043]
                        hover:bg-[#f1f3f4]
                        cursor-pointer
                      "
                    >
                      ↪
                      Forward
                    </button>

                  </div>


                  {/* =========================================
                      MESSAGE ID
                  ========================================== */}

                  <div
                    className="
                      px-6
                      md:px-10
                      pb-8
                      text-[11px]
                      text-[#9aa0a6]
                    "
                  >
                    Message ID:{" "}
                    <code className="font-mono break-all">
                      {messageId}
                    </code>
                  </div>

                </article>

              )}

            </main>


            {/* =================================================
                MAILGUARD PANEL
            ================================================== */}

            <aside
              className="
                hidden
                xl:flex
                w-[340px]
                shrink-0
                m-3
                ml-0
                rounded-xl
                bg-white
                border
                border-[#e5e7eb]
                shadow-sm
                flex-col
                overflow-hidden
              "
            >

              {/* Header */}

              <div
                className="
                  px-5
                  py-4
                  border-b
                  border-[#e5e7eb]
                  flex
                  items-center
                  gap-2
                "
              >

                <span className="text-lg">
                  🛡️
                </span>

                <div>

                  <div
                    className="
                      text-sm
                      font-semibold
                      text-[#1e7e5a]
                    "
                  >
                    MailGuard
                  </div>

                  <div
                    className="
                      text-xs
                      text-[#5f6368]
                    "
                  >
                    Security Analysis
                  </div>

                </div>

              </div>


              {/* Tools */}

              <div
                className="
                  flex-1
                  overflow-y-auto
                  p-4
                  space-y-5
                "
              >

                {ANALYSIS_TOOLS.map((tool) => {

                  const state =
                    analysis[tool.key];

                  return (

                    <div
                      key={tool.key}
                      className="
                        pb-5
                        border-b
                        border-[#edf0f2]
                      "
                    >

                      {/* Tool title */}

                      <div
                        className="
                          flex
                          items-start
                          gap-3
                        "
                      >

                        <span className="text-xl">
                          {tool.icon}
                        </span>

                        <div className="min-w-0">

                          <div
                            className="
                              text-sm
                              font-medium
                              text-[#202124]
                            "
                          >
                            {tool.label}
                          </div>

                          <div
                            className="
                              mt-1
                              text-xs
                              leading-5
                              text-[#5f6368]
                            "
                          >
                            {tool.description}
                          </div>

                        </div>

                      </div>


                      {/* Run button */}

                      <button
                        onClick={() =>
                          runAnalysis(tool)
                        }
                        disabled={state?.loading}
                        className="
                          mt-3
                          px-4
                          py-2
                          rounded-lg
                          border
                          border-[#1e7e5a]
                          bg-[#e6f4ee]
                          text-[#1e7e5a]
                          text-xs
                          font-medium
                          hover:bg-[#d3ece0]
                          disabled:opacity-50
                          disabled:cursor-not-allowed
                          cursor-pointer
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
                            mt-3
                            p-3
                            rounded-lg
                            bg-[#fce8e6]
                            border
                            border-[#f5c2c0]
                            text-xs
                            text-[#c5221f]
                          "
                        >
                          {state.error}
                        </div>

                      )}


                      {/* Result */}

                      {state?.result &&
                        !state.loading && (

                          <pre
                            className="
                              mt-3
                              max-h-[220px]
                              overflow-auto
                              p-3
                              rounded-lg
                              bg-[#f8f9fa]
                              border
                              border-[#e5e7eb]
                              text-[11px]
                              leading-5
                              text-[#202124]
                              font-mono
                              whitespace-pre-wrap
                              break-words
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


                {/* =========================================
                    IP TRACING
                ========================================== */}

                <div>

                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >

                    <span className="text-xl">
                      🌐
                    </span>

                    <div>

                      <div
                        className="
                          text-sm
                          font-medium
                          text-[#202124]
                        "
                      >
                        IP Tracing
                      </div>

                      <div
                        className="
                          mt-1
                          text-xs
                          leading-5
                          text-[#5f6368]
                        "
                      >
                        Trace originating IPs from this
                        email's headers.
                      </div>

                    </div>

                  </div>


                  <button
                    onClick={() =>
                      navigate(
                        `/ip-tracing?message_id=${encodeURIComponent(
                          messageId
                        )}`
                      )
                    }
                    className="
                      mt-3
                      px-4
                      py-2
                      rounded-lg
                      border
                      border-[#1e7e5a]
                      bg-[#e6f4ee]
                      text-[#1e7e5a]
                      text-xs
                      font-medium
                      hover:bg-[#d3ece0]
                      cursor-pointer
                    "
                  >
                    Trace IP
                  </button>

                </div>

              </div>

            </aside>

          </div>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// SIDEBAR ITEM
// =====================================================

function SidebarItem({
  icon,
  label,
  count,
  bold = false,
}) {
  return (
    <button
      className="
        w-full
        h-9
        px-4
        flex
        items-center
        gap-4
        rounded-r-full
        border-none
        bg-transparent
        text-[#3c4043]
        text-sm
        text-left
        cursor-pointer
        hover:bg-[#e8eaed]
      "
    >

      <span className="w-5 text-center">
        {icon}
      </span>

      <span
        className={
          bold
            ? "flex-1 font-semibold"
            : "flex-1"
        }
      >
        {label}
      </span>

      {count && (
        <span className="text-xs">
          {count}
        </span>
      )}

    </button>
  );
}


// =====================================================
// EXTRACT SENDER EMAIL
// =====================================================

function extractEmail(value) {
  if (!value) return "";

  const match = value.match(
    /<([^>]+)>/
  );

  return match
    ? match[1]
    : value;
}


// =====================================================
// EXTRACT SENDER NAME
// =====================================================

function extractSenderName(value) {
  if (!value) {
    return "Unknown sender";
  }

  const match = value.match(
    /^(.+?)\s*<[^>]+>$/
  );

  if (match) {
    return match[1]
      .replace(/^"|"$/g, "")
      .trim();
  }

  return value;
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {
  if (!value) return "";

  try {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString([], {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  } catch {
    return value;
  }
}


// =====================================================
// TAILWIND CLASS CONSTANTS
// =====================================================

const headerButtonClass = `
  w-10
  h-10
  flex
  items-center
  justify-center
  rounded-full
  border-none
  bg-transparent
  text-[#5f6368]
  text-lg
  cursor-pointer
  hover:bg-[#e8eaed]
`;

const messageToolbarButton = `
  w-10
  h-10
  flex
  items-center
  justify-center
  rounded-full
  border-none
  bg-transparent
  text-[#5f6368]
  text-lg
  cursor-pointer
  hover:bg-[#f1f3f4]
`;

const smallIconButton = `
  w-9
  h-9
  flex
  items-center
  justify-center
  rounded-full
  border-none
  bg-transparent
  text-[#5f6368]
  text-lg
  cursor-pointer
  hover:bg-[#f1f3f4]
`;

const securitySidebarClass = `
  w-full
  flex
  items-center
  gap-3
  px-3
  py-2
  rounded-lg
  border-none
  bg-transparent
  text-[#3c4043]
  text-xs
  text-left
  cursor-pointer
  hover:bg-[#e8eaed]
`;

export default EmailDetail;