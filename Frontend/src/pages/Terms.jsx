import React from "react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-emerald-100
                text-xl
              "
            >
              🛡️
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                MailGuard
              </h1>

              <p className="text-xs text-slate-500">
                Email Security & Forensics
              </p>
            </div>

          </div>

          <a
            href="/"
            className="
              rounded-lg
              px-4
              py-2
              text-sm
              font-medium
              text-slate-600
              transition
              hover:bg-slate-100
              hover:text-slate-900
            "
          >
            ← Back to MailGuard
          </a>

        </div>
      </header>


      {/* ================= HERO ================= */}
      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-4xl px-6 py-14 text-center">

          <div
            className="
              mx-auto
              mb-5
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-emerald-100
              text-3xl
            "
          >
            📜
          </div>

          <h2
            className="
              text-3xl
              font-bold
              tracking-tight
              text-slate-900
              sm:text-4xl
            "
          >
            Terms of Service
          </h2>

          <p
            className="
              mx-auto
              mt-4
              max-w-2xl
              text-sm
              leading-6
              text-slate-500
            "
          >
            These Terms of Service explain the rules and conditions
            governing your use of the MailGuard email security and
            forensic analysis application.
          </p>

          <p className="mt-4 text-xs text-slate-400">
            Last updated: September 13, 2026
          </p>

        </div>

      </section>


      {/* ================= CONTENT ================= */}
      <main className="mx-auto max-w-4xl px-6 py-10">


        {/* INTRODUCTION */}
        <div
          className="
            mb-8
            rounded-2xl
            border
            border-emerald-100
            bg-emerald-50
            p-6
          "
        >

          <div className="flex gap-4">

            <div className="text-2xl">
              🛡️
            </div>

            <div>

              <h3 className="font-semibold text-emerald-900">
                Welcome to MailGuard
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-emerald-800
                "
              >
                By accessing or using MailGuard, you agree to comply
                with these Terms of Service. If you do not agree with
                these terms, please do not use the application.
              </p>

            </div>

          </div>

        </div>


        {/* ================= 01 ================= */}
        <TermsSection
          number="01"
          title="Acceptance of Terms"
        >

          <p>
            By accessing, connecting to, or using MailGuard, you
            acknowledge that you have read, understood, and agreed
            to these Terms of Service.
          </p>

          <p>
            These terms apply to all users who access or use the
            MailGuard application.
          </p>

        </TermsSection>


        {/* ================= 02 ================= */}
        <TermsSection
          number="02"
          title="Description of the Service"
        >

          <p>
            MailGuard is an email security and forensic analysis
            application designed to help users investigate potentially
            suspicious emails.
          </p>

          <p>
            Depending on the features available, MailGuard may provide
            functionality including:
          </p>

          <ul>

            <ListItem>
              Email forensic analysis
            </ListItem>

            <ListItem>
              Phishing detection
            </ListItem>

            <ListItem>
              Social engineering analysis
            </ListItem>

            <ListItem>
              Email header analysis
            </ListItem>

            <ListItem>
              IP address analysis and tracing
            </ListItem>

            <ListItem>
              Suspicious URL and attachment analysis
            </ListItem>

          </ul>

        </TermsSection>


        {/* ================= 03 ================= */}
        <TermsSection
          number="03"
          title="Google Account and Gmail Access"
        >

          <p>
            MailGuard may use Google's OAuth authorization system to
            connect to your Google account and access Gmail information
            required to provide the application's functionality.
          </p>

          <p>
            You are responsible for reviewing the permissions requested
            during Google's authorization process before granting
            MailGuard access.
          </p>

          <p>
            You may revoke MailGuard's access to your Google account
            through your Google Account settings at any time.
          </p>

        </TermsSection>


        {/* ================= 04 ================= */}
        <TermsSection
          number="04"
          title="User Responsibilities"
        >

          <p>
            You agree to use MailGuard only for lawful purposes and
            in accordance with these Terms.
          </p>

          <p>
            You are responsible for:
          </p>

          <ul>

            <ListItem>
              Maintaining the security of your Google account
            </ListItem>

            <ListItem>
              Providing accurate information when required
            </ListItem>

            <ListItem>
              Using the service only with accounts and emails that
              you are authorized to access
            </ListItem>

            <ListItem>
              Complying with applicable laws and regulations
            </ListItem>

          </ul>

        </TermsSection>


        {/* ================= 05 ================= */}
        <TermsSection
          number="05"
          title="Prohibited Activities"
        >

          <p>
            You must not use MailGuard to:
          </p>

          <ul>

            <ListItem>
              Access another person's email without authorization
            </ListItem>

            <ListItem>
              Conduct illegal surveillance or unauthorized monitoring
            </ListItem>

            <ListItem>
              Attempt to compromise or bypass the security of
              MailGuard or third-party systems
            </ListItem>

            <ListItem>
              Distribute malware or other malicious software
            </ListItem>

            <ListItem>
              Abuse, overload, or disrupt the MailGuard service
            </ListItem>

            <ListItem>
              Use the service for unlawful or fraudulent activities
            </ListItem>

          </ul>

        </TermsSection>


        {/* ================= 06 ================= */}
        <TermsSection
          number="06"
          title="Email Analysis Results"
        >

          <div
            className="
              rounded-xl
              border
              border-amber-200
              bg-amber-50
              p-5
            "
          >

            <div className="flex gap-3">

              <span className="text-xl">
                ⚠️
              </span>

              <div>

                <h4 className="font-semibold text-amber-900">
                  Security analysis is advisory
                </h4>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-amber-800
                  "
                >
                  MailGuard's analysis results are intended to assist
                  users in identifying potential security threats.
                  Results may not always be accurate and should not be
                  considered a guarantee that an email is safe or
                  malicious.
                </p>

              </div>

            </div>

          </div>

          <p>
            You should independently verify important security
            decisions and avoid relying solely on an automated
            analysis result.
          </p>

        </TermsSection>


        {/* ================= 07 ================= */}
        <TermsSection
          number="07"
          title="Availability of the Service"
        >

          <p>
            We aim to keep MailGuard available and functional, but
            we do not guarantee that the service will always be
            available, uninterrupted, or error-free.
          </p>

          <p>
            The service may occasionally be unavailable because of
            maintenance, technical problems, third-party service
            outages, or other circumstances beyond our control.
          </p>

        </TermsSection>


        {/* ================= 08 ================= */}
        <TermsSection
          number="08"
          title="Third-Party Services"
        >

          <p>
            MailGuard may depend on third-party services and
            infrastructure, including Google APIs, cloud hosting,
            databases, and other technical services.
          </p>

          <p>
            Your use of third-party services may also be subject to
            the terms and policies of those providers.
          </p>

        </TermsSection>


        {/* ================= 09 ================= */}
        <TermsSection
          number="09"
          title="Privacy"
        >

          <p>
            Your use of MailGuard is also subject to our Privacy
            Policy, which explains how information is collected,
            accessed, processed, stored, and deleted.
          </p>

          <div className="mt-4">

            <a
              href="/privacy-policy"
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-emerald-600
                px-4
                py-2
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-emerald-700
              "
            >
              🔐 View Privacy Policy
            </a>

          </div>

        </TermsSection>


        {/* ================= 10 ================= */}
        <TermsSection
          number="10"
          title="Intellectual Property"
        >

          <p>
            Unless otherwise stated, the MailGuard application,
            interface, branding, design, software, and related
            materials are owned by or licensed to MailGuard.
          </p>

          <p>
            You may not copy, modify, distribute, reverse engineer,
            or commercially exploit MailGuard's proprietary materials
            without appropriate authorization.
          </p>

        </TermsSection>


        {/* ================= 11 ================= */}
        <TermsSection
          number="11"
          title="Account Suspension or Termination"
        >

          <p>
            We may suspend or terminate access to MailGuard if we
            reasonably believe that a user has violated these Terms,
            misused the service, or engaged in activity that may
            harm the service or other users.
          </p>

          <p>
            You may stop using MailGuard at any time and revoke its
            Google account permissions.
          </p>

        </TermsSection>


        {/* ================= 12 ================= */}
        <TermsSection
          number="12"
          title="Disclaimer"
        >

          <p>
            MailGuard is provided on an "as available" basis.
          </p>

          <p>
            We do not guarantee that every phishing attempt, malicious
            email, suspicious IP address, malicious link, or other
            security threat will be detected.
          </p>

          <p>
            Automated security analysis can produce false positives
            and false negatives.
          </p>

        </TermsSection>


        {/* ================= 13 ================= */}
        <TermsSection
          number="13"
          title="Limitation of Liability"
        >

          <p>
            To the extent permitted by applicable law, MailGuard and
            its operators shall not be liable for losses or damages
            resulting from reliance on automated email security
            analysis, service interruptions, third-party services,
            unauthorized access caused by the user's failure to
            secure their account, or other circumstances outside
            our reasonable control.
          </p>

        </TermsSection>


        {/* ================= 14 ================= */}
        <TermsSection
          number="14"
          title="Changes to These Terms"
        >

          <p>
            We may update these Terms of Service from time to time.
            Updated terms will be published on this page along with
            the date of the latest revision.
          </p>

          <p>
            Continued use of MailGuard after changes are published
            constitutes acceptance of the updated terms, to the
            extent permitted by applicable law.
          </p>

        </TermsSection>


        {/* ================= 15 ================= */}
        <TermsSection
          number="15"
          title="Contact Us"
        >

          <p>
            If you have questions regarding these Terms of Service,
            please contact the MailGuard team.
          </p>

          <div
            className="
              mt-5
              rounded-xl
              bg-slate-50
              p-5
            "
          >

            <p className="text-sm">

              <span className="font-semibold text-slate-700">
                Email:
              </span>{" "}

              <a
                href="mailto:your-email@example.com"
                className="
                  text-emerald-600
                  hover:underline
                "
              >
                your-email@example.com
              </a>

            </p>

          </div>

        </TermsSection>


        {/* ================= FOOTER ================= */}
        <footer className="py-10 text-center">

          <div
            className="
              flex
              flex-wrap
              items-center
              justify-center
              gap-5
              text-sm
            "
          >

            <a
              href="/"
              className="text-slate-500 hover:text-emerald-600"
            >
              Home
            </a>

            <span className="text-slate-300">
              •
            </span>

            <a
              href="/privacy-policy"
              className="text-slate-500 hover:text-emerald-600"
            >
              Privacy Policy
            </a>

            <span className="text-slate-300">
              •
            </span>

            <a
              href="/terms"
              className="font-medium text-emerald-600"
            >
              Terms of Service
            </a>

          </div>

          <p className="mt-4 text-xs text-slate-400">
            © 2026 MailGuard. All rights reserved.
          </p>

        </footer>

      </main>

    </div>
  );
};


/* =========================================================
   SECTION COMPONENT
========================================================= */

function TermsSection({ number, title, children }) {
  return (
    <section
      className="
        mb-8
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-7
        shadow-sm
      "
    >

      <div className="mb-5 flex items-center gap-4">

        <span
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-emerald-100
            text-xs
            font-bold
            text-emerald-700
          "
        >
          {number}
        </span>

        <h3
          className="
            text-xl
            font-bold
            text-slate-900
          "
        >
          {title}
        </h3>

      </div>

      <div
        className="
          space-y-4
          text-sm
          leading-7
          text-slate-600
        "
      >
        {children}
      </div>

    </section>
  );
}


/* =========================================================
   LIST ITEM
========================================================= */

function ListItem({ children }) {
  return (
    <li className="flex items-start gap-3">

      <span
        className="
          mt-1
          text-emerald-600
        "
      >
        ✓
      </span>

      <span>
        {children}
      </span>

    </li>
  );
}


export default Terms;