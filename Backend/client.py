
import base64
import re
from email.header import decode_header, make_header

from googleapiclient.discovery import build




class GmailClient:
    """
    Gmail API client for manually analyzing a selected Gmail email.

    Flow:

        message_id
            ↓
        Gmail API
            ↓
        Full Gmail message
            ↓
        Parse headers/body
            ↓
        Return clean email data
    """

    def __init__(self):
        # Get OAuth credentials from auth.py
        creds = get_credentials()

        # Create Gmail API service
        self.service = build(
            "gmail",
            "v1",
            credentials=creds
        )

    # ========================================================
    # GET EMAIL BY GMAIL API MESSAGE ID
    # ========================================================

    def get_message(self, message_id: str) -> dict:
        """
        Fetch one Gmail message using its Gmail API message ID.

        Example:

            message_id = "18abc123xyz"

        Returns a clean dictionary containing:
            - Gmail message ID
            - thread ID
            - sender
            - recipients
            - subject
            - date
            - body
            - HTML
            - headers
            - attachments
        """

        if not message_id:
            raise ValueError(
                "Gmail message ID is required."
            )

        try:
            raw_message = (
                self.service
                .users()
                .messages()
                .get(
                    userId="me",
                    id=message_id,
                    format="full"
                )
                .execute()
            )

        except Exception as exc:
            raise RuntimeError(
                f"Failed to fetch Gmail message "
                f"'{message_id}': {exc}"
            ) from exc

        return self._parse_message(raw_message)

    # ========================================================
    # PARSE GMAIL MESSAGE
    # ========================================================

    def _parse_message(self, raw: dict) -> dict:
        """
        Convert Gmail API response into a simple dictionary.
        """

        if not raw:
            raise ValueError(
                "Empty Gmail API response."
            )

        gmail_id = raw.get("id", "")

        thread_id = raw.get(
            "threadId",
            ""
        )

        payload = raw.get(
            "payload",
            {}
        )

        headers = payload.get(
            "headers",
            []
        )

        # ----------------------------------------------------
        # Headers
        # ----------------------------------------------------

        sender = self._get_header(
            headers,
            "From"
        )

        recipients = self._get_header(
            headers,
            "To"
        )

        cc = self._get_header(
            headers,
            "Cc"
        )

        bcc = self._get_header(
            headers,
            "Bcc"
        )

        subject = self._get_header(
            headers,
            "Subject"
        )

        date = self._get_header(
            headers,
            "Date"
        )

        reply_to = self._get_header(
            headers,
            "Reply-To"
        )

        return_path = self._get_header(
            headers,
            "Return-Path"
        )

        rfc_message_id = self._get_header(
            headers,
            "Message-ID"
        )

        mime_version = self._get_header(
            headers,
            "MIME-Version"
        )

        # ----------------------------------------------------
        # Body
        # ----------------------------------------------------

        body_text, body_html, attachments = (
            self._extract_body(payload)
        )

        # ----------------------------------------------------
        # If plain text does not exist,
        # convert HTML to readable text
        # ----------------------------------------------------

        if not body_text and body_html:

            body_text = self._html_to_text(
                body_html
            )

        # ----------------------------------------------------
        # URLs
        # ----------------------------------------------------

        urls = self._extract_urls(
            body_text,
            body_html
        )

        # ----------------------------------------------------
        # Authentication headers
        # ----------------------------------------------------

        authentication = (
            self._extract_authentication(
                headers
            )
        )

        # ----------------------------------------------------
        # Received headers
        # ----------------------------------------------------

        received = self._get_all_headers(
            headers,
            "Received"
        )

        # ----------------------------------------------------
        # Final result
        # ----------------------------------------------------

        return {

            # Gmail API ID
            "gmail_id": gmail_id,

            # Gmail thread ID
            "thread_id": thread_id,

            # RFC Message-ID
            "message_id": rfc_message_id,

            "sender": sender,

            "recipients": recipients,

            "cc": cc,

            "bcc": bcc,

            "subject": subject,

            "date": date,

            "reply_to": reply_to,

            "return_path": return_path,

            "mime_version": mime_version,

            "received": received,

            "authentication": authentication,

            "body_text": body_text,

            "body_html": body_html,

            "urls": urls,

            "attachments": attachments,

            "label_ids": raw.get(
                "labelIds",
                []
            )
        }

    # ========================================================
    # HEADER FUNCTIONS
    # ========================================================

    @staticmethod
    def _get_header(
        headers: list,
        name: str,
        default: str = ""
    ) -> str:
        """
        Get one email header.
        """

        target = name.lower()

        for header in headers:

            if (
                header.get("name", "")
                .lower()
                == target
            ):

                value = header.get(
                    "value",
                    ""
                )

                return GmailClient._decode_header(
                    value
                )

        return default

    @staticmethod
    def _get_all_headers(
        headers: list,
        name: str
    ) -> list:
        """
        Get all occurrences of a header.

        Useful for:
            Received
            Authentication-Results
        """

        target = name.lower()

        values = []

        for header in headers:

            if (
                header.get("name", "")
                .lower()
                == target
            ):

                value = header.get(
                    "value",
                    ""
                )

                if value:
                    values.append(value)

        return values

    @staticmethod
    def _decode_header(
        value: str
    ) -> str:
        """
        Decode RFC-2047 encoded email headers.
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

            return value

    # ========================================================
    # BODY EXTRACTION
    # ========================================================

    def _extract_body(
        self,
        payload: dict
    ) -> tuple[str, str, list]:
        """
        Recursively extract:

            text/plain
            text/html
            attachments

        from Gmail MIME structure.
        """

        plain_parts = []

        html_parts = []

        attachments = []

        def walk(part: dict):

            mime_type = (
                part.get("mimeType")
                or ""
            ).lower()

            filename = (
                part.get("filename")
                or ""
            )

            body = (
                part.get("body")
                or {}
            )

            data = body.get(
                "data"
            )

            attachment_id = body.get(
                "attachmentId",
                ""
            )

            size = body.get(
                "size",
                0
            )

            # ------------------------------------------------
            # Plain text
            # ------------------------------------------------

            if mime_type == "text/plain":

                if data:

                    text = (
                        self._decode_base64url(
                            data
                        )
                    )

                    if text:
                        plain_parts.append(
                            text
                        )

            # ------------------------------------------------
            # HTML
            # ------------------------------------------------

            elif mime_type == "text/html":

                if data:

                    html = (
                        self._decode_base64url(
                            data
                        )
                    )

                    if html:
                        html_parts.append(
                            html
                        )

            # ------------------------------------------------
            # Attachment
            # ------------------------------------------------

            elif filename:

                attachments.append({

                    "filename": filename,

                    "content_type":
                        mime_type
                        or "application/octet-stream",

                    "size": size,

                    "attachment_id":
                        attachment_id
                })

            # ------------------------------------------------
            # Recursively process MIME children
            # ------------------------------------------------

            for child in (
                part.get("parts")
                or []
            ):

                walk(child)

        walk(payload)

        body_text = "\n".join(
            plain_parts
        ).strip()

        body_html = "\n".join(
            html_parts
        ).strip()

        return (
            body_text,
            body_html,
            attachments
        )

    # ========================================================
    # BASE64URL DECODER
    # ========================================================

    @staticmethod
    def _decode_base64url(
        data: str
    ) -> str:
        """
        Decode Gmail API Base64URL body data.
        """

        if not data:
            return ""

        try:

            # Gmail uses URL-safe Base64.
            data = data.replace(
                "-",
                "+"
            ).replace(
                "_",
                "/"
            )

            # Add correct padding.
            data += "=" * (
                -len(data) % 4
            )

            decoded = base64.b64decode(
                data
            )

            return decoded.decode(
                "utf-8",
                errors="replace"
            )

        except Exception:

            return ""

    # ========================================================
    # HTML → TEXT
    # ========================================================

    @staticmethod
    def _html_to_text(
        html: str
    ) -> str:
        """
        Basic HTML-to-text conversion.
        """

        if not html:
            return ""

        # Remove script
        html = re.sub(
            r"<script.*?</script>",
            " ",
            html,
            flags=re.IGNORECASE | re.DOTALL
        )

        # Remove style
        html = re.sub(
            r"<style.*?</style>",
            " ",
            html,
            flags=re.IGNORECASE | re.DOTALL
        )

        # Remove tags
        text = re.sub(
            r"<[^>]+>",
            " ",
            html
        )

        # Normalize whitespace
        text = re.sub(
            r"\s+",
            " ",
            text
        )

        return text.strip()

    # ========================================================
    # URL EXTRACTION
    # ========================================================

    @staticmethod
    def _extract_urls(
        body_text: str,
        body_html: str
    ) -> list:
        """
        Extract URLs from plain text and HTML.
        """

        urls = []

        if body_text:

            urls.extend(
                re.findall(
                    r'https?://[^\s<>"\']+',
                    body_text,
                    re.IGNORECASE
                )
            )

        if body_html:

            # href URLs
            urls.extend(
                re.findall(
                    r'href\s*=\s*["\']'
                    r'(https?://[^"\']+)'
                    r'["\']',
                    body_html,
                    re.IGNORECASE
                )
            )

            # Raw URLs
            urls.extend(
                re.findall(
                    r'https?://[^\s<>"\']+',
                    body_html,
                    re.IGNORECASE
                )
            )

        cleaned = []

        for url in urls:

            url = url.rstrip(
                ".,;:!?)]}>"
            )

            if (
                url
                and url not in cleaned
            ):
                cleaned.append(url)

        return cleaned

    # ========================================================
    # SPF / DKIM / DMARC
    # ========================================================

    @staticmethod
    def _extract_authentication(
        headers: list
    ) -> dict:
        """
        Extract SPF, DKIM and DMARC results
        from Authentication-Results headers.
        """

        results = GmailClient._get_all_headers(
            headers,
            "Authentication-Results"
        )

        spf = []

        dkim = []

        dmarc = []

        for result in results:

            spf.extend(
                x.lower()
                for x in re.findall(
                    r"\bspf\s*=\s*"
                    r"(pass|fail|softfail|neutral|"
                    r"none|temperror|permerror)\b",
                    result,
                    re.IGNORECASE
                )
            )

            dkim.extend(
                x.lower()
                for x in re.findall(
                    r"\bdkim\s*=\s*"
                    r"(pass|fail|neutral|"
                    r"none|temperror|permerror)\b",
                    result,
                    re.IGNORECASE
                )
            )

            dmarc.extend(
                x.lower()
                for x in re.findall(
                    r"\bdmarc\s*=\s*"
                    r"(pass|fail|softfail|neutral|"
                    r"none|temperror|permerror)\b",
                    result,
                    re.IGNORECASE
                )
            )

        return {

            "spf": spf or ["none"],

            "dkim": dkim or ["none"],

            "dmarc": dmarc or ["none"]
        }

