import base64
import re
from email.header import decode_header, make_header


# ============================================================
# HEADER DECODING
# ============================================================

def decode_header_value(value: str) -> str:
    """
    Decode RFC 2047 encoded email header values.

    Example:
        =?UTF-8?B?...?=

    Returns:
        Decoded string.
    """

    if not value:
        return ""

    try:
        return str(
            make_header(
                decode_header(value)
            )
        )

    except Exception:
        return str(value)


# ============================================================
# BASE64URL DECODING
# ============================================================

def decode_base64url(data: str) -> str:
    """
    Safely decode Base64URL data from Gmail API.
    """

    if not data:
        return ""

    try:
        # Add missing Base64 padding
        padding = len(data) % 4

        if padding:
            data += "=" * (4 - padding)

        decoded_bytes = base64.urlsafe_b64decode(
            data.encode("utf-8")
        )

        return decoded_bytes.decode(
            "utf-8",
            errors="replace"
        )

    except Exception:
        return ""


# ============================================================
# GET ONE HEADER
# ============================================================

def get_header_value(
    headers: list,
    name: str,
    default: str = ""
) -> str:
    """
    Get one header value case-insensitively.

    Example:
        get_header_value(headers, "From")
    """

    if not headers:
        return default

    name_lower = name.lower()

    for header in headers:

        header_name = header.get(
            "name",
            ""
        ).lower()

        if header_name == name_lower:

            return decode_header_value(
                header.get(
                    "value",
                    ""
                )
            )

    return default


# ============================================================
# GET ALL HEADER VALUES
# ============================================================

def get_all_header_values(
    headers: list,
    name: str
) -> list:
    """
    Get all values of a particular header.

    Useful for headers such as:

        Received
        Authentication-Results

    Example:
        get_all_header_values(headers, "Received")
    """

    if not headers:
        return []

    name_lower = name.lower()

    results = []

    for header in headers:

        header_name = header.get(
            "name",
            ""
        ).lower()

        if header_name == name_lower:

            value = header.get(
                "value",
                ""
            )

            if value:
                results.append(value)

    return results


# ============================================================
# EXTRACT MIME PARTS
# ============================================================

def _extract_parts(
    part: dict,
    plain_parts: list,
    html_parts: list,
    attachments: list
):
    """
    Recursively extract:

        - text/plain
        - text/html
        - attachments

    from Gmail MIME parts.
    """

    mime_type = part.get(
        "mimeType",
        ""
    ).lower()

    filename = part.get(
        "filename",
        ""
    )

    body = part.get(
        "body",
        {}
    )

    data = body.get(
        "data",
        ""
    )

    attachment_id = body.get(
        "attachmentId",
        ""
    )

    size = body.get(
        "size",
        0
    )

    # --------------------------------------------------------
    # Attachment
    # --------------------------------------------------------

    if (
        filename
        or attachment_id
        or (
            mime_type
            and not mime_type.startswith("text/")
            and not mime_type.startswith("multipart/")
        )
    ):

        attachments.append({

            "filename": (
                filename
                or "unnamed_attachment"
            ),

            "mime_type": mime_type,

            "size": size,

            "attachment_id": attachment_id
        })

    # --------------------------------------------------------
    # Plain text
    # --------------------------------------------------------

    elif mime_type == "text/plain":

        text = decode_base64url(data)

        if text:
            plain_parts.append(text)

    # --------------------------------------------------------
    # HTML
    # --------------------------------------------------------

    elif mime_type == "text/html":

        html = decode_base64url(data)

        if html:
            html_parts.append(html)

    # --------------------------------------------------------
    # Recursive MIME parts
    # --------------------------------------------------------

    subparts = part.get(
        "parts",
        []
    )

    for subpart in subparts:

        _extract_parts(
            subpart,
            plain_parts,
            html_parts,
            attachments
        )


# ============================================================
# PARSE GMAIL MESSAGE
# ============================================================

def parse_gmail_message(
    gmail_msg: dict
) -> dict:
    """
    Parse Gmail API message.

    Expected Gmail API format:

        format="full"

    This function extracts:

        - message ID
        - thread ID
        - sender
        - recipients
        - subject
        - date
        - plain text
        - HTML
        - attachments

    It does NOT perform IP analysis.
    """

    message_id = gmail_msg.get(
        "id",
        ""
    )

    thread_id = gmail_msg.get(
        "threadId",
        ""
    )

    payload = gmail_msg.get(
        "payload",
        {}
    )

    headers = payload.get(
        "headers",
        []
    )

    # --------------------------------------------------------
    # Standard headers
    # --------------------------------------------------------

    sender = get_header_value(
        headers,
        "From"
    )

    to_addr = get_header_value(
        headers,
        "To"
    )

    cc_addr = get_header_value(
        headers,
        "Cc"
    )

    bcc_addr = get_header_value(
        headers,
        "Bcc"
    )

    subject = get_header_value(
        headers,
        "Subject"
    )

    date_str = get_header_value(
        headers,
        "Date"
    )

    # --------------------------------------------------------
    # MIME extraction
    # --------------------------------------------------------

    plain_parts = []

    html_parts = []

    attachments = []

    _extract_parts(
        payload,
        plain_parts,
        html_parts,
        attachments
    )

    plain_text = "\n".join(
        plain_parts
    )

    html_content = "\n".join(
        html_parts
    )

    # --------------------------------------------------------
    # Return parsed Gmail data
    # --------------------------------------------------------

    return {

        "message_id": message_id,

        "thread_id": thread_id,

        "sender": sender,

        "to": to_addr,

        "cc": cc_addr,

        "bcc": bcc_addr,

        "subject": subject,

        "date": date_str,

        "plain_text": plain_text,

        "html": html_content,

        "attachments": attachments
    }


# ============================================================
# CONVERT GMAIL → EMAIL DATA
# ============================================================

def convert_gmail_to_email_data(
    gmail_parsed: dict,
    gmail_msg: dict
) -> dict:
    """
    Convert parsed Gmail message into the common
    email_data structure used by the detection system.

    IMPORTANT:

    This function only prepares the email data.

    It does NOT:
        - extract origin IP
        - perform IP geolocation
        - perform VPN detection
        - perform TOR detection

    All Received headers are preserved and passed
    to the IP-forensics system later.
    """

    payload = gmail_msg.get(
        "payload",
        {}
    )

    headers = payload.get(
        "headers",
        []
    )

    # ========================================================
    # Standard email headers
    # ========================================================

    reply_to = get_header_value(
        headers,
        "Reply-To"
    )

    return_path = get_header_value(
        headers,
        "Return-Path"
    )

    header_msg_id = (
        get_header_value(
            headers,
            "Message-ID"
        )
        or gmail_parsed.get(
            "message_id"
        )
    )

    content_type = payload.get(
        "mimeType",
        "text/plain"
    )

    mime_version = get_header_value(
        headers,
        "MIME-Version",
        "1.0"
    )

    # ========================================================
    # IMPORTANT: Get ALL Received headers
    # ========================================================

    received_headers = get_all_header_values(
        headers,
        "Received"
    )

    # ========================================================
    # Authentication Results
    # ========================================================

    auth_results = get_all_header_values(
        headers,
        "Authentication-Results"
    )

    spf = []

    dkim = []

    dmarc = []

    for result in auth_results:

        # -------------------------------
        # SPF
        # -------------------------------

        spf_matches = re.findall(
            r"\bspf="
            r"(pass|fail|softfail|neutral|none|"
            r"temperror|permerror)\b",
            result,
            re.IGNORECASE
        )

        spf.extend(
            match.lower()
            for match in spf_matches
        )

        # -------------------------------
        # DKIM
        # -------------------------------

        dkim_matches = re.findall(
            r"\bdkim="
            r"(pass|fail|neutral|none|"
            r"temperror|permerror)\b",
            result,
            re.IGNORECASE
        )

        dkim.extend(
            match.lower()
            for match in dkim_matches
        )

        # -------------------------------
        # DMARC
        # -------------------------------

        dmarc_matches = re.findall(
            r"\bdmarc="
            r"(pass|fail|softfail|neutral|none|"
            r"temperror|permerror)\b",
            result,
            re.IGNORECASE
        )

        dmarc.extend(
            match.lower()
            for match in dmarc_matches
        )

    # --------------------------------------------------------
    # Default authentication values
    # --------------------------------------------------------

    if not spf:
        spf = ["none"]

    if not dkim:
        dkim = ["none"]

    if not dmarc:
        dmarc = ["none"]

    # ========================================================
    # Body
    # ========================================================

    plain_body = gmail_parsed.get(
        "plain_text",
        ""
    )

    html_body = gmail_parsed.get(
        "html",
        ""
    )

    if plain_body:

        body = plain_body

    elif html_body:

        # Remove HTML tags
        body = re.sub(
            r"<[^>]+>",
            " ",
            html_body
        )

        # Normalize whitespace
        body = re.sub(
            r"\s+",
            " ",
            body
        ).strip()

    else:

        body = ""

    # ========================================================
    # Extract URLs
    # ========================================================

    urls = []

    # --------------------------------------------------------
    # URLs from plain text
    # --------------------------------------------------------

    if plain_body:

        urls.extend(
            re.findall(
                r'https?://[^\s<>"\']+',
                plain_body,
                re.IGNORECASE
            )
        )

    # --------------------------------------------------------
    # URLs from HTML href
    # --------------------------------------------------------

    if html_body:

        href_urls = re.findall(
            r'href\s*=\s*["\']'
            r'(https?://[^"\']+)'
            r'["\']',
            html_body,
            re.IGNORECASE
        )

        urls.extend(
            href_urls
        )

        # ----------------------------------------------------
        # Raw URLs in HTML
        # ----------------------------------------------------

        html_urls = re.findall(
            r'https?://[^\s<>"\']+',
            html_body,
            re.IGNORECASE
        )

        urls.extend(
            html_urls
        )

    # --------------------------------------------------------
    # Remove duplicates and punctuation
    # --------------------------------------------------------

    cleaned_urls = list(
        dict.fromkeys(
            url.rstrip(
                ".,;:!?)]}>"
            )
            for url in urls
        )
    )

    # ========================================================
    # Attachments
    # ========================================================

    attachments_data = []

    for attachment in gmail_parsed.get(
        "attachments",
        []
    ):

        attachments_data.append({

            "filename": attachment.get(
                "filename",
                "attachment"
            ),

            "content_type": attachment.get(
                "mime_type",
                "application/octet-stream"
            ),

            "size": attachment.get(
                "size",
                0
            ),

            # SHA256 can be calculated later when
            # attachment bytes are actually downloaded.
            "sha256": ""
        })

    # ========================================================
    # FINAL EMAIL DATA
    # ========================================================

    email_data = {

        # ----------------------------------------------------
        # Identity
        # ----------------------------------------------------

        "from": gmail_parsed.get(
            "sender"
        ),

        "to": gmail_parsed.get(
            "to"
        ),

        "cc": gmail_parsed.get(
            "cc"
        ),

        "bcc": gmail_parsed.get(
            "bcc"
        ),

        # ----------------------------------------------------
        # Email metadata
        # ----------------------------------------------------

        "subject": gmail_parsed.get(
            "subject"
        ),

        "date": gmail_parsed.get(
            "date"
        ),

        "reply_to": reply_to,

        "return_path": return_path,

        "thread_id": gmail_parsed.get(
            "thread_id"
        ),

        "message_id": header_msg_id,

        # ----------------------------------------------------
        # Email content
        # ----------------------------------------------------

        "html_body": html_body,

        "body": body,

        # ----------------------------------------------------
        # IMPORTANT:
        # Keep ALL Received headers.
        #
        # IP-forensics will process these later.
        # ----------------------------------------------------

        "received_headers": received_headers,

        # ----------------------------------------------------
        # MIME
        # ----------------------------------------------------

        "Content-type": content_type,

        "mime-version": mime_version,

        # ----------------------------------------------------
        # Authentication
        # ----------------------------------------------------

        "authentication": {

            "spf": spf,

            "dkim": dkim,

            "dmarc": dmarc
        },

        # ----------------------------------------------------
        # URLs
        # ----------------------------------------------------

        "urls": cleaned_urls,

        # ----------------------------------------------------
        # Attachments
        # ----------------------------------------------------

        "attachments": attachments_data
    }

    return email_data