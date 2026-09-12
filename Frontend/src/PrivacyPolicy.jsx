import React from 'react'

const PrivacyPolicy = () => {
  return (
    <div>
        # Privacy Policy

**Last updated:** September 12, 2026

Email Forensic ("we", "our", or "the application") is an email security and forensic analysis application designed to help users identify phishing, suspicious content, and potential security threats in email messages.

## Information We Collect

When you connect your Google account, the application may access information necessary to provide its email analysis features, including:

* Your Google account email address and basic profile information.
* Gmail messages that you authorize the application to access.
* Email metadata such as sender, recipient, subject, and date.
* Information required to analyze email security indicators.

## Gmail API Usage

The application uses the Gmail API only after you explicitly authorize access through Google's OAuth authentication system.

The application requests read-only Gmail access and does not send, modify, or delete emails.

Gmail data is used to provide email security analysis, including phishing detection and email forensic analysis.

## Storage of Information

Authorized account information and required application data may be stored securely in our database.

OAuth credentials and tokens are stored securely and are not intentionally shared publicly.

We retain information only for as long as necessary to provide the application's features or as required for legitimate operational purposes.

## Third-Party Services

The application may use third-party services to provide security analysis and application functionality.

If email content is sent to a third-party analysis service, it is used only to perform the requested analysis.

We do not sell users' Gmail data or personal information.

## Data Security

We take reasonable technical and organizational measures to protect information from unauthorized access, disclosure, alteration, or destruction.

However, no Internet-based service can guarantee absolute security.

## Revoking Gmail Access

You can revoke the application's access to your Google account at any time through your Google Account security settings.

After access is revoked, the application will no longer be able to access your Gmail account through the previously authorized OAuth credentials.

## Data Deletion

Users may request deletion of information stored by the application by contacting us using the contact information provided on the application website.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Any changes will be published on this page with an updated "Last updated" date.

## Contact

For questions or requests regarding this Privacy Policy, please contact:

**Email Forensic Team**

Email: [YOUR CONTACT EMAIL]

    </div>
  )
}

export default PrivacyPolicy