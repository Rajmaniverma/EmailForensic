import React, { useEffect, useState } from "react";

const PhishingPage = () => {

  const [data, setData] = useState(null);

  useEffect(() => {

    const fetchPhishing = async () => {

      const token = localStorage.getItem("access_token");

      const params = new URLSearchParams(window.location.search);
      const messageId = params.get("message_id");

      const response = await fetch(
        `https://emailforensic.onrender.com/gmail/Phising/${messageId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      console.log("Phishing Data:", result);

      setData(result);

    };

    fetchPhishing();

  }, []);

  return (
    <div>

      <h1>Phishing Detection</h1>

      <h2>Phishing Score</h2>
      <p>{data?.phishing_score}%</p>

      <h2>Legitimate Score</h2>
      <p>{data?.legitimate_score}%</p>

      <h2>Prediction</h2>
      <p>{data?.prediction}</p>

      <h2>Explanation</h2>
      <p>{data?.explanation}</p>

      <h2>Features</h2>

      <pre>
        {JSON.stringify(data?.features, null, 2)}
      </pre>

      <h2>AI Analysis</h2>

      <pre>
        {JSON.stringify(data?.ai_analysis, null, 2)}
      </pre>

    </div>
  );
};

export default PhishingPage;