import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl">
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
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            ← Back to MailGuard
          </a>

        </div>
      </header>


      {/* ================= HERO ================= */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
            🔐
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500">
            Your privacy and security are important to us. This Privacy
            Policy explains how MailGuard accesses, uses, stores, and
            protects information when you connect your Google account.
          </p>

          <p className="mt-4 text-xs text-slate-400">
            Last updated: September 13, 2026
          </p>

        </div>
      </section>


      {/* ================= CONTENT ================= */}
      <main className="mx-auto max-w-4xl px-6 py-10">

        {/* Intro */}
        <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

          <div className="flex gap-4">

            <div className="text-2xl">
              🛡️
            </div>

            <div>
              <h3 className="font-semibold text-emerald-900">
                Our commitment to your privacy
              </h3>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                MailGuard is designed to help users analyze potentially
                harmful emails and identify security threats. We only
                request access to information necessary to provide the
                features of the application.
              </p>
            </div>

          </div>

        </div>


        {/* ================= SECTION 1 ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="01"
            title="Information We Access"
          />

          <p className="text-sm leading-7 text-slate-600">
            When you connect your Google account to MailGuard, the
            application may access information from your Gmail account
            that is necessary to perform email security and forensic
            analysis.
          </p>

          <p className="mt-4 text-sm font-medium text-slate-700">
            Depending on the permissions granted, this may include:
          </p>

          <ul className="mt-3 space-y-2 text-sm text-slate-600">

            <ListItem>
              Gmail messages and message identifiers
            </ListItem>

            <ListItem>
              Email sender and recipient information
            </ListItem>

            <ListItem>
              Email subject and message content
            </ListItem>

            <ListItem>
              Email headers and routing information
            </ListItem>

            <ListItem>
              Links contained within emails
            </ListItem>

            <ListItem>
              Attachment metadata when required for analysis
            </ListItem>

          </ul>

        </section>


        {/* ================= SECTION 2 ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="02"
            title="How We Use Gmail Data"
          />

          <p className="text-sm leading-7 text-slate-600">
            MailGuard uses Gmail information only to provide the
            security and analysis functionality requested by the user.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <FeatureCard
              icon="🔍"
              title="Email Analysis"
              description="Analyze email content and metadata for security-related information."
            />

            <FeatureCard
              icon="🎣"
              title="Phishing Detection"
              description="Identify potential phishing indicators, suspicious links, and other warning signs."
            />

            <FeatureCard
              icon="👥"
              title="Social Engineering"
              description="Identify possible manipulation, impersonation, and social engineering techniques."
            />

            <FeatureCard
              icon="🌐"
              title="IP Analysis"
              description="Analyze available email routing information and originating IP addresses."
            />

          </div>

        </section>


        {/* ================= SECTION 3 ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="03"
            title="Google User Data"
          />

          <p className="text-sm leading-7 text-slate-600">
            MailGuard's use of information received from Google APIs
            complies with applicable Google API Services User Data
            Policy requirements, including the Limited Use requirements
            where applicable.
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">

            <div className="flex gap-3">

              <span className="text-xl">
                🔒
              </span>

              <div>
                <h4 className="font-semibold text-slate-800">
                  We do not sell your Gmail data
                </h4>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  MailGuard does not sell Google user data or use
                  Gmail data for advertising purposes.
                </p>
              </div>

            </div>

          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">

            <div className="flex gap-3">

              <span className="text-xl">
                🚫
              </span>

              <div>
                <h4 className="font-semibold text-slate-800">
                  No unrelated use
                </h4>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Gmail information is not used for purposes unrelated
                  to the security and email-analysis functionality
                  provided by MailGuard.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* ================= SECTION 4 ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="04"
            title="Data Storage"
          />

          <p className="text-sm leading-7 text-slate-600">
            MailGuard may temporarily process information received from
            Gmail through its backend services in order to perform the
            requested analysis.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            Authentication information is protected using appropriate
            security mechanisms. Access tokens are used to communicate
            with Google's APIs on behalf of the authenticated user.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            We retain information only for as long as reasonably
            necessary to provide the requested functionality and
            maintain the security of the service, subject to applicable
            legal and operational requirements.
          </p>

        </section>


        {/* ================= SECTION 5 ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="05"
            title="Data Sharing"
          />

          <p className="text-sm leading-7 text-slate-600">
            MailGuard does not sell or rent your personal information.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            Information may be processed by infrastructure or service
            providers that are necessary to operate MailGuard, such as
            hosting, database, authentication, and security-analysis
            infrastructure.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            Such processing is limited to what is necessary to provide
            and secure the application.
          </p>

        </section>


        {/* ================= SECTION 6 ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="06"
            title="Google Account Permissions"
          />

          <p className="text-sm leading-7 text-slate-600">
            You control whether MailGuard can access your Google
            account. Google displays the permissions requested by
            MailGuard during the OAuth authorization process.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            You can revoke MailGuard's access at any time through your
            Google Account security settings.
          </p>

        </section>


        {/* ================= SECTION 7 ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="07"
            title="Data Deletion"
          />

          <p className="text-sm leading-7 text-slate-600">
            You may request deletion of information associated with
            your MailGuard account by contacting us.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            You can also revoke MailGuard's access to your Google
            account through your Google Account settings.
          </p>

          <div className="mt-5 rounded-xl bg-slate-50 p-5">

            <p className="text-sm font-medium text-slate-700">
              Data deletion request
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Contact us at:
            </p>

            <a
              href="mailto:your-email@example.com"
              className="mt-1 inline-block text-sm font-semibold text-emerald-600 hover:underline"
            >
              your-email@example.com
            </a>

          </div>

        </section>


        {/* ================= SECTION 8 ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="08"
            title="Security"
          />

          <p className="text-sm leading-7 text-slate-600">
            We take reasonable technical and organizational measures
            to protect information processed by MailGuard against
            unauthorized access, alteration, disclosure, or destruction.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            However, no internet-based service can guarantee absolute
            security, and users should also take appropriate steps to
            protect their Google accounts.
          </p>

        </section>


        {/* ================= SECTION 9 ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="09"
            title="Children's Privacy"
          />

          <p className="text-sm leading-7 text-slate-600">
            MailGuard is not intended to knowingly collect personal
            information from children. If you believe that information
            belonging to a child has been provided to us, please contact
            us so that appropriate action can be taken.
          </p>

        </section>


        {/* ================= SECTION 10 ================= */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="10"
            title="Changes to This Policy"
          />

          <p className="text-sm leading-7 text-slate-600">
            We may update this Privacy Policy from time to time to
            reflect changes to MailGuard, applicable laws, or our data
            practices.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            When changes are made, the updated policy will be published
            on this page together with the updated date.
          </p>

        </section>


        {/* ================= SECTION 11 ================= */}
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <SectionTitle
            number="11"
            title="Contact Us"
          />

          <p className="text-sm leading-7 text-slate-600">
            If you have questions about this Privacy Policy, Gmail
            data, data deletion, or MailGuard's privacy practices,
            please contact us.
          </p>

          <div className="mt-5 flex flex-col gap-2">

            <p className="text-sm">
              <span className="font-semibold text-slate-700">
                Email:
              </span>{" "}
              <a
                href="mailto:your-email@example.com"
                className="text-emerald-600 hover:underline"
              >
                your-email@example.com
              </a>
            </p>

            <p className="text-sm">
              <span className="font-semibold text-slate-700">
                Application:
              </span>{" "}
              MailGuard
            </p>

          </div>

        </section>


        {/* ================= FOOTER ================= */}
        <footer className="py-10 text-center">

          <div className="flex items-center justify-center gap-5 text-sm">

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
              className="font-medium text-emerald-600"
            >
              Privacy Policy
            </a>

            <span className="text-slate-300">
              •
            </span>

            <a
              href="/terms"
              className="text-slate-500 hover:text-emerald-600"
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


/* =====================================================
   REUSABLE COMPONENTS
===================================================== */

function SectionTitle({ number, title }) {
  return (
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

      <h3 className="text-xl font-bold text-slate-900">
        {title}
      </h3>

    </div>
  );
}


function ListItem({ children }) {
  return (
    <li className="flex items-start gap-3">

      <span className="mt-1 text-emerald-600">
        ✓
      </span>

      <span>
        {children}
      </span>

    </li>
  );
}


function FeatureCard({ icon, title, description }) {
  return (
    <div
      className="
        rounded-xl
        border
        border-slate-200
        bg-slate-50
        p-5
        transition
        hover:border-emerald-200
        hover:bg-emerald-50/40
      "
    >

      <div className="mb-3 text-2xl">
        {icon}
      </div>

      <h4 className="font-semibold text-slate-800">
        {title}
      </h4>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}


export default PrivacyPolicy;