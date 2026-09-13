import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";


const API_URL = "https://emailforensic.onrender.com";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // =========================================
  // PAGINATION STATE
  // =========================================
  // tokenHistory holds the page_token used to fetch every page we've
  // visited, in order, so "Previous" can step backwards without the
  // backend needing to provide a previousPageToken.
  //   tokenHistory[0]      -> null (first page, no token)
  //   tokenHistory[1]      -> token used to fetch page 2
  //   ...
  const [tokenHistory, setTokenHistory] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasNext, setHasNext] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const refreshInFlight = useRef(false);

  // =========================================
  // AUTH TOKEN HELPER (unchanged behavior)
  // =========================================

  const getToken = () => localStorage.getItem("access_token");

  // =========================================
  // FETCH A PAGE OF GMAIL MESSAGES
  // =========================================

  const fetchMessages = useCallback(
    async (pageToken, { isInitial = false } = {}) => {
      const token = getToken();
      if (!token) {
        navigate("/", { replace: true });
        return null;
      }

      const url = pageToken
        ? `${API_URL}/gmail/messages?page_token=${encodeURIComponent(
            pageToken
          )}`
        : `${API_URL}/gmail/messages`;

      const gmailResponse = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!gmailResponse.ok) {
        throw new Error("Failed to fetch Gmail messages");
      }

      const gmailData = await gmailResponse.json();

      if (!isInitial) {
        console.log("Gmail Messages:", gmailData);
      }

      if (gmailData.success) {
        setMessages(gmailData.messages || []);
        setNextPageToken(gmailData.next_page_token || null);
        setHasNext(Boolean(gmailData.has_next));
      } else {
        setMessages([]);
        setNextPageToken(null);
        setHasNext(false);
      }

      return gmailData;
    },
    [navigate]
  );

  // =========================================
  // INITIAL LOAD (auth check unchanged, then first page of messages)
  // =========================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // =========================================
        // GET TOKEN FROM URL
        // =========================================

        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token");

        if (urlToken) {
          localStorage.setItem("access_token", urlToken);

          // Remove token from browser URL
          window.history.replaceState({}, document.title, "/dashboard");
        }

        // =========================================
        // GET TOKEN FROM LOCAL STORAGE
        // =========================================

        const token = urlToken || localStorage.getItem("access_token");

        if (!token) {
          navigate("/", { replace: true });
          return;
        }

        // =========================================
        // CHECK AUTHENTICATION
        // =========================================

        const authResponse = await fetch(`${API_URL}/auth/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!authResponse.ok) {
          throw new Error("Failed to check authentication");
        }

        const authData = await authResponse.json();

        console.log("Dashboard Auth:", authData);

        if (authData.authenticated !== true) {
          localStorage.removeItem("access_token");
          navigate("/", { replace: true });
          return;
        }

        setUser(authData.user);

        // =========================================
        // GET FIRST PAGE OF GMAIL MESSAGES
        // =========================================

        await fetchMessages(null, { isInitial: true });
      } catch (error) {
        console.error("Dashboard error:", error);

        localStorage.removeItem("access_token");
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // =========================================
  // NEXT / PREVIOUS PAGE
  // =========================================

  const handleNext = async () => {
    if (!hasNext || !nextPageToken || pageLoading) return;

    setPageLoading(true);
    try {
      await fetchMessages(nextPageToken);
      setTokenHistory((prev) => {
        const updated = prev.slice(0, pageIndex + 1);
        updated.push(nextPageToken);
        return updated;
      });
      setPageIndex((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to load next page:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const handlePrevious = async () => {
    if (pageIndex === 0 || pageLoading) return;

    setPageLoading(true);
    try {
      const previousIndex = pageIndex - 1;
      const previousToken = tokenHistory[previousIndex];
      await fetchMessages(previousToken);
      setPageIndex(previousIndex);
    } catch (error) {
      console.error("Failed to load previous page:", error);
    } finally {
      setPageLoading(false);
    }
  };

  // =========================================
  // REFRESH
  // =========================================

  const handleRefresh = async () => {
    if (refreshInFlight.current) return;

    const token = getToken();
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    refreshInFlight.current = true;
    setRefreshing(true);

    try {
      const refreshResponse = await fetch(`${API_URL}/gmail/refresh`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh Gmail messages");
      }

      const refreshData = await refreshResponse.json();

      console.log("Gmail Refresh:", refreshData);

      if (refreshData.success) {
        setMessages(refreshData.messages || []);
        setNextPageToken(refreshData.next_page_token || null);
        setHasNext(Boolean(refreshData.has_next));
      }

      // Reset pagination to the first page after a refresh.
      setTokenHistory([null]);
      setPageIndex(0);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
      refreshInFlight.current = false;
    }
  };

  // =========================================
  // OPEN EMAIL
  // =========================================

  const openEmail = (messageId) => {
    if (!messageId) return;
    navigate(`/email/${messageId}`);
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95">
  <div className="flex flex-col items-center">

    {/* Animated MailGuard Logo */}
    <div className="relative mb-7">
      {/* Outer pulse */}
      <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping"></div>

      {/* Logo box */}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30">
        <svg
          className="h-10 w-10 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5v-9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.5 7l8.5 6 8.5-6"
          />
        </svg>

        {/* Security check */}
        <div className="absolute -right-2 -bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-lg ring-4 ring-slate-950">
          <svg
            className="h-4 w-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12l4 4L19 6"
            />
          </svg>
        </div>
      </div>
    </div>

    {/* Title */}
    <h2 className="text-xl font-semibold tracking-tight text-white">
      Connecting to Gmail
    </h2>

    <p className="mt-2 text-sm text-slate-400">
      Securely loading your inbox
    </p>

    {/* Progress animation */}
    <div className="mt-7 h-1.5 w-64 overflow-hidden rounded-full bg-slate-800">
      <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400 animate-[loading_1.4s_ease-in-out_infinite]"></div>
    </div>

    {/* Status */}
    <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
      MailGuard is preparing your inbox
    </div>

  </div>

  {/* Animation */}
  <style>{`
    @keyframes loading {
      0% {
        transform: translateX(-100%);
      }
      50% {
        transform: translateX(100%);
      }
      100% {
        transform: translateX(200%);
      }
    }
  `}</style>
</div>
    );
  }

  if (!user) {
    return null;
  }

  // =========================================
  // SEARCH (client-side filter over the current page only —
  // the backend does not expose a search endpoint)
  // =========================================

  const filteredMessages = messages.filter((message) =>
    message.name?.toLowerCase().includes(search.toLowerCase())
  );

  const rangeStart = filteredMessages.length === 0 ? 0 : 1;
  const rangeEnd = filteredMessages.length;

  // =========================================
  // DASHBOARD
  // =========================================

  return (
  <div className="min-h-screen h-screen flex flex-col bg-[#f6f8fc] text-[#1f1f1f] font-sans overflow-hidden">

    {/* =====================================================
        TOP HEADER
    ====================================================== */}
    <header className="h-16 min-h-16 flex items-center justify-between px-4 md:px-5 bg-white border-b border-[#e6e8ec]">

      {/* Logo */}
      <div className="flex items-center gap-2 md:gap-3 min-w-[190px]">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full
                     bg-transparent border-none cursor-pointer
                     text-[#5f6368] text-xl
                     hover:bg-[#f1f3f4] transition-colors"
          aria-label="Main menu"
        >
          ☰
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            🛡️
          </span>

          <span className="text-xl md:text-2xl font-medium text-[#1f1f1f]">
            MailGuard
          </span>
        </div>
      </div>

      {/* Search */}
      <div
        className="hidden sm:flex flex-1 max-w-[720px] mx-4 md:mx-8
                   h-11 items-center gap-3 px-4
                   bg-[#eaf0f8] rounded-full"
      >
        <span className="text-[#5f6368] text-base" aria-hidden="true">
          🔍
        </span>

        <input
          type="text"
          placeholder="Search mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none
                     text-sm text-[#202124]
                     placeholder:text-[#5f6368]"
        />

        <span
          className="text-[#5f6368] cursor-pointer"
          aria-hidden="true"
        >
          ☷
        </span>
      </div>

      {/* Header actions */}
      <div className="flex items-center gap-1">
        <button
          className="w-10 h-10 flex items-center justify-center
                     rounded-full border-none bg-transparent
                     text-[#5f6368] text-lg cursor-pointer
                     hover:bg-[#f1f3f4] transition-colors"
          title="Help"
        >
          ?
        </button>

        <button
          className="w-10 h-10 hidden md:flex items-center justify-center
                     rounded-full border-none bg-transparent
                     text-[#5f6368] text-lg cursor-pointer
                     hover:bg-[#f1f3f4] transition-colors"
          title="Settings"
        >
          ⚙
        </button>

        <button
          className="w-10 h-10 hidden md:flex items-center justify-center
                     rounded-full border-none bg-transparent
                     text-[#5f6368] text-lg cursor-pointer
                     hover:bg-[#f1f3f4] transition-colors"
          title="Google apps"
        >
          ⋮⋮
        </button>

        {/* Profile */}
        <div
          className="w-9 h-9 ml-1 rounded-full overflow-hidden
                     flex items-center justify-center
                     bg-[#1a73e8] text-white
                     text-sm font-semibold cursor-pointer"
          title={user.name}
        >
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            user.name?.charAt(0).toUpperCase()
          )}
        </div>
      </div>
    </header>


    {/* =====================================================
        BODY
    ====================================================== */}
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ===================================================
          SIDEBAR
      ==================================================== */}
      <aside
        className="hidden md:flex w-[250px] shrink-0
                   flex-col bg-[#f6f8fc]
                   px-3 py-4 overflow-y-auto"
      >

        {/* Compose */}
        <button
          onClick={() => navigate("/analyzer")}
          className="self-start flex items-center gap-3
                     px-5 py-3 mb-5
                     bg-[#c2e7ff] text-[#001d35]
                     rounded-2xl border-none
                     text-sm font-medium
                     cursor-pointer
                     shadow-sm
                     hover:shadow-md hover:bg-[#b8e2fc]
                     transition-all"
        >
          <span className="text-xl">✎</span>
          Compose
        </button>


        {/* Gmail Navigation */}
        <nav className="flex flex-col gap-1">

          {/* Inbox */}
          <button
            className="w-full h-9 px-4
                       flex items-center gap-4
                       rounded-r-full border-none
                       bg-[#d3e3fd] text-[#001d35]
                       cursor-pointer text-left"
          >
            <span className="text-base">📥</span>

            <strong className="flex-1 text-sm">
              Inbox
            </strong>

            <b className="text-xs">
              {messages.length}
            </b>
          </button>


          {/* Starred */}
          <button
            className="w-full h-9 px-4
                       flex items-center gap-4
                       rounded-r-full border-none
                       bg-transparent
                       text-[#3c4043]
                       cursor-pointer text-left
                       hover:bg-[#e8eaed]"
          >
            <span className="text-lg">☆</span>
            <span className="text-sm">Starred</span>
          </button>


          {/* Snoozed */}
          <button
            className="w-full h-9 px-4
                       flex items-center gap-4
                       rounded-r-full border-none
                       bg-transparent
                       text-[#3c4043]
                       cursor-pointer text-left
                       hover:bg-[#e8eaed]"
          >
            <span className="text-lg">◷</span>
            <span className="text-sm">Snoozed</span>
          </button>


          {/* Sent */}
          <button
            className="w-full h-9 px-4
                       flex items-center gap-4
                       rounded-r-full border-none
                       bg-transparent
                       text-[#3c4043]
                       cursor-pointer text-left
                       hover:bg-[#e8eaed]"
          >
            <span className="text-base">➤</span>
            <span className="text-sm">Sent</span>
          </button>


          {/* Drafts */}
          <button
            className="w-full h-9 px-4
                       flex items-center gap-4
                       rounded-r-full border-none
                       bg-transparent
                       text-[#3c4043]
                       cursor-pointer text-left
                       hover:bg-[#e8eaed]"
          >
            <span className="text-base">📝</span>

            <span className="flex-1 text-sm">
              Drafts
            </span>

            <b className="text-xs">0</b>
          </button>


          {/* Purchases */}
          <button
            className="w-full h-9 px-4
                       flex items-center gap-4
                       rounded-r-full border-none
                       bg-transparent
                       text-[#3c4043]
                       cursor-pointer text-left
                       hover:bg-[#e8eaed]"
          >
            <span className="text-base">🛍</span>

            <span className="flex-1 text-sm">
              Purchases
            </span>

            <b className="text-xs">0</b>
          </button>


          {/* More */}
          <button
            className="w-full h-9 px-4
                       flex items-center gap-4
                       rounded-r-full border-none
                       bg-transparent
                       text-[#3c4043]
                       cursor-pointer text-left
                       hover:bg-[#e8eaed]"
          >
            <span className="text-base">⌄</span>
            <span className="text-sm">More</span>
          </button>

        </nav>


        {/* Labels */}
        <div className="mt-6 px-4">
          <div className="flex items-center justify-between">
            <strong className="text-sm text-[#3c4043]">
              Labels
            </strong>

            <button
              aria-label="Add label"
              className="border-none bg-transparent
                         text-xl text-[#5f6368]
                         cursor-pointer"
            >
              ＋
            </button>
          </div>
        </div>


        {/* =================================================
            MAILGUARD SECURITY
        ================================================== */}
        <div className="mt-7 px-2">

          <div
            className="flex items-center gap-2
                       px-3 pb-3 mb-2
                       border-b border-[#e6e8ec]
                       text-sm font-semibold
                       text-[#1e7e5a]"
          >
            <span>🛡️</span>
            MailGuard Security
          </div>


          {/* Phishing */}
          <button
            onClick={() => navigate("/phishing")}
            className="w-full flex items-center gap-3
                       px-3 py-2.5 rounded-lg
                       border-none bg-transparent
                       text-[#3c4043]
                       text-sm text-left
                       cursor-pointer
                       hover:bg-[#e8eaed]"
          >
            <span>🎣</span>
            Phishing Detection
          </button>


          {/* Social */}
          <button
            onClick={() => navigate("/social")}
            className="w-full flex items-center gap-3
                       px-3 py-2.5 rounded-lg
                       border-none bg-transparent
                       text-[#3c4043]
                       text-sm text-left
                       cursor-pointer
                       hover:bg-[#e8eaed]"
          >
            <span>👥</span>
            Social Analysis
          </button>


          {/* IP */}
          <button
            onClick={() => navigate("/ip-tracing")}
            className="w-full flex items-center gap-3
                       px-3 py-2.5 rounded-lg
                       border-none bg-transparent
                       text-[#3c4043]
                       text-sm text-left
                       cursor-pointer
                       hover:bg-[#e8eaed]"
          >
            <span>🌐</span>
            IP Tracing
          </button>


          {/* Analyzer */}
          <button
            onClick={() => navigate("/analyzer")}
            className="w-full flex items-center gap-3
                       px-3 py-2.5 rounded-lg
                       border-none bg-transparent
                       text-[#3c4043]
                       text-sm text-left
                       cursor-pointer
                       hover:bg-[#e8eaed]"
          >
            <span>🔍</span>
            Email Analyzer
          </button>

        </div>

      </aside>


      {/* ===================================================
          MAIN EMAIL AREA
      ==================================================== */}
      <main
        className="flex-1 min-w-0
                   flex flex-col
                   bg-white
                   md:m-2 md:rounded-xl
                   overflow-hidden
                   shadow-[0_1px_2px_rgba(60,64,67,0.08),0_1px_3px_rgba(60,64,67,0.08)]"
      >

        {/* =================================================
            TOOLBAR
        ================================================== */}
        <div
          className="h-[56px] min-h-[56px]
                     flex items-center justify-between
                     px-3 md:px-4
                     border-b border-[#e6e8ec]
                     bg-white"
        >

          {/* Left toolbar */}
          <div className="flex items-center gap-1">

            {/* Select */}
            <button
              className="w-9 h-9 flex items-center justify-center
                         rounded-full border-none
                         bg-transparent
                         text-[#5f6368] text-lg
                         cursor-pointer
                         hover:bg-[#f1f3f4]"
              title="Select"
            >
              □
            </button>


            {/* Refresh */}
            <button
              className={`w-9 h-9 flex items-center justify-center
                         rounded-full border-none
                         bg-transparent
                         text-[#5f6368] text-xl
                         cursor-pointer
                         hover:bg-[#f1f3f4]
                         disabled:opacity-50
                         disabled:cursor-default
                         ${refreshing ? "animate-spin" : ""}`}
              title="Refresh"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              ↻
            </button>


            {/* More */}
            <button
              className="w-9 h-9 flex items-center justify-center
                         rounded-full border-none
                         bg-transparent
                         text-[#5f6368] text-xl
                         cursor-pointer
                         hover:bg-[#f1f3f4]"
              title="More"
            >
              ⋮
            </button>

          </div>


          {/* Right toolbar */}
          <div className="flex items-center gap-1">

            <span
              className="hidden sm:block
                         text-xs text-[#5f6368]
                         mr-1"
            >
              {rangeStart}–{rangeEnd} of {messages.length}
            </span>


            {/* Previous */}
            <button
              className="w-9 h-9 flex items-center justify-center
                         rounded-full border-none
                         bg-transparent
                         text-[#5f6368] text-2xl
                         cursor-pointer
                         hover:bg-[#f1f3f4]
                         disabled:opacity-40
                         disabled:cursor-default"
              title="Previous page"
              onClick={handlePrevious}
              disabled={pageIndex === 0 || pageLoading}
            >
              ‹
            </button>


            {/* Next */}
            <button
              className="w-9 h-9 flex items-center justify-center
                         rounded-full border-none
                         bg-transparent
                         text-[#5f6368] text-2xl
                         cursor-pointer
                         hover:bg-[#f1f3f4]
                         disabled:opacity-40
                         disabled:cursor-default"
              title="Next page"
              onClick={handleNext}
              disabled={!hasNext || pageLoading}
            >
              ›
            </button>

          </div>

        </div>


        {/* =================================================
            EMAIL LIST
        ================================================== */}
        <div className="flex-1 overflow-y-auto">

          {/* Page loading */}
          {pageLoading ? (
            <div className="h-full flex items-center justify-center">
              <div
                className="w-9 h-9 rounded-full
                           border-[3px] border-[#dadce0]
                           border-t-[#1a73e8]
                           animate-spin"
              />
            </div>

          ) : filteredMessages.length === 0 ? (

            /* Empty inbox */
            <div
              className="h-full flex flex-col
                         items-center justify-center
                         text-center px-5"
            >
              <div className="text-5xl mb-4">
                📭
              </div>

              <h3 className="text-base font-medium text-[#3c4043]">
                No emails found
              </h3>

              <p className="mt-2 text-sm text-[#5f6368]">
                Your Gmail inbox doesn't contain matching messages.
              </p>
            </div>

          ) : (

            /* Email rows */
            filteredMessages.map((message) => (

              <div
                key={message.message_id}
                onClick={() => openEmail(message.message_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    openEmail(message.message_id);
                  }
                }}
                className="group
                           h-[54px]
                           flex items-center
                           px-3 md:px-4
                           border-b border-[#e6e8ec]
                           bg-white
                           cursor-pointer
                           transition-all duration-150
                           hover:bg-[#f2f6fc]
                           hover:shadow-[0_1px_2px_rgba(60,64,67,0.15)]"
              >

                {/* Checkbox */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-9 shrink-0
                             flex items-center justify-center
                             text-[#5f6368]
                             text-lg"
                >
                  □
                </div>


                {/* Star */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-9 shrink-0
                             flex items-center justify-center
                             text-[#5f6368]
                             text-xl
                             hover:text-[#f4b400]"
                >
                  ☆
                </div>


                {/* Sender */}
                <div
                  className="hidden sm:block
                             w-[100px] shrink-0
                             text-sm font-medium
                             text-[#3c4043]
                             truncate"
                >
                  Gmail
                </div>


                {/* Subject */}
                <div
                  className="flex-1 min-w-0
                             flex items-center
                             gap-2"
                >
                  <strong
                    className="text-sm font-medium
                               text-[#202124]
                               truncate"
                  >
                    {message.name}
                  </strong>

                  <span
                    className="hidden md:inline
                               text-sm text-[#5f6368]
                               truncate"
                  >
                    — Click to open and analyze this email
                  </span>
                </div>


                {/* Message ID */}
                <div
                  className="hidden lg:block
                             max-w-[180px]
                             ml-4
                             text-[11px]
                             text-[#9aa0a6]
                             font-mono
                             truncate"
                >
                  {message.message_id}
                </div>


                {/* Arrow */}
                <div
                  className="w-8 shrink-0
                             flex items-center justify-center
                             text-[#5f6368]
                             text-2xl
                             opacity-0
                             group-hover:opacity-100
                             transition-opacity"
                  aria-hidden="true"
                >
                  ›
                </div>

              </div>

            ))
          )}

        </div>

      </main>

    </div>
  </div>
);
}
export default Dashboard;