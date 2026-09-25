import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const API_URL = "https://emailforensic.onrender.com";

const Forensicreport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  // =====================================================
  // STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  // =====================================================
  // GET MESSAGE ID
  // URL FORMAT:
  // /forensic-report?message_id=xxxxx
  // =====================================================

  const params = new URLSearchParams(
    window.location.search
  );

  const messageId = params.get("message_id");

  // =====================================================
  // FETCH CACHED ANALYSIS
  // =====================================================

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("access_token");

        if (!messageId) {
          setError("Message ID is missing");
          return;
        }

        if (!token) {
          setError(
            "Authentication token is missing"
          );
          return;
        }

        // IMPORTANT:
        // Retrieve from CACHE
        const response = await fetch(
          `${API_URL}/gmail/cached-analysis/${encodeURIComponent(
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

        console.log(
          "Cached Analysis Response:",
          result
        );

        if (!response.ok) {
          throw new Error(
            result?.detail ||
              "Failed to fetch cached analysis"
          );
        }

        if (!result?.success) {
          throw new Error(
            result?.message ||
              "Analysis not found"
          );
        }

        if (!result?.data) {
          throw new Error(
            "Analysis data not found"
          );
        }

        // result.data = actual cached analysis
        setReport(result.data);

      } catch (err) {
        console.error(
          "Forensic Report Error:",
          err
        );

        setError(
          err?.message ||
            "Failed to load forensic report"
        );

      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [messageId]);

  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "Message ID:",
    messageId
  );

  console.log(
    "Forensic Report:",
    report
  );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">

        <div className="text-center">

          <div className="w-12 h-12 border-4 border-t-blue-500 rounded-full animate-spin mx-auto mb-5"></div>

          <h2 className="text-xl font-semibold text-slate-900">
            Loading Forensic Report
          </h2>

          <p className="text-sm mt-2">
            Retrieving analysis from cache...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">

        <div className="text-center max-w-md">

          <div className="text-5xl mb-5">
            ⚠️
          </div>

          <h2 className="text-2xl font-semibold mb-3">
            Forensic Report Unavailable
          </h2>

          <p className="mb-6">
            {error ||
              "No forensic analysis was found."}
          </p>

          <div className="flex justify-center gap-3">

            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded-lg border hover:"
            >
              ← Back
            </button>

            <button
              onClick={() =>
                navigate("/dashboard")
              }
              className="px-5 py-2 rounded-lg hover:"
            >
              Dashboard
            </button>

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // DATA
  // =====================================================

  const email =
    report?.email || {};

  const detection =
    report?.detection_engine || {};

  const ai =
    detection?.ai_analysis || {};

  const threatScore =
    detection?.threat_score ?? 0;

  const safeScore =
    detection?.safe_score ?? 0;

  const riskLevel =
    detection?.risk_level || "unknown";

  const features =
    detection?.features || {};

  // =====================================================
  // IP FORENSICS
  //
  // Actual structure:
  //
  // report
  //   └── ip_tracing
  //        └── ip_forensics
  //             └── ip_records
  // =====================================================

  const ipForensics =
    report?.ip_tracing?.ip_forensics
      ?.ip_records || [];

  // =====================================================
  // DOWNLOAD PDF
  // =====================================================

const downloadPDF = async () => {
  const element = reportRef.current;

  if (!element) {
    console.error("Report element not found");
    return;
  }

  try {
    console.log("Starting color PDF generation...");

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    /*
     * IMPORTANT:
     * html2canvas can fail when it encounters modern CSS color functions
     * such as oklch()/oklab(). We keep the original UI colors, but before
     * rendering the cloned document we convert those functions to browser-
     * computed rgb()/rgba() values.
     */
    const canvas = await html2canvas(element, {
      scale: 1.25,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: Math.max(document.documentElement.clientWidth, element.scrollWidth),
      windowHeight: Math.max(document.documentElement.clientHeight, element.scrollHeight),

      onclone: (clonedDocument) => {
        const clonedReport = clonedDocument.querySelector("#forensic-report");

        if (!clonedReport) {
          throw new Error("Cloned forensic report was not found");
        }

        /*
         * Convert one CSS color value using the browser itself.
         * The browser understands oklch/oklab even when html2canvas does not.
         */
        const convertColor = (value) => {
          const input = String(value || "").trim();

          if (!input) {
            return input;
          }

          const probe = clonedDocument.createElement("span");
          probe.style.position = "absolute";
          probe.style.left = "-99999px";
          probe.style.top = "-99999px";
          probe.style.color = "rgb(0, 0, 0)";
          clonedDocument.body.appendChild(probe);

          try {
            probe.style.color = input;
            const computed = clonedDocument.defaultView.getComputedStyle(probe).color;

            if (computed && computed !== "rgba(0, 0, 0, 0)") {
              return computed;
            }

            // Try background-color for values that are not accepted as text color.
            probe.style.color = "";
            probe.style.backgroundColor = input;
            const background = clonedDocument.defaultView
              .getComputedStyle(probe)
              .backgroundColor;

            if (background && background !== "rgba(0, 0, 0, 0)") {
              return background;
            }
          } catch (e) {
            console.warn("Could not convert CSS color:", input, e);
          } finally {
            probe.remove();
          }

          /*
           * If conversion fails, use a safe neutral fallback instead of
           * allowing the unsupported function to reach html2canvas.
           */
          return "#000000";
        };

        /*
         * Replace modern color functions in arbitrary CSS text while
         * respecting nested parentheses.
         */
        const replaceColorFunctions = (cssText) => {
          let output = "";
          let i = 0;

          const functionNames = [
            "color-mix",
            "oklch",
            "oklab",
            "color",
            "lch",
            "lab",
          ];

          while (i < cssText.length) {
            let matchedName = null;

            for (const name of functionNames) {
              const before = i === 0 ? "" : cssText[i - 1];
              const segment = cssText.slice(i, i + name.length).toLowerCase();

              if (
                segment === name &&
                (i === 0 || !/[a-z0-9_-]/i.test(before)) &&
                cssText[i + name.length] === "("
              ) {
                matchedName = name;
                break;
              }
            }

            if (!matchedName) {
              output += cssText[i];
              i += 1;
              continue;
            }

            const start = i;
            let depth = 0;
            let end = -1;

            for (let j = i + matchedName.length; j < cssText.length; j++) {
              const ch = cssText[j];

              if (ch === "(") {
                depth += 1;
              } else if (ch === ")") {
                depth -= 1;

                if (depth === 0) {
                  end = j + 1;
                  break;
                }
              }
            }

            if (end === -1) {
              output += cssText[i];
              i += 1;
              continue;
            }

            const token = cssText.slice(start, end);
            output += convertColor(token);
            i = end;
          }

          return output;
        };

        /*
         * First convert all <style> blocks. This preserves the complete
         * Tailwind layout/color design instead of deleting the colors.
         */
        clonedDocument.querySelectorAll("style").forEach((style) => {
          style.textContent = replaceColorFunctions(style.textContent || "");
        });

        /*
         * Also sanitize inline styles and CSS custom properties.
         */
        clonedDocument.querySelectorAll("*").forEach((node) => {
          if (!node.hasAttribute("style")) return;

          const originalStyle = node.getAttribute("style") || "";
          node.setAttribute(
            "style",
            replaceColorFunctions(originalStyle)
          );
        });

        /*
         * Sanitize linked stylesheets too. This is important because Tailwind
         * can be delivered as a <link> stylesheet rather than a <style> tag.
         * We modify every accessible CSS rule in the cloned document while
         * preserving layout, typography, borders, gradients, and colors.
         */
        const sanitizeRuleList = (rules) => {
          if (!rules) return;

          for (let index = 0; index < rules.length; index += 1) {
            const rule = rules[index];

            try {
              if (rule.style) {
                const originalCss = rule.style.cssText || "";
                const convertedCss = replaceColorFunctions(originalCss);

                if (convertedCss !== originalCss) {
                  rule.style.cssText = convertedCss;
                }
              }

              if (rule.cssRules) {
                sanitizeRuleList(rule.cssRules);
              }
            } catch (e) {
              // Some browser-generated CSS rules are read-only. They can be
              // ignored because html2canvas will still render the rest.
              console.warn("Could not sanitize CSS rule:", e);
            }
          }
        };

        clonedDocument.querySelectorAll("style").forEach((style) => {
          try {
            sanitizeRuleList(style.sheet?.cssRules);
          } catch (e) {
            console.warn("Could not access style rules:", e);
          }
        });

        clonedDocument
          .querySelectorAll("link[rel='stylesheet']")
          .forEach((link) => {
            try {
              const sheet = link.sheet;

              if (sheet?.cssRules) {
                sanitizeRuleList(sheet.cssRules);
              } else {
                // Cross-origin sheets cannot be safely inspected. Remove them
                // rather than allowing html2canvas to parse unsupported CSS.
                link.remove();
              }
            } catch (e) {
              console.warn("Removing inaccessible stylesheet:", e);
              link.remove();
            }
          });

        /*
         * Force a stable white report background for printing while keeping
         * all other original colors.
         */
        clonedReport.style.backgroundColor = "#ffffff";
        clonedReport.style.boxShadow = "none";

        /*
         * Hide navigation and buttons from the PDF.
         */
        clonedReport
          .querySelectorAll("button, [data-pdf-hide='true']")
          .forEach((node) => {
            node.style.setProperty("display", "none", "important");
          });

        /*
         * Avoid sticky/fixed elements affecting the captured document.
         */
        clonedDocument.querySelectorAll("*").forEach((node) => {
          const computed = clonedDocument.defaultView.getComputedStyle(node);

          if (computed.position === "sticky" || computed.position === "fixed") {
            node.style.position = "static";
          }
        });
      },
    });

    console.log("Canvas created:", canvas.width, canvas.height);

    if (!canvas.width || !canvas.height) {
      throw new Error("PDF canvas is empty");
    }

    /*
     * IMPORTANT:
     * Do NOT place one giant image on every PDF page with a negative Y
     * position. That approach can produce blank/white pages.
     *
     * Instead, crop the canvas into exact A4-sized slices and put one slice
     * on each PDF page.
     */
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const pxPerMm = canvas.width / pdfWidth;
    const pageHeightPx = Math.floor(pdfHeight * pxPerMm);

    let sourceY = 0;
    let pageNumber = 0;

    while (sourceY < canvas.height) {
      const sliceHeightPx = Math.min(
        pageHeightPx,
        canvas.height - sourceY
      );

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;

      const ctx = pageCanvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not create PDF page canvas");
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );

      const pageImage = pageCanvas.toDataURL("image/jpeg", 0.92);
      const pageHeightMm = sliceHeightPx / pxPerMm;

      if (pageNumber > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        pageImage,
        "JPEG",
        0,
        0,
        pdfWidth,
        pageHeightMm,
        undefined,
        "FAST"
      );

      sourceY += sliceHeightPx;
      pageNumber += 1;
    }

    const safeMessageId = String(messageId || "unknown")
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .substring(0, 100);

    pdf.save(`forensic-report-${safeMessageId}.pdf`);

    console.log(`PDF downloaded successfully: ${pageNumber} page(s)`);
  } catch (error) {
    console.error("PDF generation failed:", error);

    alert(
      `Failed to generate PDF: ${
        error?.message || "Unknown error"
      }`
    );
  }
};

  // =====================================================
  // RISK COLOR
  // =====================================================

  const getRiskClass = () => {
    const risk = String(riskLevel || "").toLowerCase();

    if (risk.includes("high") || risk.includes("critical")) {
      return "border border-red-300 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-center";
    }

    if (risk.includes("medium")) {
      return "border border-amber-300 bg-amber-50 text-amber-700 rounded-xl px-4 py-3 text-center";
    }

    if (risk.includes("low") || risk.includes("safe")) {
      return "border border-green-300 bg-green-50 text-green-700 rounded-xl px-4 py-3 text-center";
    }

    return "border border-slate-300 bg-slate-50 text-slate-700 rounded-xl px-4 py-3 text-center";
  };

  // =====================================================
  // REPORT UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =================================================
          TOP NAVIGATION
      ================================================= */}

      <div data-pdf-hide="true" className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>

            <h1 className="text-xl font-bold text-white">
              MailGuard
            </h1>

            <p className="text-xs">
              Digital Forensic Intelligence
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={() =>
                navigate(-1)
              }
              className="px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 text-sm"
            >
              ← Back
            </button>

            <button
              data-pdf-hide="true"
              onClick={downloadPDF}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow"
            >
              ↓ Download PDF
            </button>

          </div>

        </div>

      </div>


      {/* =================================================
          REPORT
      ================================================= */}

      <div
        ref={reportRef}
        id="forensic-report"
        className="max-w-6xl mx-auto my-8 bg-white shadow-xl rounded-2xl overflow-hidden"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="px-10 py-8 border-b">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Digital Forensic Report
              </p>

              <h2 className="text-3xl font-bold mt-2 text-slate-900">
                Email Security & Forensic Analysis
              </h2>

              <p className="mt-2">
                Automated analysis report generated by MailGuard
              </p>

              <p className="text-xs mt-3 break-all">
                Message ID: {messageId}
              </p>

            </div>

            <div
              className={`px-4 py-3 rounded-xl border text-center ${getRiskClass()}`}
            >

              <p className="text-xs uppercase font-semibold">
                Risk Level
              </p>

              <p className="text-xl font-bold uppercase">
                {riskLevel}
              </p>

            </div>

          </div>

        </div>


        {/* =================================================
            EXECUTIVE SUMMARY
        ================================================= */}

        <section className="p-10">

          <h3 className="text-xl font-bold mb-5 text-slate-900">
            Executive Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="border rounded-xl p-5">

              <p className="text-sm">
                Threat Score
              </p>

              <p className="text-3xl font-bold mt-2 text-slate-900">
                {threatScore}
              </p>

              <p className="text-xs mt-1">
                / 100
              </p>

            </div>


            <div className="border rounded-xl p-5">

              <p className="text-sm">
                Safety Score
              </p>

              <p className="text-3xl font-bold mt-2 text-slate-900">
                {safeScore}
              </p>

              <p className="text-xs mt-1">
                / 100
              </p>

            </div>


            <div className="border rounded-xl p-5">

              <p className="text-sm">
                URLs Detected
              </p>

              <p className="text-3xl font-bold mt-2 text-slate-900">
                {email?.urls?.length || 0}
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            EMAIL INFORMATION
        ================================================= */}

        <section className="px-10 pb-10">

          <h3 className="text-xl font-bold mb-5 text-slate-900">
            Email Information
          </h3>

          <div className="border rounded-xl overflow-hidden">

            <div className="grid grid-cols-1 md:grid-cols-2">

              <Info
                label="From"
                value={email?.from}
              />

              <Info
                label="To"
                value={email?.to}
              />

              <Info
                label="Subject"
                value={email?.subject}
              />

              <Info
                label="Date"
                value={email?.date}
              />

              <Info
                label="Reply-To"
                value={
                  email?.reply_to ||
                  "Not provided"
                }
              />

              <Info
                label="Return Path"
                value={
                  email?.return_path
                }
              />

              <Info
                label="Message ID"
                value={
                  email?.message_id
                }
              />

              <Info
                label="Thread ID"
                value={
                  email?.thread_id
                }
              />

            </div>

          </div>

        </section>


        {/* =================================================
            EMAIL AUTHENTICATION
        ================================================= */}

        <section className="px-10 pb-10">

          <h3 className="text-xl font-bold mb-5 text-slate-900">
            Email Authentication
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <AuthCard
              title="SPF"
              data={
                email?.authentication?.spf
              }
            />

            <AuthCard
              title="DKIM"
              data={
                email?.authentication?.dkim
              }
            />

            <AuthCard
              title="DMARC"
              data={
                email?.authentication?.dmarc
              }
            />

          </div>

        </section>


        {/* =================================================
            AI ANALYSIS
        ================================================= */}

        <section className="px-10 pb-10">

          <h3 className="text-xl font-bold mb-5 text-slate-900">
            AI Threat Analysis
          </h3>

          <div className="border rounded-xl p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <AnalysisItem
                label="Urgency"
                value={
                  ai?.subject_analysis
                    ?.urgency
                }
              />

              <AnalysisItem
                label="Threats"
                value={
                  ai?.subject_analysis
                    ?.threats
                }
              />

              <AnalysisItem
                label="Financial Request"
                value={
                  ai?.subject_analysis
                    ?.financial_request
                }
              />

              <AnalysisItem
                label="Credential Request"
                value={
                  ai?.subject_analysis
                    ?.credential_request
                }
              />

              <AnalysisItem
                label="Unusual Language"
                value={
                  ai?.subject_analysis
                    ?.unusual_language
                }
              />

              <AnalysisItem
                label="Fear"
                value={
                  ai?.body_analysis?.fear
                }
              />

              <AnalysisItem
                label="Pressure"
                value={
                  ai?.body_analysis?.pressure
                }
              />

              <AnalysisItem
                label="Password Request"
                value={
                  ai?.body_analysis
                    ?.password_request
                }
              />

            </div>


            {ai?.reasons?.length > 0 && (

              <div className="mt-6">

                <h4 className="font-semibold mb-3">
                  AI Findings
                </h4>

                <ul className="space-y-2">

                  {ai.reasons.map(
                    (reason, index) => (

                      <li
                        key={index}
                        className="text-sm border rounded-lg p-3"
                      >
                        • {reason}
                      </li>

                    )
                  )}

                </ul>

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            PHISHING ANALYSIS
        ================================================= */}

        <section className="px-10 pb-10">

          <h3 className="text-xl font-bold mb-5 text-slate-900">
            Phishing Analysis
          </h3>

          <div className="border rounded-xl p-6">

            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(
                report?.phishing || {},
                null,
                2
              )}
            </pre>

          </div>

        </section>


        {/* =================================================
            SOCIAL ENGINEERING
        ================================================= */}

        <section className="px-10 pb-10">

          <h3 className="text-xl font-bold mb-5 text-slate-900">
            Social Engineering Analysis
          </h3>

          <div className="border rounded-xl p-6">

            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(
                report?.social || {},
                null,
                2
              )}
            </pre>

          </div>

        </section>


        {/* =================================================
            URL ANALYSIS
        ================================================= */}

        <section className="px-10 pb-10">

          <h3 className="text-xl font-bold mb-5 text-slate-900">
            URL Analysis
          </h3>

          <div className="border rounded-xl overflow-hidden">

            {email?.urls?.length > 0 ? (

              email.urls.map(
                (url, index) => (

                  <div
                    key={index}
                    className="p-4 border-b last:border-b-0"
                  >

                    <p className="text-xs">
                      URL {index + 1}
                    </p>

                    <p className="text-sm break-all mt-1">
                      {url}
                    </p>

                  </div>

                )
              )

            ) : (

              <div className="p-5">
                No URLs detected.
              </div>

            )}

          </div>

        </section>


        {/* =================================================
            IP FORENSICS
        ================================================= */}

        <section className="px-10 pb-10">

          <h3 className="text-xl font-bold mb-5 text-slate-900">
            IP Forensics
          </h3>

          {Array.isArray(ipForensics) &&
          ipForensics.length > 0 ? (

            <div className="space-y-6">

              {ipForensics.map(
                (record, index) => {

                  const geo =
                    record?.geolocation ||
                    {};

                  const network =
                    record?.network ||
                    {};

                  const anon =
                    record?.anonymization ||
                    {};

                  const classification =
                    record?.classification ||
                    {};

                  return (

                    <div
                      key={index}
                      className="border rounded-xl overflow-hidden"
                    >

                      {/* IP HEADER */}

                      <div className="px-5 py-4 flex justify-between items-center">

                        <div>

                          <p className="text-xs">
                            IP RECORD {index + 1}
                          </p>

                          <p className="text-lg font-bold">
                            {record?.ip ||
                              "Unknown IP"}
                          </p>

                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            record?.success
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-red-100 text-red-700 border-red-300"
                          }`}
                        >
                          {record?.success
                            ? "Analysis Successful"
                            : "Analysis Failed"}
                        </span>

                      </div>


                      {/* IP DETAILS */}

                      <div className="p-5">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                          <Info
                            label="IP Address"
                            value={
                              record?.ip
                            }
                          />

                          <Info
                            label="IP Type"
                            value={
                              record?.type
                            }
                          />

                          <Info
                            label="Hostname"
                            value={
                              record?.hostname
                            }
                          />

                          <Info
                            label="Country"
                            value={
                              geo?.country
                            }
                          />

                          <Info
                            label="City"
                            value={
                              geo?.city ||
                              "Unknown"
                            }
                          />

                          <Info
                            label="Region"
                            value={
                              geo?.region ||
                              "Unknown"
                            }
                          />

                          <Info
                            label="Timezone"
                            value={
                              geo?.timezone ||
                              "Unknown"
                            }
                          />

                          <Info
                            label="Latitude"
                            value={
                              geo?.latitude
                            }
                          />

                          <Info
                            label="Longitude"
                            value={
                              geo?.longitude
                            }
                          />

                          <Info
                            label="Network"
                            value={
                              network?.network
                            }
                          />

                          <Info
                            label="ASN"
                            value={
                              network?.asn
                            }
                          />

                          <Info
                            label="Organization"
                            value={
                              network?.organization
                            }
                          />

                        </div>


                        {/* CLASSIFICATION */}

                        <div className="mt-6">

                          <h4 className="font-semibold mb-3">
                            IP Classification
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <Info
                              label="Provider"
                              value={
                                classification?.provider
                              }
                            />

                            <Info
                              label="Role"
                              value={
                                classification?.role
                              }
                            />

                            <Info
                              label="IP Type"
                              value={
                                classification?.ip_type
                              }
                            />

                          </div>


                          {classification?.reason && (

                            <div className="mt-3 p-4 border rounded-lg">

                              <p className="text-xs uppercase">
                                Classification Reason
                              </p>

                              <p className="text-sm mt-1">
                                {
                                  classification.reason
                                }
                              </p>

                            </div>

                          )}

                        </div>


                        {/* ANONYMIZATION */}

                        <div className="mt-6">

                          <h4 className="font-semibold mb-3">
                            Anonymization Detection
                          </h4>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                            <Detection
                              label="VPN"
                              value={
                                anon?.vpn
                              }
                            />

                            <Detection
                              label="Proxy"
                              value={
                                anon?.proxy
                              }
                            />

                            <Detection
                              label="Tor"
                              value={
                                anon?.tor
                              }
                            />

                            <Detection
                              label="Relay"
                              value={
                                anon?.relay
                              }
                            />

                          </div>


                          <div className="mt-4">

                            <div
                              className={`p-4 rounded-lg border ${
                                anon?.is_anonymized
                                  ? "bg-red-50 border-red-300 text-red-700"
                                  : "bg-green-50 border-green-300 text-green-700"
                              }`}
                            >

                              <div className="flex justify-between items-center">

                                <span className="font-semibold">
                                  Anonymized Connection
                                </span>

                                <span
                                  className={`text-sm font-bold ${
                                    anon?.is_anonymized
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {anon?.is_anonymized
                                    ? "YES"
                                    : "NO"}
                                </span>

                              </div>

                            </div>

                          </div>

                        </div>


                        {/* HEADER INFORMATION */}

                        {record?.header_index !==
                          undefined && (

                          <div className="mt-6">

                            <h4 className="font-semibold mb-3">
                              Email Header Information
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                              <Info
                                label="Header Index"
                                value={
                                  record?.header_index
                                }
                              />

                              <Info
                                label="Header Hostname"
                                value={
                                  record?.hostname
                                }
                              />

                              <Info
                                label="Header Type"
                                value={
                                  record?.type
                                }
                              />

                            </div>

                          </div>

                        )}

                      </div>

                    </div>

                  );
                }
              )}

            </div>

          ) : (

            <div className="border rounded-xl p-6">
              No IP forensic records available.
            </div>

          )}

        </section>


        {/* =================================================
            ML FEATURES
        ================================================= */}

        <section className="px-10 pb-10">

          <h3 className="text-xl font-bold mb-5 text-slate-900">
            ML Detection Features
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {Object.entries(features).map(
              ([key, value]) => (

                <div
                  key={key}
                  className="border rounded-xl p-4"
                >

                  <p className="text-xs capitalize">
                    {key.replaceAll(
                      "_",
                      " "
                    )}
                  </p>

                  <p className="text-xl font-bold mt-2">
                    {String(value)}
                  </p>

                </div>

              )
            )}

          </div>

        </section>


        {/* =================================================
            EMAIL BODY
        ================================================= */}

        <section className="px-10 pb-10">

          <h3 className="text-xl font-bold mb-5 text-slate-900">
            Email Content
          </h3>

          <div className="border rounded-xl p-6">

            <pre className="whitespace-pre-wrap text-sm font-sans leading-7">
              {email?.body ||
                "Email body unavailable"}
            </pre>

          </div>

        </section>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="border-t border-slate-200 bg-slate-50 px-10 py-6">

          <div className="flex justify-between text-xs">

            <span>
              MailGuard • Email Forensic Intelligence
            </span>

            <span>
              Confidential Security Report
            </span>

          </div>

        </div>

      </div>

    </div>
  );
};


// =========================================================
// INFO COMPONENT
// =========================================================

const Info = ({
  label,
  value
}) => (

  <div className="p-4 border rounded-lg">

    <p className="text-xs uppercase tracking-wide">
      {label}
    </p>

    <p className="mt-1 text-sm font-medium break-all">
      {value !== undefined &&
      value !== null &&
      value !== ""
        ? String(value)
        : "Not available"}
    </p>

  </div>

);


// =========================================================
// AUTHENTICATION CARD
// =========================================================

const AuthCard = ({
  title,
  data
}) => {

  const result =
    Array.isArray(data)
      ? data[0]
      : data;

  return (

    <div className="border rounded-xl p-5">

      <div className="flex justify-between">

        <h4 className="font-bold">
          {title}
        </h4>

        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            result
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {result
            ? "Present"
            : "N/A"}
        </span>

      </div>

      <pre className="mt-4 text-xs whitespace-pre-wrap break-all">
        {result
          ? JSON.stringify(
              result,
              null,
              2
            )
          : "No authentication information"}
      </pre>

    </div>

  );
};


// =========================================================
// AI ANALYSIS ITEM
// =========================================================

const AnalysisItem = ({
  label,
  value
}) => (

  <div className="border rounded-lg p-4 flex justify-between items-center">

    <span className="text-sm font-medium">
      {label}
    </span>

    <span
      className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
        value
          ? "bg-red-100 text-red-700"
          : "bg-green-100 text-green-700"
      }`}
    >
      {value
        ? "Detected"
        : "Not Detected"}
    </span>

  </div>

);


// =========================================================
// DETECTION COMPONENT
// =========================================================

const Detection = ({
  label,
  value
}) => (

  <div className="border rounded-lg p-3 flex justify-between items-center">

    <span className="text-sm">
      {label}
    </span>

    <span
      className={`text-xs font-bold ${
        value
          ? "text-red-600"
          : "text-green-600"
      }`}
    >
      {value
        ? "YES"
        : "NO"}
    </span>

  </div>

);


export default Forensicreport;