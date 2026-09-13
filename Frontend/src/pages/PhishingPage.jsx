import React, { useEffect, useState } from "react";

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

        const response = await fetch(
          `https://emailforensic.onrender.com/gmail/Phising/${encodeURIComponent(
            messageId
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Get response
        const result = await response.json();

        console.log("Status:", response.status);
        console.log("Phishing Data:", result);

        // Backend error
        if (!response.ok) {
          throw new Error(
            result?.detail || "Failed to fetch phishing analysis"
          );
        }

        // Save data
        setData(result);
      } catch (error) {
        console.error("Phishing Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPhishing();
  }, []);

  // Loading
  if (loading) {
    return <h1>Loading...</h1>;
  }

  // Error
  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  // No data
  if (!data) {
    return <h1>No data found</h1>;
  }

  return (
    <div>
      <h1>Phishing Detection</h1>

      <h2>Phishing Score</h2>
      <p>{data.phishing_score}%</p>

      <h2>Legitimate Score</h2>
      <p>{data.legitimate_score}%</p>

      <h2>Prediction</h2>
      <p>{data.prediction}</p>

      <h2>Explanation</h2>
      <p>{data.explanation}</p>

      <h2>Features</h2>
      <pre>
        {JSON.stringify(data.features, null, 2)}
      </pre>

      <h2>AI Analysis</h2>
      <pre>
        {JSON.stringify(data.ai_analysis, null, 2)}
      </pre>
    </div>
  );
};

export default PhishingPage;