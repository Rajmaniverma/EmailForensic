import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://emailforensic.onrender.com";

function Login() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ============================================
  // CHECK IF USER IS ALREADY LOGGED IN
  // ============================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setCheckingAuth(false);
          return;
        }

        const response = await fetch(`${API_URL}/auth/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to check authentication");
        }

        const data = await response.json();

        console.log("Auth status:", data);

        if (data.authenticated === true) {
          navigate("/dashboard", { replace: true });
          return;
        }

        // Invalid token
        localStorage.removeItem("access_token");
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // ============================================
  // GOOGLE LOGIN
  // ============================================
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/login`;
  };

  // ============================================
  // LOADING SCREEN
  // ============================================
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

          <p className="text-sm text-slate-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* =====================================================
          BACKGROUND IMAGE
          image.png must be inside public/
          
          Example:
          public/
            image.png
      ====================================================== */}

      <div className="absolute inset-0">

        <img
          src="/image.png"
          alt="MailGuard Gmail interface"
          className="
            h-full
            w-full
            object-cover
            scale-105
            blur-[6px]
          "
        />

      </div>


      {/* =====================================================
          DARK / GLASS OVERLAY
      ====================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-slate-950/45
          backdrop-blur-[2px]
        "
      />


      {/* =====================================================
          LOGIN CARD CENTER
      ====================================================== */}

      <div
        className="
          relative
          z-10
          flex
          min-h-screen
          items-center
          justify-center
          px-4
          py-8
        "
      >

        <div
          className="
            w-full
            max-w-[430px]
            rounded-3xl
            border
            border-white/60
            bg-white/95
            p-8
            shadow-2xl
            backdrop-blur-xl

            sm:p-10
          "
        >

          {/* ===============================================
              MAILGUARD ICON
          =============================================== */}

          <div className="flex justify-center">

            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-emerald-50
                to-teal-100
                text-3xl
                shadow-sm
              "
            >
              🛡️
            </div>

          </div>


          {/* ===============================================
              TITLE
          =============================================== */}

          <div className="mt-5 text-center">

            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-slate-900
                sm:text-3xl
              "
            >
              Welcome to MailGuard
            </h1>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
            >
              Sign in to analyze and secure your emails
            </p>

          </div>


          {/* ===============================================
              GOOGLE LOGIN
          =============================================== */}

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="
              mt-7
              flex
              h-12
              w-full
              items-center
              justify-center
              gap-3
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              text-sm
              font-semibold
              text-slate-800
              shadow-sm

              transition
              duration-200

              hover:border-slate-400
              hover:bg-slate-50
              hover:shadow-md

              active:scale-[0.99]

              focus:outline-none
              focus:ring-2
              focus:ring-emerald-500/40
            "
          >

            {/* Google G */}
            <span
              className="
                text-xl
                font-bold
                text-blue-500
              "
            >
              G
            </span>

            <span>
              Continue with Google
            </span>

          </button>


          {/* ===============================================
              DIVIDER
          =============================================== */}

          <div className="my-7 flex items-center gap-3">

            <div className="h-px flex-1 bg-slate-200" />

            <span
              className="
                text-[10px]
                font-bold
                tracking-[0.18em]
                text-slate-400
              "
            >
              SECURE LOGIN
            </span>

            <div className="h-px flex-1 bg-slate-200" />

          </div>


          {/* ===============================================
              PRIVACY TEXT
          =============================================== */}

          <p
            className="
              px-2
              text-center
              text-xs
              leading-5
              text-slate-500
            "
          >
            By continuing, you allow MailGuard to securely
            access your Gmail account for email analysis.
          </p>


          {/* ===============================================
              SECURITY MESSAGE
          =============================================== */}

          <div
            className="
              mt-5
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-emerald-100
              bg-emerald-50
              px-4
              py-3
              text-xs
              font-semibold
              text-emerald-700
            "
          >

            <span className="text-sm">
              🔒
            </span>

            <span>
              Your connection is secure
            </span>

          </div>


          {/* ===============================================
              OPTIONAL BRAND FOOTER
          =============================================== */}

          <div className="mt-6 text-center">

            <p className="text-[11px] text-slate-400">
              MailGuard • Email Security & Forensics
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;