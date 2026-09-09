import re
from urllib.parse import urlparse


# =========================================================
# PHISHING KEYWORDS
# =========================================================

URGENT_WORDS = [
    "urgent",
    "immediately",
    "asap",
    "action required",
    "act now",
    "final warning",
    "verify now",
    "respond immediately"
]

CREDENTIAL_WORDS = [
    "password",
    "username",
    "login",
    "credential",
    "otp",
    "pin",
    "cvv",
    "bank account",
    "credit card"
]

THREAT_WORDS = [
    "suspended",
    "blocked",
    "terminated",
    "legal action",
    "penalty",
    "warning",
    "account will be closed"
]


# =========================================================
# SUSPICIOUS FILE EXTENSIONS
# =========================================================

SUSPICIOUS_EXTENSIONS = [
    ".exe",
    ".scr",
    ".bat",
    ".cmd",
    ".js",
    ".vbs",
    ".ps1",
    ".jar",
    ".msi"
]


# =========================================================
# SUSPICIOUS TLDs
# =========================================================

SUSPICIOUS_TLDS = [
    ".xyz",
    ".top",
    ".click",
    ".buzz",
    ".tk",
    ".ml",
    ".ga",
    ".cf"
]


# =========================================================
# FEATURE EXTRACTION
# =========================================================

def extract_features(email_data):

    # -----------------------------------------------------
    # GET EMAIL DATA
    # -----------------------------------------------------

    body = email_data.get("body", "")
    subject = email_data.get("subject", "")
    sender = email_data.get("from", "")
    reply_to = email_data.get("reply_to", "")

    urls = email_data.get("urls", [])
    
    attachments = email_data.get(
        "attachments",
        []
    )

    # Convert to string
    body = str(body)
    subject = str(subject)
    sender = str(sender)
    reply_to = str(reply_to)

    # Combine subject + body
    text = (
        subject + " " + body
    ).lower()


    # =====================================================
    # 1. URL FEATURES
    # =====================================================

    url_count = len(urls)

    ip_url_count = 0

    suspicious_tld_count = 0

    long_url_count = 0


    for url in urls:

        url = str(url)

        try:

            parsed = urlparse(url)

            hostname = parsed.hostname or ""

        except Exception:

            hostname = ""


        # -------------------------------------------------
        # IP ADDRESS URL
        # -------------------------------------------------

        if re.match(
            r"^\d{1,3}(\.\d{1,3}){3}$",
            hostname
        ):

            ip_url_count += 1


        # -------------------------------------------------
        # SUSPICIOUS TLD
        # -------------------------------------------------

        if any(
            hostname.lower().endswith(tld)
            for tld in SUSPICIOUS_TLDS
        ):

            suspicious_tld_count += 1


        # -------------------------------------------------
        # LONG URL
        # -------------------------------------------------

        if len(url) > 100:

            long_url_count += 1


    # =====================================================
    # 2. URGENT LANGUAGE
    # =====================================================

    urgent_count = sum(
        text.count(word)
        for word in URGENT_WORDS
    )


    # =====================================================
    # 3. CREDENTIAL REQUEST
    # =====================================================

    credential_count = sum(
        text.count(word)
        for word in CREDENTIAL_WORDS
    )


    # =====================================================
    # 4. THREAT LANGUAGE
    # =====================================================

    threat_count = sum(
        text.count(word)
        for word in THREAT_WORDS
    )


    # =====================================================
    # 5. REPLY-TO MISMATCH
    # =====================================================

    reply_to_mismatch = 0


    if reply_to and sender:

        sender_domain = re.findall(
            r'@([\w.-]+)',
            sender
        )

        reply_domain = re.findall(
            r'@([\w.-]+)',
            reply_to
        )


        if sender_domain and reply_domain:

            sender_domain = (
                sender_domain[-1]
                .lower()
            )

            reply_domain = (
                reply_domain[-1]
                .lower()
            )


            if sender_domain != reply_domain:

                reply_to_mismatch = 1


    # =====================================================
    # 6. ATTACHMENT FEATURES
    # =====================================================

    attachment_count = len(
        attachments
    )

    suspicious_attachment_count = 0


    for attachment in attachments:

        attachment = str(
            attachment
        ).lower()


        if any(
            attachment.endswith(extension)
            for extension
            in SUSPICIOUS_EXTENSIONS
        ):

            suspicious_attachment_count += 1


        # -------------------------------------------------
        # DOUBLE EXTENSION
        # Example:
        # invoice.pdf.exe
        # -------------------------------------------------

        parts = attachment.split(".")

        if len(parts) >= 3:

            suspicious_attachment_count += 1


    # =====================================================
    # 7. TEXT FEATURES
    # =====================================================

    text_length = len(text)

    exclamation_count = text.count("!")


    # =====================================================
    # RETURN NUMERICAL FEATURES
    # =====================================================
    

    features = {

        "url_count": url_count,

        "ip_url_count": ip_url_count,

        "suspicious_tld_count":
            suspicious_tld_count,

        "long_url_count":
            long_url_count,

        "urgent_count":
            urgent_count,

        "credential_count":
            credential_count,

        "threat_count":
            threat_count,

        "reply_to_mismatch":
            reply_to_mismatch,

        "attachment_count":
            attachment_count,

        "suspicious_attachment_count":
            suspicious_attachment_count,

        "text_length":
            text_length,

        "exclamation_count":
            exclamation_count
    }


    return features

