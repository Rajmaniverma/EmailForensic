# import re
# from urllib.parse import urlparse


# # =========================================================
# # PHISHING KEYWORDS
# # =========================================================

# URGENT_WORDS = [
#     "urgent",
#     "immediately",
#     "asap",
#     "action required",
#     "act now",
#     "final warning",
#     "verify now",
#     "respond immediately"
# ]

# CREDENTIAL_WORDS = [
#     "password",
#     "username",
#     "login",
#     "credential",
#     "otp",
#     "pin",
#     "cvv",
#     "bank account",
#     "credit card"
# ]

# THREAT_WORDS = [
#     "suspended",
#     "blocked",
#     "terminated",
#     "legal action",
#     "penalty",
#     "warning",
#     "account will be closed"
# ]


# # =========================================================
# # SUSPICIOUS FILE EXTENSIONS
# # =========================================================

# SUSPICIOUS_EXTENSIONS = [
#     ".exe",
#     ".scr",
#     ".bat",
#     ".cmd",
#     ".js",
#     ".vbs",
#     ".ps1",
#     ".jar",
#     ".msi"
# ]


# # =========================================================
# # SUSPICIOUS TLDs
# # =========================================================

# SUSPICIOUS_TLDS = [
#     ".xyz",
#     ".top",
#     ".click",
#     ".buzz",
#     ".tk",
#     ".ml",
#     ".ga",
#     ".cf"
# ]


# # =========================================================
# # FEATURE EXTRACTION
# # =========================================================

# def extract_features(email_data):

#     # -----------------------------------------------------
#     # GET EMAIL DATA
#     # -----------------------------------------------------

#     body = email_data.get("body", "")
#     print("______________________________")
#     print(email_data)
#     print("_______________________________")
#     subject = email_data.get("subject", "")
#     sender = email_data.get("from", "")
#     reply_to = email_data.get("reply_to", "")

#     urls = email_data.get("urls", [])
    
#     attachments = email_data.get(
#         "attachments",
#         []
#     )

#     # Convert to string
#     body = str(body)
#     subject = str(subject)
#     sender = str(sender)
#     reply_to = str(reply_to)

#     # Combine subject + body
#     text = (
#         subject + " " + body
#     ).lower()


#     # =====================================================
#     # 1. URL FEATURES
#     # =====================================================

#     url_count = len(urls)

#     ip_url_count = 0

#     suspicious_tld_count = 0

#     long_url_count = 0


#     for url in urls:

#         url = str(url)

#         try:

#             parsed = urlparse(url)

#             hostname = parsed.hostname or ""

#         except Exception:

#             hostname = ""


#         # -------------------------------------------------
#         # IP ADDRESS URL
#         # -------------------------------------------------

#         if re.match(
#             r"^\d{1,3}(\.\d{1,3}){3}$",
#             hostname
#         ):

#             ip_url_count += 1


#         # -------------------------------------------------
#         # SUSPICIOUS TLD
#         # -------------------------------------------------

#         if any(
#             hostname.lower().endswith(tld)
#             for tld in SUSPICIOUS_TLDS
#         ):

#             suspicious_tld_count += 1


#         # -------------------------------------------------
#         # LONG URL
#         # -------------------------------------------------

#         if len(url) > 100:

#             long_url_count += 1


#     # =====================================================
#     # 2. URGENT LANGUAGE
#     # =====================================================

#     urgent_count = sum(
#         text.count(word)
#         for word in URGENT_WORDS
#     )


#     # =====================================================
#     # 3. CREDENTIAL REQUEST
#     # =====================================================

#     credential_count = sum(
#         text.count(word)
#         for word in CREDENTIAL_WORDS
#     )


#     # =====================================================
#     # 4. THREAT LANGUAGE
#     # =====================================================

#     threat_count = sum(
#         text.count(word)
#         for word in THREAT_WORDS
#     )


#     # =====================================================
#     # 5. REPLY-TO MISMATCH
#     # =====================================================

#     reply_to_mismatch = 0


#     if reply_to and sender:

#         sender_domain = re.findall(
#             r'@([\w.-]+)',
#             sender
#         )

#         reply_domain = re.findall(
#             r'@([\w.-]+)',
#             reply_to
#         )


#         if sender_domain and reply_domain:

#             sender_domain = (
#                 sender_domain[-1]
#                 .lower()
#             )

#             reply_domain = (
#                 reply_domain[-1]
#                 .lower()
#             )


#             if sender_domain != reply_domain:

#                 reply_to_mismatch = 1


#     # =====================================================
#     # 6. ATTACHMENT FEATURES
#     # =====================================================

#     attachment_count = len(
#         attachments
#     )

#     suspicious_attachment_count = 0


#     for attachment in attachments:

#         attachment = str(
#             attachment
#         ).lower()


#         if any(
#             attachment.endswith(extension)
#             for extension
#             in SUSPICIOUS_EXTENSIONS
#         ):

#             suspicious_attachment_count += 1


#         # -------------------------------------------------
#         # DOUBLE EXTENSION
#         # Example:
#         # invoice.pdf.exe
#         # -------------------------------------------------

#         parts = attachment.split(".")

#         if len(parts) >= 3:

#             suspicious_attachment_count += 1


#     # =====================================================
#     # 7. TEXT FEATURES
#     # =====================================================

#     text_length = len(text)

#     exclamation_count = text.count("!")


#     # =====================================================
#     # RETURN NUMERICAL FEATURES
#     # =====================================================
    

#     features = {

#         "url_count": url_count,

#         "ip_url_count": ip_url_count,

#         "suspicious_tld_count":
#             suspicious_tld_count,

#         "long_url_count":
#             long_url_count,

#         "urgent_count":
#             urgent_count,

#         "credential_count":
#             credential_count,

#         "threat_count":
#             threat_count,

#         "reply_to_mismatch":
#             reply_to_mismatch,

#         "attachment_count":
#             attachment_count,

#         "suspicious_attachment_count":
#             suspicious_attachment_count,

#         "text_length":
#             text_length,

#         "exclamation_count":
#             exclamation_count
#     }


#     return features


import re
from urllib.parse import urlparse


# =========================================================
# PHISHING KEYWORDS
# =========================================================

URGENT_WORDS = [
    # Basic urgency
    "urgent",
    "urgently",
    "immediately",
    "asap",
    "as soon as possible",
    "right away",
    "without delay",
    "at once",
    "promptly",

    # Action pressure
    "action required",
    "action needed",
    "action is required",
    "immediate action required",
    "immediate action needed",
    "act now",
    "act immediately",
    "take action now",
    "take immediate action",
    "please act now",
    "please respond",
    "please respond immediately",
    "respond immediately",
    "respond now",
    "reply immediately",
    "reply now",
    "contact us immediately",

    # Warnings / deadlines
    "final warning",
    "final notice",
    "last warning",
    "last notice",
    "final reminder",
    "last reminder",
    "last chance",
    "final chance",
    "deadline",
    "approaching deadline",
    "deadline approaching",
    "time is running out",
    "time sensitive",
    "time-sensitive",
    "limited time",

    # Time restrictions
    "within 24 hours",
    "within 48 hours",
    "within 12 hours",
    "within one hour",
    "within an hour",
    "before midnight",
    "by today",
    "by the end of today",
    "before the deadline",
    "expires today",
    "expires soon",
    "offer expires",
    "access expires",

    # Delay-pressure phrases
    "do not delay",
    "don't delay",
    "do not wait",
    "don't wait",
    "do not ignore",
    "don't ignore",
    "do not postpone",
    "don't postpone",
    "avoid delay",
    "avoid further delay",

    # Immediate response
    "immediate response",
    "immediate attention",
    "immediate assistance",
    "immediate confirmation",
    "immediate action",
    "immediate attention required",
    "your immediate attention is required",
    "your immediate action is required",
    "please act urgently",
    "please respond urgently",

    # Account/security pressure
    "security alert",
    "security warning",
    "urgent security notice",
    "important security notice",
    "critical security alert",
    "urgent account notice",
    "account action required",
    "account requires attention",
    "immediate account action",
    "immediate verification required"
]
CREDENTIAL_WORDS = [

    # =========================
    # Basic credentials
    # =========================
    "password",
    "passcode",
    "pass code",
    "username",
    "user name",
    "user id",
    "userid",
    "login",
    "log in",
    "signin",
    "sign in",
    "credential",
    "credentials",
    "account credentials",
    "access credentials",

    # =========================
    # Authentication
    # =========================
    "authentication",
    "authenticate",
    "authorization",
    "authorize",
    "authentication details",
    "authentication information",
    "authentication code",
    "authentication token",
    "access code",
    "access key",
    "security code",
    "security token",
    "verification code",
    "confirmation code",

    # =========================
    # OTP / PIN
    # =========================
    "otp",
    "one time password",
    "one-time password",
    "one time passcode",
    "one-time passcode",
    "otp code",
    "otp number",
    "pin",
    "pin code",
    "security pin",
    "passkey",
    "pass key",

    # =========================
    # Recovery / security
    # =========================
    "recovery code",
    "recovery key",
    "backup code",
    "backup codes",
    "security question",
    "security answer",
    "secret question",
    "secret answer",
    "recovery email",
    "recovery phone",
    "security details",
    "security information",

    # =========================
    # Personal identity
    # =========================
    "identity",
    "identity information",
    "identity details",
    "personal information",
    "personal details",
    "date of birth",
    "birth date",
    "social security number",
    "national id",
    "government id",
    "id number",
    "identification number",
    "passport number",
    "driving license",
    "driver license",

    # =========================
    # Banking
    # =========================
    "bank account",
    "bank account number",
    "account number",
    "bank details",
    "banking details",
    "banking information",
    "online banking",
    "net banking",
    "bank login",
    "bank password",
    "banking password",
    "customer id",
    "customer number",
    "account holder",

    # =========================
    # Payment cards
    # =========================
    "credit card",
    "credit card number",
    "debit card",
    "debit card number",
    "card number",
    "card details",
    "card information",
    "cardholder name",
    "card holder",
    "cvv",
    "cvc",
    "cvv2",
    "security number",
    "card expiry",
    "expiry date",
    "expiration date",

    # =========================
    # Financial authentication
    # =========================
    "transaction password",
    "transaction pin",
    "transaction code",
    "payment password",
    "payment pin",
    "payment code",
    "transfer code",
    "banking pin",
    "security token",
    "authorization code",

    # =========================
    # Account access
    # =========================
    "account access",
    "account password",
    "account pin",
    "account code",
    "account verification code",
    "account security code",
    "access password",
    "access pin",
    "access token",
    "session token",
    "secret key",
    "private key"
]

THREAT_WORDS = [

    # =========================
    # Account status threats
    # =========================
    "suspended",
    "suspension",
    "account suspended",
    "temporarily suspended",
    "permanently suspended",

    "blocked",
    "account blocked",
    "access blocked",
    "account has been blocked",

    "locked",
    "account locked",
    "account has been locked",

    "terminated",
    "account terminated",
    "account termination",

    "deactivated",
    "account deactivated",
    "account has been deactivated",

    "disabled",
    "account disabled",
    "account has been disabled",

    "restricted",
    "account restricted",
    "access restricted",
    "restricted access",

    "closed",
    "account closed",
    "account will be closed",
    "account may be closed",
    "account closure",

    # =========================
    # Access / service threats
    # =========================
    "access will be revoked",
    "access revoked",
    "access will be removed",
    "access denied",
    "service will be suspended",
    "service suspended",
    "service terminated",
    "service interruption",
    "service will be discontinued",
    "loss of access",
    "lose access",
    "you will lose access",

    # =========================
    # Security threats
    # =========================
    "security warning",
    "security alert",
    "security threat",
    "security risk",
    "security violation",
    "security breach",
    "security incident",
    "suspicious activity",
    "unauthorized activity",
    "unauthorized access",
    "unusual activity",
    "fraud detected",
    "fraudulent activity",
    "fraud alert",
    "potential fraud",
    "account compromised",
    "account has been compromised",

    # =========================
    # Legal threats
    # =========================
    "legal action",
    "legal consequences",
    "legal proceedings",
    "legal notice",
    "law enforcement",
    "reported to authorities",
    "report to authorities",
    "court action",
    "court proceedings",
    "lawsuit",
    "legal complaint",

    # =========================
    # Financial penalties
    # =========================
    "penalty",
    "penalties",
    "fine",
    "financial penalty",
    "additional charges",
    "late fee",
    "late fees",
    "additional fee",
    "service fee",
    "payment penalty",
    "overdue payment",
    "outstanding payment",
    "amount overdue",

    # =========================
    # Warning phrases
    # =========================
    "warning",
    "final warning",
    "official warning",
    "security warning",
    "final notice",
    "last notice",
    "last warning",
    "important notice",
    "critical notice",
    "violation notice",

    # =========================
    # Consequence / pressure
    # =========================
    "failure to comply",
    "if you fail to comply",
    "failure to respond",
    "failure to verify",
    "failure to confirm",
    "failure to act",
    "failure to provide",
    "failure to update",
    "failure will result",
    "will result in suspension",
    "will result in termination",
    "will result in closure",
    "may result in suspension",
    "may result in termination",
    "may result in account closure",
    "your account will be closed",
    "your account may be closed",
    "your access will be terminated",
    "your access may be terminated",

    # =========================
    # Deadline-related threats
    # =========================
    "deadline has passed",
    "deadline approaching",
    "deadline expires",
    "before your account is closed",
    "before access is revoked",
    "before suspension",
    "before termination",
    "before account closure"
]

# =========================================================
# SUSPICIOUS FILE EXTENSIONS
# =========================================================

SUSPICIOUS_EXTENSIONS = [

    # =========================
    # Windows executables
    # =========================
    ".exe",
    ".com",
    ".scr",
    ".cpl",
    ".dll",
    ".ocx",

    # =========================
    # Windows batch / command
    # =========================
    ".bat",
    ".cmd",

    # =========================
    # PowerShell
    # =========================
    ".ps1",
    ".psm1",
    ".psd1",
    ".ps1xml",

    # =========================
    # Windows scripting
    # =========================
    ".js",
    ".jse",
    ".vbs",
    ".vbe",
    ".wsf",
    ".wsh",
    ".hta",

    # =========================
    # Java / application files
    # =========================
    ".jar",
    ".jnlp",
    ".msi",
    ".msp",
    ".appx",
    ".appxbundle",
    ".msix",
    ".msixbundle",

    # =========================
    # Shortcuts / link files
    # =========================
    ".lnk",
    ".url",
    ".scf",

    # =========================
    # Registry / configuration
    # =========================
    ".reg",

    # =========================
    # Disk images
    # =========================
    ".iso",
    ".img",
    ".vhd",
    ".vhdx",

    # =========================
    # Office macro-enabled files
    # =========================
    ".docm",
    ".dotm",
    ".xlsm",
    ".xltm",
    ".xlam",
    ".pptm",
    ".potm",
    ".ppsm",

    # =========================
    # HTML / web files
    # =========================
    ".hta",
    ".html",
    ".htm",

    # =========================
    # Potentially executable / script
    # =========================
    ".sh",
    ".bash",
    ".zsh",
    ".command",
    ".py",
    ".pyw",
    ".rb",
    ".pl",
    ".php"
]


# =========================================================
# SUSPICIOUS TLDs
# =========================================================

SUSPICIOUS_TLDS = [

    # Commonly seen in abusive / disposable domains
    ".xyz",
    ".top",
    ".click",
    ".buzz",
    ".work",
    ".download",
    ".stream",
    ".win",
    ".bid",
    ".trade",
    ".racing",
    ".party",
    ".review",
    ".science",
    ".live",
    ".loan",

    # Country-code / historically abused free-domain suffixes
    ".tk",
    ".ml",
    ".ga",
    ".cf",
    ".gq",

    # Other TLDs worth treating as a weak signal
    ".zip",
    ".mov",
    ".rest",
    ".fit",
    ".cam",
    ".monster",
    ".icu",
    ".cyou",
    ".wang",
    ".link",
    ".website",
    ".online",
    ".site",
    ".space",
    ".club",
    ".fun",
    ".today",
    ".email",
    ".support",
    ".help",
    ".cloud",
    ".digital",
    ".company",
    ".services",
    ".solutions",
    ".network",
    ".technology",
    ".agency",
    ".center",
    ".social",
    ".world"
]


# =========================================================
# FEATURE EXTRACTION
# =========================================================

def extract_features(email_data):

    # -----------------------------------------------------
    # GET EMAIL DATA
    # -----------------------------------------------------

    body = str(email_data.get("body", ""))
    subject = str(email_data.get("subject", ""))
    sender = str(email_data.get("from", ""))
    reply_to = str(email_data.get("reply_to", ""))

    urls = email_data.get("urls", []) or []
    attachments = email_data.get("attachments", []) or []

    # Combine subject + body
    text = (subject + " " + body).lower()


    # =====================================================
    # 1. URL FEATURES
    # =====================================================

    url_count = len(urls)

    ip_url_count = 0
    suspicious_tld_count = 0
    long_url_count = 0

    for url in urls:

        url = str(url).strip()

        try:
            parsed = urlparse(url)
            hostname = parsed.hostname or ""
            hostname = hostname.lower()

        except Exception:
            hostname = ""


        # -------------------------------------------------
        # IP ADDRESS URL
        # -------------------------------------------------

        if re.fullmatch(
            r"\d{1,3}(?:\.\d{1,3}){3}",
            hostname
        ):
            ip_url_count += 1


        # -------------------------------------------------
        # SUSPICIOUS TLD
        # -------------------------------------------------

        if any(
            hostname.endswith(tld)
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

        sender_domains = re.findall(
            r'@([\w.-]+)',
            sender
        )

        reply_domains = re.findall(
            r'@([\w.-]+)',
            reply_to
        )

        if sender_domains and reply_domains:

            sender_domain = sender_domains[-1].lower()
            reply_domain = reply_domains[-1].lower()

            if sender_domain != reply_domain:
                reply_to_mismatch = 1


    # =====================================================
    # 6. ATTACHMENT FEATURES
    # =====================================================

    attachment_count = len(attachments)

    suspicious_attachment_count = 0

    for attachment in attachments:

        attachment = str(attachment).strip().lower()

        # -------------------------------------------------
        # Suspicious extension OR double extension
        # Count each attachment only ONCE
        # -------------------------------------------------

        suspicious_extension = any(
            attachment.endswith(extension)
            for extension in SUSPICIOUS_EXTENSIONS
        )

        parts = attachment.split(".")

        double_extension = (
            len(parts) >= 3
        )

        if suspicious_extension or double_extension:
            suspicious_attachment_count += 1


    # =====================================================
    # 7. TEXT FEATURES
    # =====================================================

    text_length = len(text)

    exclamation_count = text.count("!")


    # =====================================================
    # RETURN FEATURES
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