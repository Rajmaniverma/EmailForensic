import React, { useEffect, useState } from "react";

const SocialPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSocial = async () => {
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

        // Check token
        if (!token) {
          setError("Authentication token is missing");
          setLoading(false);
          return;
        }

        console.log("Message ID:", messageId);

        const response = await fetch(
          `https://emailforensic.onrender.com/gmail/Social/${encodeURIComponent(
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

        console.log("Status:", response.status);
        console.log("Social Data:", result);

        // Backend error
        if (!response.ok) {
          throw new Error(
            result?.detail || "Failed to fetch social engineering analysis"
          );
        }

        setData(result);
      } catch (error) {
        console.error("Social Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSocial();
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
      <h1>Social Engineering Detection</h1>

      <h2>Prediction</h2>
      <p>{data.prediction}</p>

      <h2>Score</h2>
      <p>{data.score}%</p>

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

export default SocialPage;