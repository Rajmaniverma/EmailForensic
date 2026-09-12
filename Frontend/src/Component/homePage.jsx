
import { useEffect, useRef, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function homePage() {
  // ==========================================================
  // EML STATE
  // ==========================================================

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // ==========================================================
  // GMAIL STATE
  // ==========================================================

  const [gmailAuth, setGmailAuth] = useState({
    authenticated: false,
  });

  const [gmailMessageId, setGmailMessageId] = useState("");

  // ==========================================================
  // GENERAL STATE
  // ==========================================================

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  // ==========================================================
  // CHECK GMAIL AUTH STATUS
  // ==========================================================

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/auth/status`
      );

      if (!response.ok) {
        return;
      }

      const result = await response.json();

      setGmailAuth(result);
    } catch (err) {
      console.warn(
        "Unable to check Gmail authentication:",
        err
      );
    }
  };

  // ==========================================================
  // CONNECT GMAIL
  // ==========================================================

  const connectGmail = () => {
    setError("");

    window.location.href =
      `${API_BASE}/auth/login`;
  };

  // ==========================================================
  // FILE VALIDATION
  // ==========================================================

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".eml")
    ) {
      setError(
        "Only .eml files are supported."
      );

      setFile(null);

      return;
    }

    setFile(selectedFile);
    setError("");
    setData(null);
  };

  // ==========================================================
  // FILE SELECT
  // ==========================================================

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    validateFile(selectedFile);
  };

  // ==========================================================
  // DRAG & DROP
  // ==========================================================

  const handleDragOver = (event) => {
  event.preventDefault();
  event.stopPropagation();

  // Only activate for files
  if (event.dataTransfer.types.includes("Files")) {
    setDragActive(true);
  }
};

const handleDragEnter = (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (event.dataTransfer.types.includes("Files")) {
    setDragActive(true);
  }
};

const handleDragLeave = (event) => {
  event.preventDefault();
  event.stopPropagation();

  // Don't deactivate while moving between children
  if (!event.currentTarget.contains(event.relatedTarget)) {
    setDragActive(false);
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();

  setDragActive(false);

  const droppedFiles = event.dataTransfer.files;

  if (!droppedFiles || droppedFiles.length === 0) {
    return;
  }

  // Only take the first file
  const droppedFile = droppedFiles[0];

  validateFile(droppedFile);
};

  // ==========================================================
  // UPLOAD EML
  // ==========================================================

  const uploadFile = async () => {
    if (!file) {
      setError(
        "Please select an .eml file first."
      );

      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    try {
      const response = await fetch(
        `${API_BASE}/`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await response.json();
        console.log("BACKEND JSON:", result);

      if (!response.ok) {
        throw new Error(
          result.detail ||
          "EML analysis failed."
        );
      }

      setData(result);

    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // ANALYZE GMAIL EMAIL
  // ==========================================================

  const analyzeGmailEmail = async () => {
    const messageId =
      gmailMessageId.trim();

    if (!messageId) {
      setError(
        "Please enter a Gmail Message ID."
      );

      return;
    }

    if (!gmailAuth.authenticated) {
      setError(
        "Please connect your Gmail account first."
      );

      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch(
        `${API_BASE}/gmail/analyze`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            message_id: messageId,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ||
          "Gmail email analysis failed."
        );
      }

      setData(result);

    } catch (err) {
      setError(
        err.message ||
        "Unable to analyze Gmail email."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CLEAR EML
  // ==========================================================

  const clearFile = () => {
    setFile(null);
    setData(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==========================================================
  // CLEAR MESSAGE ID
  // ==========================================================

  const clearMessageId = () => {
    setGmailMessageId("");
    setData(null);
    setError("");
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="border-b border-slate-800 bg-slate-950/90">

        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">

              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v2h8z"
                />
              </svg>

            </div>

            <div>

              <h1 className="font-bold text-lg">
                Email Forensics
              </h1>

              <p className="text-xs text-slate-500">
                AI-powered email security
              </p>

            </div>

          </div>

          {/* Gmail Status */}

          <div className="text-xs">

            {gmailAuth.authenticated ? (

              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">

                <span className="w-2 h-2 bg-emerald-400 rounded-full" />

                Gmail Connected

                {gmailAuth.email && (
                  <span>
                    ({gmailAuth.email})
                  </span>
                )}

              </div>

            ) : (

              <div className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 flex items-center gap-2">

                <span className="w-2 h-2 bg-amber-400 rounded-full" />

                Gmail Disconnected

              </div>

            )}

          </div>

        </div>

      </header>


      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="max-w-6xl mx-auto px-6 py-14">

        {/* Heading */}

        <div className="text-center max-w-2xl mx-auto">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs mb-5">

            🛡️ Secure Email Analysis

          </div>

          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">

            Analyze suspicious emails

          </h2>

          <p className="mt-5 text-slate-400 leading-relaxed">

            Analyze saved EML files or retrieve
            a specific email directly through
            the Gmail API.

          </p>

        </div>


        {/* ==================================================
            TWO OPTIONS
        ================================================== */}

        <div className="grid md:grid-cols-2 gap-6 mt-12">


          {/* =================================================
              EML
          ================================================= */}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7">

            <div className="flex items-start justify-between">

              <div>

                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl mb-5">

                  📁

                </div>

                <h3 className="text-xl font-semibold">
                  Upload EML
                </h3>

                <p className="text-sm text-slate-400 mt-2">
                  Upload a saved email file
                  for forensic analysis.
                </p>

              </div>

              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
                .EML
              </span>

            </div>


            {/* Drop zone */}

<div
  onDragEnter={handleDragEnter}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  onClick={(event) => {
    event.stopPropagation();
    fileInputRef.current?.click();
  }}
              className={`
                mt-7 border-2 border-dashed
                rounded-2xl p-8 text-center
                cursor-pointer transition

                ${
                  dragActive
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 hover:border-slate-500 bg-slate-950/50"
                }
              `}
            >

              <input
                ref={fileInputRef}
                type="file"
                accept=".eml"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="text-4xl mb-4">
                {file ? "📄" : "☁️"}
              </div>

              {file ? (

                <>
                  <p className="font-medium text-blue-400 break-all">
                    {file.name}
                  </p>

                  <p className="text-xs text-slate-500 mt-2">
                    {(file.size / 1024).toFixed(2)}
                    {" "}KB
                  </p>
                </>

              ) : (

                <>
                  <p className="font-medium">
                    Drop your .eml file here
                  </p>

                  <p className="text-sm text-slate-500 mt-2">
                    or click to browse
                  </p>
                </>

              )}

            </div>


            {file && (

              <button
                onClick={clearFile}
                className="mt-3 text-xs text-slate-500 hover:text-white"
              >
                Remove selected file
              </button>

            )}


            <button
              onClick={uploadFile}
              disabled={!file || loading}
              className="
                w-full mt-6 py-3.5 rounded-xl
                bg-blue-600 hover:bg-blue-500
                disabled:bg-slate-800
                disabled:text-slate-600
                disabled:cursor-not-allowed
                font-semibold transition
              "
            >

              {loading
                ? "Analyzing..."
                : "Analyze EML"}

            </button>

          </div>


          {/* =================================================
              GMAIL
          ================================================= */}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7">

            <div className="flex items-start justify-between">

              <div>

                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-2xl mb-5">

                  ✉️

                </div>

                <h3 className="text-xl font-semibold">
                  Analyze from Gmail
                </h3>

                <p className="text-sm text-slate-400 mt-2">
                  Connect Gmail and analyze
                  an email using its Gmail
                  Message ID.
                </p>

              </div>

              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
                Gmail API
              </span>

            </div>


            {/* =================================================
                NOT CONNECTED
            ================================================= */}

            {!gmailAuth.authenticated ? (

              <div className="mt-6">

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">

                  <div className="flex items-center gap-3 mb-4">

                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-red-600 font-bold">

                      G

                    </div>

                    <div>

                      <p className="text-sm font-medium">
                        Google OAuth 2.0
                      </p>

                      <p className="text-xs text-slate-500">
                        Readonly Gmail Access
                      </p>

                    </div>

                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">

                    Connect your Google account
                    to allow the backend to read
                    Gmail messages through the
                    official Gmail API.

                  </p>

                </div>


                <button
                  onClick={connectGmail}
                  className="
                    w-full mt-4 py-3.5 rounded-xl
                    bg-white text-slate-900
                    hover:bg-slate-100
                    font-semibold transition
                  "
                >

                  Connect Gmail Account

                </button>

              </div>

            ) : (

              /* =================================================
                 CONNECTED
              ================================================= */

              <div className="mt-6">

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">

                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">

                    <span>✓</span>

                    Gmail account connected

                  </div>

                  {gmailAuth.email && (

                    <p className="text-xs text-emerald-300/70 mt-1">

                      {gmailAuth.email}

                    </p>

                  )}

                </div>


                {/* Message ID */}

                <div className="mt-5">

                  <label className="block text-xs font-medium text-slate-400 mb-2">

                    Gmail Message ID

                  </label>

                  <input
                    type="text"
                    value={gmailMessageId}
                    onChange={(event) =>
                      setGmailMessageId(
                        event.target.value
                      )
                    }
                    placeholder="Example: 18abc123xyz"
                    className="
                      w-full px-4 py-3 rounded-xl
                      bg-slate-950
                      border border-slate-800
                      text-white
                      placeholder-slate-600
                      focus:outline-none
                      focus:border-red-500
                      font-mono text-sm
                    "
                  />

                  <p className="text-xs text-slate-600 mt-2">

                    Enter the Gmail API message ID
                    of the email you want to analyze.

                  </p>

                </div>


                {/* Buttons */}

                <div className="flex gap-3 mt-5">

                  <button
                    onClick={analyzeGmailEmail}
                    disabled={
                      !gmailMessageId.trim() ||
                      loading
                    }
                    className="
                      flex-1 py-3.5 rounded-xl
                      bg-red-600 hover:bg-red-500
                      disabled:bg-slate-800
                      disabled:text-slate-600
                      disabled:cursor-not-allowed
                      font-semibold transition
                    "
                  >

                    {loading
                      ? "Analyzing..."
                      : "Analyze Gmail Email"}

                  </button>


                  {gmailMessageId && (

                    <button
                      onClick={clearMessageId}
                      disabled={loading}
                      className="
                        px-5 rounded-xl
                        border border-slate-700
                        text-slate-400
                        hover:text-white
                        hover:border-slate-500
                        transition
                      "
                    >

                      Clear

                    </button>

                  )}

                </div>

              </div>

            )}

            <p className="text-center text-xs text-slate-600 mt-4">

              Gmail password is never shared
              with this application.

            </p>

          </div>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="max-w-3xl mx-auto mt-6">

            <div className="
              flex gap-3 items-start
              bg-red-500/10
              border border-red-500/20
              text-red-400
              rounded-xl p-4
            ">

              <span>⚠️</span>

              <p className="text-sm">
                {error}
              </p>

            </div>

          </div>

        )}


        {/* ==================================================
            RESULT
        ================================================== */}

        {data && (

          <div className="
            mt-10
            bg-slate-900
            border border-slate-800
            rounded-3xl p-7
          ">

            <div className="flex items-center justify-between mb-5">

              <div>

                <h3 className="text-xl font-semibold">
                  Analysis Result
                </h3>

                <p className="text-sm text-slate-500 mt-1">

                  {data.message_id
                    ? `Message ID: ${data.message_id}`
                    : data.email?.gmail_id
                    ? `Gmail ID: ${data.email.gmail_id}`
                    : "Analysis completed"}

                </p>

              </div>

              <span className="
                px-3 py-1.5
                rounded-full
                bg-emerald-500/10
                text-emerald-400
                text-xs
              ">

                Analysis Complete

              </span>

            </div>


            {/* Result JSON */}

            <pre className="
              bg-slate-950
              border border-slate-800
              text-emerald-400
              p-5 rounded-2xl
              overflow-auto
              text-sm
              leading-relaxed
              max-h-[500px]
            ">

              {JSON.stringify(
                data,
                null,
                2
              )}

            </pre>

          </div>

        )}


        {/* ==================================================
            SECURITY FEATURES
        ================================================== */}

        <div className="
          grid grid-cols-2
          md:grid-cols-4
          gap-4 mt-10
        ">

          {[
            ["🔗", "URL Analysis"],
            ["🧠", "AI Reasoning"],
            ["🤖", "ML Detection"],
            ["🛡️", "Forensic Report"],
          ].map(
            ([icon, title]) => (

              <div
                key={title}
                className="
                  bg-slate-900/60
                  border border-slate-800
                  rounded-2xl
                  p-4
                  text-center
                "
              >

                <div className="text-xl">
                  {icon}
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  {title}
                </p>

              </div>

            )
          )}

        </div>

      </main>


      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer className="border-t border-slate-800">

        <div className="
          max-w-6xl mx-auto
          px-6 py-6
          text-center
          text-xs text-slate-600
        ">

          Email Forensics • Secure Analysis Platform

        </div>

      </footer>

    </div>
  );
}

export default homePage;
