import base64
import re
import hashlib
from email.header import decode_header, make_header

from IPGeolocation.Origin_IP import extract_origin_ip
from IPGeolocation.IP_Geolocation import get_ip_intelligence


def decode_header_value(value: str) -> str:
    """Decode RFC 2047 encoded header string (e.g. =?UTF-8?B?...?=)."""
    if not value:
        return ""
    try:
        decoded = str(make_header(decode_header(value)))
        return decoded
    except Exception:
        return str(value)


def decode_base64url(data: str) -> str:
    """Safely decode Base64URL string from Gmail API payload body."""
    if not data:
        return ""
    try:
        # Add padding if required
        padding = len(data) % 4
        if padding and padding < 4:
            data += "=" * (4 - padding)
        decoded_bytes = base64.urlsafe_b64decode(data.encode("utf-8"))
        return decoded_bytes.decode("utf-8", errors="replace")
    except Exception:
        return ""


def get_header_value(headers: list, name: str, default: str = "") -> str:
    """Case-insensitive header value lookup from Gmail payload headers."""
    if not headers:
        return default
    name_lower = name.lower()
    for header in headers:
        if header.get("name", "").lower() == name_lower:
            return decode_header_value(header.get("value", ""))
    return default


def get_all_header_values(headers: list, name: str) -> list:
    """Case-insensitive retrieval of all values for a header (e.g. Received, Authentication-Results)."""
    if not headers:
        return []
    name_lower = name.lower()
    results = []
    for header in headers:
        if header.get("name", "").lower() == name_lower:
            val = header.get("value", "")
            if val:
                results.append(val)
    return results


def _extract_parts(part: dict, plain_parts: list, html_parts: list, attachments: list):
    """Recursively extract plain text, html text, and attachments from message parts."""
    mime_type = part.get("mimeType", "").lower()
    filename = part.get("filename", "")
    body = part.get("body", {})
    data = body.get("data", "")
    attachment_id = body.get("attachmentId", "")
    size = body.get("size", 0)

    # Check if this part is an attachment
    if filename or attachment_id or (mime_type and not mime_type.startswith("text/") and not mime_type.startswith("multipart/")):
        attachments.append({
            "filename": filename or "unnamed_attachment",
            "mime_type": mime_type,
            "size": size,
            "attachment_id": attachment_id
        })
    elif mime_type == "text/plain":
        text = decode_base64url(data)
        if text:
            plain_parts.append(text)
    elif mime_type == "text/html":
        html = decode_base64url(data)
        if html:
            html_parts.append(html)

    # Recursively process child parts if present
    subparts = part.get("parts", [])
    for subpart in subparts:
        _extract_parts(subpart, plain_parts, html_parts, attachments)


def parse_gmail_message(gmail_msg: dict) -> dict:
    """
    Parses a raw Gmail API message response (format="full") into a structured format.
    Returns standard clean JSON representation.
    """
    message_id = gmail_msg.get("id", "")
    thread_id = gmail_msg.get("threadId", "")
    payload = gmail_msg.get("payload", {})
    headers = payload.get("headers", [])

    sender = get_header_value(headers, "From")
    to_addr = get_header_value(headers, "To")
    cc_addr = get_header_value(headers, "Cc")
    bcc_addr = get_header_value(headers, "Bcc")
    subject = get_header_value(headers, "Subject")
    date_str = get_header_value(headers, "Date")

    plain_parts = []
    html_parts = []
    attachments = []

    _extract_parts(payload, plain_parts, html_parts, attachments)

    plain_text = "\n".join(plain_parts)
    html_content = "\n".join(html_parts)

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


def convert_gmail_to_email_data(gmail_parsed: dict, gmail_msg: dict) -> dict:
    """
    Converts parsed Gmail message into the email_data dictionary format
    expected by Detection_engine.py and Phishing.py.
    """
    payload = gmail_msg.get("payload", {})
    headers = payload.get("headers", [])

    reply_to = get_header_value(headers, "Reply-To")
    return_path = get_header_value(headers, "Return-Path")
    header_msg_id = get_header_value(headers, "Message-ID") or gmail_parsed.get("message_id")
    content_type = payload.get("mimeType", "text/plain")
    mime_version = get_header_value(headers, "MIME-Version", "1.0")

    received = get_all_header_values(headers, "Received")
    origin_ip = extract_origin_ip(received)

    geolocation = None
    if origin_ip:
        try:
            geolocation = get_ip_intelligence(origin_ip)
        except Exception:
            geolocation = None

    # Determine body
    plain_body = gmail_parsed.get("plain_text", "")
    html_body = gmail_parsed.get("html", "")

    if plain_body:
        body = plain_body
    elif html_body:
        body = re.sub(r"<[^>]+>", " ", html_body)
        body = re.sub(r"\s+", " ", body).strip()
    else:
        body = ""

    # Extract URLs
    urls = []
    if plain_body:
        urls.extend(re.findall(r'https?://[^\s<>"\']+', plain_body, re.IGNORECASE))
    if html_body:
        href_urls = re.findall(r'href\s*=\s*["\'](https?://[^"\']+)["\']', html_body, re.IGNORECASE)
        urls.extend(href_urls)
        html_urls = re.findall(r'https?://[^\s<>"\']+', html_body, re.IGNORECASE)
        urls.extend(html_urls)

    cleaned_urls = list(dict.fromkeys([u.rstrip(".,;:!?)]}>") for u in urls]))

    # Authentication headers (SPF, DKIM, DMARC)
    auth_results = get_all_header_values(headers, "Authentication-Results")
    spf, dkim, dmarc = [], [], []

    for result in auth_results:
        spf_matches = re.findall(r'\bspf=(pass|fail|softfail|neutral|none|temperror|permerror)\b', result, re.IGNORECASE)
        spf.extend([m.lower() for m in spf_matches])

        dkim_matches = re.findall(r'\bdkim=(pass|fail|neutral|none|temperror|permerror)\b', result, re.IGNORECASE)
        dkim.extend([m.lower() for m in dkim_matches])

        dmarc_matches = re.findall(r'\bdmarc=(pass|fail|softfail|neutral|none|temperror|permerror)\b', result, re.IGNORECASE)
        dmarc.extend([m.lower() for m in dmarc_matches])

    if not spf:
        spf = ["none"]
    if not dkim:
        dkim = ["none"]
    if not dmarc:
        dmarc = ["none"]

    # Formatted attachments
    attachments_data = []
    for att in gmail_parsed.get("attachments", []):
        attachments_data.append({
            "filename": att.get("filename", "attachment"),
            "content_type": att.get("mime_type", "application/octet-stream"),
            "size": att.get("size", 0),
            "sha256": ""
        })

    return {
        "from": gmail_parsed.get("sender"),
        "to": gmail_parsed.get("to"),
        "cc": gmail_parsed.get("cc"),
        "bcc": gmail_parsed.get("bcc"),
        "subject": gmail_parsed.get("subject"),
        "date": gmail_parsed.get("date"),
        "reply_to": reply_to,
        "return_path": return_path,
        "message_id": header_msg_id,
        "received": received,
        "origin_ip": origin_ip,
        "geolocation": geolocation,
        "Content-type": content_type,
        "mime-version": mime_version,
        "authentication": {
            "spf": spf,
            "dkim": dkim,
            "dmarc": dmarc
        },
        "body": body,
        "urls": cleaned_urls,
        "attachments": attachments_data
    }
