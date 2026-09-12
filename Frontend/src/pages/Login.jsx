import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = import.meta.env.VITE_API_URL;
console.log(API_URL)
function Login() {
  const navigate = useNavigate();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/status`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to check authentication");
        }

        const data = await response.json();
        console.log(data)

        console.log("Auth status:", data);

        if (data.authenticated === true) {
          // User is already logged in
          navigate("/dashboard", { replace: true });
          return;

        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/login`;
  };

  // While checking /auth/status
  if (checkingAuth) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">

        {/* Left Section */}
        <div className="login-left">

          <div className="brand">
            <div className="brand-icon">🛡️</div>
            <h1>MailGuard</h1>
          </div>

          <div className="hero-content">

            <h2>
              Protect your inbox
              <br />
              <span>from digital threats.</span>
            </h2>

            <p>
              Analyze emails, detect phishing attacks, trace IP addresses,
              and keep your Gmail account secure.
            </p>

            <div className="security-features">

              <div className="feature">
                <span>✓</span>
                <p>Phishing Detection</p>
              </div>

              <div className="feature">
                <span>✓</span>
                <p>Email Analysis</p>
              </div>

              <div className="feature">
                <span>✓</span>
                <p>IP Address Tracing</p>
              </div>

            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="login-right">

          <div className="login-card">

            <div className="login-icon">
              🛡
            </div>

            <h2>Welcome to MailGuard</h2>

            <p className="login-subtitle">
              Sign in to analyze and secure your emails
            </p>

            <button
              className="google-login-btn"
              onClick={handleGoogleLogin}
            >
              <span className="google-icon">G</span>
              <span>Continue with Google</span>
            </button>

            <div className="divider">
              <span>SECURE LOGIN</span>
            </div>

            <p className="privacy-text">
              By continuing, you allow MailGuard to securely access
              your Gmail account for email analysis.
            </p>

            <div className="security-note">
              <span>🔒</span>
              <span>Your connection is secure</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;