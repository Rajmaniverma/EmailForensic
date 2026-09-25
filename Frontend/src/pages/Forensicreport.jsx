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

          <h2 className="text-xl font-semibold">
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
    console.log("Starting monochrome PDF generation...");

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(element, {
      scale: Math.min(window.devicePixelRatio || 1, 1.5),
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      imageTimeout: 15000,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,

      onclone: (clonedDocument) => {
        const clonedReport = clonedDocument.querySelector("#forensic-report");

        if (!clonedReport) {
          throw new Error("Cloned forensic report was not found");
        }

        // -------------------------------------------------
        // IMPORTANT:
        // Remove every external stylesheet. html2canvas can
        // fail while parsing modern Tailwind color functions
        // such as oklch()/oklab().
        // -------------------------------------------------
        clonedDocument
          .querySelectorAll("link[rel='stylesheet']")
          .forEach((link) => link.remove());

        // -------------------------------------------------
        // Rebuild all <style> tags without ANY color rules.
        // This keeps layout, spacing, grid/flex, fonts, etc.
        // but removes color/background/shadow declarations.
        // -------------------------------------------------
        const COLOR_PROPERTIES = new Set([
          "color",
          "background",
          "background-color",
          "background-image",
          "border-color",
          "border-top-color",
          "border-right-color",
          "border-bottom-color",
          "border-left-color",
          "outline-color",
          "text-decoration-color",
          "text-emphasis-color",
          "column-rule-color",
          "caret-color",
          "accent-color",
          "fill",
          "stroke",
          "stop-color",
          "flood-color",
          "lighting-color",
          "marker",
          "marker-start",
          "marker-mid",
          "marker-end",
          "box-shadow",
          "text-shadow",
        ]);

        const UNSUPPORTED_COLOR_FUNCTIONS = [
          "oklch(",
          "oklab(",
          "color-mix(",
          "color(",
          "lab(",
          "lch(",
        ];

        const shouldRemoveDeclaration = (property, value) => {
          const prop = property.toLowerCase().trim();
          const val = String(value || "").toLowerCase();

          if (COLOR_PROPERTIES.has(prop)) return true;
          if (prop.startsWith("--color-")) return true;
          if (prop.includes("shadow-color")) return true;

          return UNSUPPORTED_COLOR_FUNCTIONS.some((fn) =>
            val.includes(fn)
          );
        };

        const sanitizeCssText = (cssText) => {
          if (!cssText) return "";

          // Remove CSS custom properties that contain colors.
          let css = cssText.replace(
            /(--[\w-]+)\s*:\s*[^;{}]*(?:;|(?=}))/gi,
            (full, property) => {
              if (property.toLowerCase().startsWith("--color-")) {
                return "";
              }
              return full;
            }
          );

          // Remove ordinary color/shadow declarations and any
          // declaration containing unsupported color functions.
          css = css.replace(
            /([\w-]+)\s*:\s*([^;{}]+)(;|(?=}))/gi,
            (full, property, value, terminator) => {
              if (shouldRemoveDeclaration(property, value)) {
                return "";
              }
              return `${property}:${value}${terminator}`;
            }
          );

          return css;
        };

        // Rebuild every style element from raw text after stripping
        // color declarations. Raw text is used so html2canvas never
        // receives the original Tailwind oklch declarations.
        clonedDocument.querySelectorAll("style").forEach((style) => {
          const sanitized = sanitizeCssText(style.textContent || "");
          style.textContent = sanitized;
        });

        // Remove inline color declarations too.
        clonedReport.querySelectorAll("*").forEach((node) => {
          if (!node.hasAttribute("style")) return;

          const style = node.getAttribute("style") || "";
          const sanitized = sanitizeCssText(style);

          if (sanitized.trim()) {
            node.setAttribute("style", sanitized);
          } else {
            node.removeAttribute("style");
          }
        });

        // The report itself should be plain and printer-friendly.
        clonedReport.style.setProperty("background", "none", "important");
        clonedReport.style.setProperty("box-shadow", "none", "important");

        // Hide interactive/navigation elements from the PDF.
        clonedReport
          .querySelectorAll("button, [data-pdf-hide='true']")
          .forEach((node) => {
            node.style.setProperty("display", "none", "important");
          });
      },
    });

    console.log("Canvas created:", canvas.width, canvas.height);

    if (!canvas.width || !canvas.height) {
      throw new Error("PDF canvas is empty");
    }

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(
      imgData,
      "JPEG",
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      "FAST"
    );

    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );
      heightLeft -= pdfHeight;
    }

    const safeMessageId = String(messageId || "unknown")
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .substring(0, 100);

    pdf.save(`forensic-report-${safeMessageId}.pdf`);

    console.log("Monochrome PDF downloaded successfully");
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
    return "border rounded-xl px-4 py-3 text-center";
  };

  // =====================================================
  // REPORT UI
  // =====================================================

  return (
    <div className="min-h-screen">

      {/* =================================================
          TOP NAVIGATION
      ================================================= */}

      <div data-pdf-hide="true" className="sticky top-0 z-50 shadow-lg">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>

            <h1 className="text-xl font-bold">
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
              className="px-4 py-2 rounded-lg border hover: text-sm"
            >
              ← Back
            </button>

            <button
              data-pdf-hide="true"
              onClick={downloadPDF}
              className="px-5 py-2 rounded-lg hover: text-sm font-semibold shadow"
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
        className="max-w-6xl mx-auto my-8 shadow-xl"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="px-10 py-8 border-b">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm font-semibold uppercase tracking-wider">
                Digital Forensic Report
              </p>

              <h2 className="text-3xl font-bold mt-2">
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

          <h3 className="text-xl font-bold mb-5">
            Executive Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="border rounded-xl p-5">

              <p className="text-sm">
                Threat Score
              </p>

              <p className="text-3xl font-bold mt-2">
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

              <p className="text-3xl font-bold mt-2">
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

              <p className="text-3xl font-bold mt-2">
                {email?.urls?.length || 0}
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            EMAIL INFORMATION
        ================================================= */}

        <section className="px-10 pb-10">

          <h3 className="text-xl font-bold mb-5">
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

          <h3 className="text-xl font-bold mb-5">
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

          <h3 className="text-xl font-bold mb-5">
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

          <h3 className="text-xl font-bold mb-5">
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

          <h3 className="text-xl font-bold mb-5">
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

          <h3 className="text-xl font-bold mb-5">
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

          <h3 className="text-xl font-bold mb-5">
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
                              ? " "
                              : " "
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
                                  ? " "
                                  : " "
                              }`}
                            >

                              <div className="flex justify-between items-center">

                                <span className="font-semibold">
                                  Anonymized Connection
                                </span>

                                <span
                                  className={`text-sm font-bold ${
                                    anon?.is_anonymized
                                      ? ""
                                      : ""
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

          <h3 className="text-xl font-bold mb-5">
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

          <h3 className="text-xl font-bold mb-5">
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

        <div className="border-t px-10 py-6">

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
              ? " "
              : " "
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
          ? " "
          : " "
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
          ? ""
          : ""
      }`}
    >
      {value
        ? "YES"
        : "NO"}
    </span>

  </div>

);


export default Forensicreport;