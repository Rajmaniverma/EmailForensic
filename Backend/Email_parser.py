
from email import policy
from email.parser import BytesParser
import re
import hashlib

from IPGeolocation.Origin_IP import extract_origin_ip
from IPGeolocation.IP_Geolocation import get_ip_intelligence


# ---------------------------------------------------------
# Parse Email
# ---------------------------------------------------------

def parse_email(email_content):

    # -----------------------------------------------------
    # Parse email
    # -----------------------------------------------------

    msg = BytesParser(
        policy=policy.default
    ).parsebytes(email_content)


    # -----------------------------------------------------
    # Basic Email Information
    # -----------------------------------------------------

    sender = msg.get("From")
    recipient = msg.get("To")
    cc = msg.get("Cc")
    bcc = msg.get("Bcc")
    subject = msg.get("Subject")
    date = msg.get("Date")
    reply_to = msg.get("Reply-To")
    return_path = msg.get("Return-Path")
    message_id = msg.get("Message-ID")
    content_type = msg.get("Content-Type")
    mime_version = msg.get("MIME-Version")

    # -----------------------------------------------------
    # Received Headers
    # -----------------------------------------------------

    received = msg.get_all("Received", [])

    IP = extract_origin_ip(received)


    # -----------------------------------------------------
    # IP Geolocation
    # -----------------------------------------------------

    def Geolocation():

        if not IP:
            return None

        ip_geolocation = get_ip_intelligence(IP)

        return ip_geolocation


    geolocation = Geolocation()


    # -----------------------------------------------------
    # Email Body
    # -----------------------------------------------------

    plain_parts = []
    html_parts = []


    for part in msg.walk():

        content_type_part = part.get_content_type()


        # Ignore attachments
        if part.get_filename():
            continue


        # -----------------------------------------------
        # Plain Text
        # -----------------------------------------------

        if content_type_part == "text/plain":

            try:

                content = part.get_content()

                if content:
                    plain_parts.append(content)

            except Exception:
                pass


        # -----------------------------------------------
        # HTML
        # -----------------------------------------------

        elif content_type_part == "text/html":

            try:

                content = part.get_content()

                if content:
                    html_parts.append(content)

            except Exception:
                pass


    # Combine all plain text parts
    plain_body = "\n".join(plain_parts)


    # Combine all HTML parts
    html_body = "\n".join(html_parts)


    # -----------------------------------------------------
    # Create Body
    # -----------------------------------------------------

    if plain_body:

        body = plain_body

    elif html_body:

        # Remove HTML tags for readable body
        body = re.sub(
            r"<[^>]+>",
            " ",
            html_body
        )

        body = re.sub(
            r"\s+",
            " ",
            body
        ).strip()

    else:

        body = None


    # -----------------------------------------------------
    # Extract URLs
    # -----------------------------------------------------

    urls = []


    # Extract from plain text
    if plain_body:

        plain_urls = re.findall(
            r'https?://[^\s<>"\']+',
            plain_body,
            re.IGNORECASE
        )

        urls.extend(plain_urls)


    # Extract from HTML
    if html_body:

        # URLs inside href
        href_urls = re.findall(
            r'href\s*=\s*["\'](https?://[^"\']+)["\']',
            html_body,
            re.IGNORECASE
        )

        urls.extend(href_urls)


        # URLs directly written in HTML
        html_urls = re.findall(
            r'https?://[^\s<>"\']+',
            html_body,
            re.IGNORECASE
        )

        urls.extend(html_urls)


    # -----------------------------------------------------
    # Clean URLs
    # -----------------------------------------------------

    cleaned_urls = []

    for url in urls:

        url = url.rstrip(
            ".,;:!?)]}>"
        )

        cleaned_urls.append(url)


    # Remove duplicates
    urls = list(
        dict.fromkeys(cleaned_urls)
    )


    # -----------------------------------------------------
    # Authentication Results
    # SPF / DKIM / DMARC
    # -----------------------------------------------------

    auth_results = msg.get_all(
        "Authentication-Results",
        []
    )

    spf = []
    dkim = []
    dmarc = []


    for result in auth_results:

        # SPF
        spf_matches = re.findall(
            r'\bspf=(pass|fail|softfail|neutral|none|temperror|permerror)\b',
            result,
            re.IGNORECASE
        )

        spf.extend(
            match.lower()
            for match in spf_matches
        )


        # DKIM
        dkim_matches = re.findall(
            r'\bdkim=(pass|fail|neutral|none|temperror|permerror)\b',
            result,
            re.IGNORECASE
        )

        dkim.extend(
            match.lower()
            for match in dkim_matches
        )


        # DMARC
        dmarc_matches = re.findall(
            r'\bdmarc=(pass|fail|softfail|neutral|none|temperror|permerror)\b',
            result,
            re.IGNORECASE
        )

        dmarc.extend(
            match.lower()
            for match in dmarc_matches
        )


    # If authentication result does not exist

    if not spf:
        spf = ["none"]

    if not dkim:
        dkim = ["none"]

    if not dmarc:
        dmarc = ["none"]


    # -----------------------------------------------------
    # Attachments
    # -----------------------------------------------------

    attachments = []


    for part in msg.walk():

        filename = part.get_filename()


        if filename:

            file_data = (
                part.get_payload(
                    decode=True
                )
                or b""
            )


            # SHA-256 hash
            sha256_hash = hashlib.sha256(
                file_data
            ).hexdigest()


            attachment = {

                "filename": filename,

                "content_type":
                    part.get_content_type(),

                "size":
                    len(file_data),

                "sha256":
                    sha256_hash
            }


            attachments.append(
                attachment
            )


    # -----------------------------------------------------
    # Final Structured Data
    # -----------------------------------------------------

    email_data = {

        "from": sender,

        "to": recipient,

        "cc": cc,

        "bcc": bcc,

        "subject": subject,

        "date": date,

        "reply_to": reply_to,

        "return_path": return_path,

        "message_id": message_id,

        "received": received,

        "origin_ip": IP,

        "geolocation": geolocation,

        "Content-type": content_type,

        "mime-version": mime_version,

        "authentication": {

            "spf": spf,

            "dkim": dkim,

            "dmarc": dmarc
        },

        "body": body,

        "urls": urls,

        "attachments": attachments
    }


    return email_data

