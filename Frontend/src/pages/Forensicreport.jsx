import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const API_URL = "https://emailforensic.onrender.com";

// =========================================================
// PDF CSS SANITIZER
// Converts modern CSS colors such as oklch()/oklab()
// into browser-computed RGB values inside html2canvas's
// cloned document only.
// =========================================================

const hasUnsupportedColorFunction = (value) => {
  if (!value) return false;

  return (
    value.includes("oklch(") ||
    value.includes("oklab(")
  );
};

const convertCssValue = (
  clonedDocument,
  property,
  value
) => {
  if (!hasUnsupportedColorFunction(value)) {
    return value;
  }

  try {
    const probe =
      clonedDocument.createElement("div");

    probe.style.setProperty(
      property,
      value
    );

    clonedDocument.body.appendChild(probe);

    const computed =
      clonedDocument.defaultView
        ?.getComputedStyle(probe)
        ?.getPropertyValue(property);

    probe.remove();

    if (
      computed &&
      !hasUnsupportedColorFunction(computed)
    ) {
      return computed;
    }
  } catch (error) {
    console.warn(
      `Could not convert CSS property ${property}:`,
      error
    );
  }

  return null;
};

const sanitizeCssRules = (
  clonedDocument,
  rules
) => {
  if (!rules) return;

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    try {
      // Normal CSS rules, keyframes, etc.
      if (rule.style) {
        for (
          let j = 0;
          j < rule.style.length;
          j++
        ) {
          const property =
            rule.style[j];

          const value =
            rule.style.getPropertyValue(
              property
            );

          if (
            hasUnsupportedColorFunction(value)
          ) {
            const converted =
              convertCssValue(
                clonedDocument,
                property,
                value
              );

            if (converted) {
              rule.style.setProperty(
                property,
                converted,
                rule.style.getPropertyPriority(
                  property
                )
              );
            } else {
              // Last-resort fallback.
              // This prevents html2canvas from
              // seeing oklch/oklab.
              rule.style.setProperty(
                property,
                value
                  .replace(
                    /oklch\([^)]*\)/gi,
                    "rgb(0, 0, 0)"
                  )
                  .replace(
                    /oklab\([^)]*\)/gi,
                    "rgb(0, 0, 0)"
                  )
              );
            }
          }
        }
      }

      // Media queries, supports queries, layers, etc.
      if (rule.cssRules) {
        sanitizeCssRules(
          clonedDocument,
          rule.cssRules
        );
      }
    } catch (error) {
      console.warn(
        "Could not sanitize CSS rule:",
        error
      );
    }
  }
};

const sanitizeClonedDocumentForPDF = (
  clonedDocument
) => {
  // -------------------------------------------------------
  // 1. Convert colors in <style> / stylesheet rules
  // -------------------------------------------------------

  for (
    const stylesheet of clonedDocument.styleSheets
  ) {
    try {
      if (stylesheet.cssRules) {
        sanitizeCssRules(
          clonedDocument,
          stylesheet.cssRules
        );
      }
    } catch (error) {
      // Cross-origin stylesheets can throw a
      // SecurityError when cssRules is accessed.
      console.warn(
        "Skipping inaccessible stylesheet:",
        error
      );
    }
  }

  // -------------------------------------------------------
  // 2. Sanitize inline styles
  // -------------------------------------------------------

  const allElements =
    clonedDocument.querySelectorAll("*");

  allElements.forEach((element) => {
    const style = element.style;

    if (!style) return;

    for (
      let i = style.length - 1;
      i >= 0;
      i--
    ) {
      const property = style[i];

      const value =
        style.getPropertyValue(property);

      if (
        hasUnsupportedColorFunction(value)
      ) {
        const converted =
          convertCssValue(
            clonedDocument,
            property,
            value
          );

        if (converted) {
          style.setProperty(
            property,
            converted,
            style.getPropertyPriority(
              property
            )
          );
        } else {
          style.setProperty(
            property,
            value
              .replace(
                /oklch\([^)]*\)/gi,
                "rgb(0, 0, 0)"
              )
              .replace(
                /oklab\([^)]*\)/gi,
                "rgb(0, 0, 0)"
              )
          );
        }
      }
    }
  });

  // -------------------------------------------------------
  // 3. Sanitize CSS custom properties
  // -------------------------------------------------------

  allElements.forEach((element) => {
    const style =
      element.style;

    if (!style) return;

    for (
      let i = 0;
      i < style.length;
      i++
    ) {
      const property = style[i];

      if (!property.startsWith("--")) {
        continue;
      }

      const value =
        style.getPropertyValue(property);

      if (
        hasUnsupportedColorFunction(value)
      ) {
        const converted =
          convertCssValue(
            clonedDocument,
            property,
            value
          );

        if (converted) {
          style.setProperty(
            property,
            converted
          );
        }
      }
    }
  });
};


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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">

        <div className="text-center">

          <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-5"></div>

          <h2 className="text-xl font-semibold">
            Loading Forensic Report
          </h2>

          <p className="text-sm text-slate-400 mt-2">
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">

        <div className="text-center max-w-md">

          <div className="text-5xl mb-5">
            ⚠️
          </div>

          <h2 className="text-2xl font-semibold mb-3">
            Forensic Report Unavailable
          </h2>

          <p className="text-slate-400 mb-6">
            {error ||
              "No forensic analysis was found."}
          </p>

          <div className="flex justify-center gap-3">

            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded-lg border border-slate-600 hover:bg-slate-800"
            >
              ← Back
            </button>

            <button
              onClick={() =>
                navigate("/dashboard")
              }
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
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
    console.log("Starting PDF generation...");

    // Make sure fonts/layout have finished before capture.
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(
      element,
      {
        scale: Math.min(
          window.devicePixelRatio || 1,
          1.5
        ),

        useCORS: true,
        allowTaint: false,

        backgroundColor: "#ffffff",

        logging: false,

        imageTimeout: 15000,

        // Keep the capture dimensions equal to
        // the actual report element.
        width: element.scrollWidth,
        height: element.scrollHeight,

        windowWidth:
          element.scrollWidth,

        windowHeight:
          element.scrollHeight,

        onclone: (clonedDocument) => {
          console.log(
            "Sanitizing cloned document for PDF..."
          );

          // IMPORTANT:
          // Do NOT remove Tailwind stylesheets.
          // html2canvas needs them for layout.
          //
          // Instead, convert oklch()/oklab()
          // declarations to computed RGB values.
          sanitizeClonedDocumentForPDF(
            clonedDocument
          );

          const clonedReport =
            clonedDocument.querySelector(
              "#forensic-report"
            );

          if (!clonedReport) {
            console.warn(
              "Forensic report was not found in clone."
            );
            return;
          }

          // Remove only things that should not appear
          // in the PDF.
          const pdfHiddenElements =
            clonedReport.querySelectorAll(
              "[data-pdf-hide='true']"
            );

          pdfHiddenElements.forEach(
            (item) => item.remove()
          );

          // Make sure the report has a white background.
          clonedReport.style.background =
            "#ffffff";

          clonedReport.style.color =
            "#0f172a";

          console.log(
            "PDF clone sanitized successfully."
          );
        },
      }
    );

    console.log(
      "Canvas created:",
      canvas.width,
      canvas.height
    );

    // ---------------------------------------------------
    // Canvas -> JPEG
    // ---------------------------------------------------

    const imgData =
      canvas.toDataURL(
        "image/jpeg",
        0.92
      );

    // ---------------------------------------------------
    // Create PDF
    // ---------------------------------------------------

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth =
      pdf.internal.pageSize.getWidth();

    const pdfHeight =
      pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;

    const imgHeight =
      (canvas.height * pdfWidth) /
      canvas.width;

    let heightLeft = imgHeight;

    let position = 0;

    // ---------------------------------------------------
    // First page
    // ---------------------------------------------------

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

    // ---------------------------------------------------
    // Additional pages
    // ---------------------------------------------------

    while (heightLeft > 0) {
      position =
        heightLeft - imgHeight;

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

    // ---------------------------------------------------
    // Safe filename
    // ---------------------------------------------------

    const safeMessageId =
      String(messageId || "unknown")
        .replace(
          /[<>:"/\\|?*]/g,
          "_"
        )
        .replace(
          /\s+/g,
          "_"
        )
        .replace(
          /_+/g,
          "_"
        )
        .substring(0, 100);

    const fileName =
      `forensic-report-${safeMessageId}.pdf`;

    console.log(
      "Saving PDF:",
      fileName
    );

    pdf.save(fileName);

    console.log(
      "PDF downloaded successfully."
    );

  } catch (error) {
    console.error(
      "PDF generation failed:",
      error
    );

    alert(
      `Failed to generate PDF: ${
        error?.message ||
        "Unknown error"
      }`
    );
  }
};


  // =====================================================
  // RISK COLOR
  // =====================================================

  const getRiskClass = () => {

    switch (
      riskLevel.toLowerCase()
    ) {

      case "high":
      case "critical":
        return (
          "bg-red-100 text-red-700 border-red-200"
        );

      case "medium":
        return (
          "bg-yellow-100 text-yellow-700 border-yellow-200"
        );

      case "low":
        return (
          "bg-green-100 text-green-700 border-green-200"
        );

      default:
        return (
          "bg-gray-100 text-gray-700 border-gray-200"
        );
    }
  };

  // =====================================================
  // REPORT UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* =================================================
          TOP NAVIGATION
      ================================================= */}

      <div className="sticky top-0 z-50 bg-slate-950 text-white shadow-lg">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>

            <h1 className="text-xl font-bold">
              MailGuard
            </h1>

            <p className="text-xs text-slate-400">
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
              onClick={downloadPDF}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold shadow"
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
        className="max-w-6xl mx-auto bg-white my-8 shadow-xl"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="px-10 py-8 border-b border-slate-200">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                Digital Forensic Report
              </p>

              <h2 className="text-3xl font-bold mt-2">
                Email Security & Forensic Analysis
              </h2>

              <p className="text-slate-500 mt-2">
                Automated analysis report generated by MailGuard
              </p>

              <p className="text-xs text-slate-400 mt-3 break-all">
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

              <p className="text-sm text-slate-500">
                Threat Score
              </p>

              <p className="text-3xl font-bold text-red-600 mt-2">
                {threatScore}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                / 100
              </p>

            </div>


            <div className="border rounded-xl p-5">

              <p className="text-sm text-slate-500">
                Safety Score
              </p>

              <p className="text-3xl font-bold text-green-600 mt-2">
                {safeScore}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                / 100
              </p>

            </div>


            <div className="border rounded-xl p-5">

              <p className="text-sm text-slate-500">
                URLs Detected
              </p>

              <p className="text-3xl font-bold text-blue-600 mt-2">
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

          <div className="border rounded-xl p-6 bg-slate-50">

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
                        className="text-sm bg-white border rounded-lg p-3"
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

          <div className="border rounded-xl p-6 bg-slate-50">

            <pre className="whitespace-pre-wrap text-sm text-slate-700">
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

          <div className="border rounded-xl p-6 bg-slate-50">

            <pre className="whitespace-pre-wrap text-sm text-slate-700">
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

                    <p className="text-xs text-slate-500">
                      URL {index + 1}
                    </p>

                    <p className="text-sm text-blue-600 break-all mt-1">
                      {url}
                    </p>

                  </div>

                )
              )

            ) : (

              <div className="p-5 text-slate-500">
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

                      <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">

                        <div>

                          <p className="text-xs text-slate-400">
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
                              ? "bg-green-500/20 text-green-300"
                              : "bg-red-500/20 text-red-300"
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

                            <div className="mt-3 p-4 bg-slate-50 border rounded-lg">

                              <p className="text-xs uppercase text-slate-400">
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
                                  ? "bg-red-50 border-red-200"
                                  : "bg-green-50 border-green-200"
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

            <div className="border rounded-xl p-6 text-slate-500">
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

                  <p className="text-xs text-slate-500 capitalize">
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

          <div className="border rounded-xl bg-slate-50 p-6">

            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-7">
              {email?.body ||
                "Email body unavailable"}
            </pre>

          </div>

        </section>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="border-t px-10 py-6 bg-slate-50">

          <div className="flex justify-between text-xs text-slate-500">

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

    <p className="text-xs uppercase tracking-wide text-slate-400">
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

      <pre className="mt-4 text-xs text-slate-500 whitespace-pre-wrap break-all">
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

  <div className="bg-white border rounded-lg p-4 flex justify-between items-center">

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