import React, { useEffect, useState } from "react";

const API_URL = "https://emailforensic.onrender.com";

const PhishingPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPhishing = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const params = new URLSearchParams(window.location.search);
        const messageId = params.get("message_id");

        // Check message ID
        if (!messageId) {
          setError("Message ID is missing");
          setLoading(false);
          return;
        }

        // Check login token
        if (!token) {
          setError("Authentication token is missing");
          setLoading(false);
          return;
        }

        console.log("Message ID:", messageId);

        // IMPORTANT:
        // Use the unified analysis endpoint.
        // Backend checks cache first.
        const response = await fetch(
          `${API_URL}/gmail/full-analysis/${encodeURIComponent(messageId)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        console.log("Status:", response.status);
        console.log("Full Analysis:", result);

        // Backend error
        if (!response.ok) {
          throw new Error(
            result?.detail || "Failed to fetch email analysis"
          );
        }

        if (!result.success || !result.data) {
          throw new Error("Analysis data not found");
        }

        // -----------------------------------------
        // Extract phishing result from unified cache
        // -----------------------------------------
        const phishingData = result.data.phishing;

        if (!phishingData) {
          throw new Error("Phishing analysis is not available");
        }

        console.log("Phishing Data:", phishingData);

        setData(phishingData);

      } catch (error) {
        console.error("Phishing Error:", error);
        setError(error.message || "Failed to load phishing analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchPhishing();
  }, []);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafd]">
        <div className="text-center">
          <div className="text-xl font-semibold text-[#202124]">
            Loading Phishing Analysis...
          </div>

          <p className="mt-2 text-sm text-[#5f6368]">
            Checking cached email analysis
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafd]">
        <div className="p-6 rounded-xl bg-white border border-[#e5e7eb] shadow-sm">
          <h1 className="text-xl font-semibold text-[#c5221f]">
            Error
          </h1>

          <p className="mt-2 text-sm text-[#5f6368]">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // No data
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafd]">
        <h1 className="text-xl font-semibold text-[#202124]">
          No phishing analysis found
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafd] p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#202124]">
            Phishing Detection
          </h1>

          <p className="mt-1 text-sm text-[#5f6368]">
            Detailed phishing analysis for this email
          </p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* Phishing Score */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm">
            <p className="text-sm text-[#5f6368]">
              Phishing Score
            </p>

            <p className="mt-2 text-3xl font-bold text-[#c5221f]">
              {data.phishing_score ?? 0}%
            </p>
          </div>

          {/* Legitimate Score */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm">
            <p className="text-sm text-[#5f6368]">
              Legitimate Score
            </p>

            <p className="mt-2 text-3xl font-bold text-[#1e7e5a]">
              {data.legitimate_score ?? 0}%
            </p>
          </div>

        </div>

        {/* Prediction */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-[#202124]">
            Prediction
          </h2>

          <p className="mt-3 text-lg font-medium text-[#1a73e8]">
            {data.prediction || "Unknown"}
          </p>
        </div>

        {/* Explanation */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-[#202124]">
            Explanation
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#5f6368]">
            {data.explanation || "No explanation available."}
          </p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-[#202124]">
            Detection Features
          </h2>

          <pre className="mt-4 p-4 rounded-lg bg-[#f8f9fa] border border-[#e5e7eb] overflow-auto text-xs leading-5 text-[#202124]">
            {JSON.stringify(data.features || {}, null, 2)}
          </pre>
        </div>

        {/* AI Analysis */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#202124]">
            AI Analysis
          </h2>

          <pre className="mt-4 p-4 rounded-lg bg-[#f8f9fa] border border-[#e5e7eb] overflow-auto text-xs leading-5 text-[#202124]">
            {JSON.stringify(data.ai_analysis || {}, null, 2)}
          </pre>
        </div>

      </div>
    </div>
  );
};

export default PhishingPage;