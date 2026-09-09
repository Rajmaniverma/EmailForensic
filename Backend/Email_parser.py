from email import policy
from email.parser import BytesParser
import re
import hashlib


# ---------------------------------------------------------
# Parse Email
# ---------------------------------------------------------

def parse_email(file_path):

    # Read .eml file
    with open(file_path, "rb") as file:
        email_content = file.read()

    # Parse email
    msg = BytesParser(policy=policy.default).parsebytes(email_content)




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

    # -----------------------------------------------------
    # Email Body
    # -----------------------------------------------------

    body_part = msg.get_body(preferencelist=("plain", "html"))

    if body_part:
        body = body_part.get_content()
    else:
        body = None

    # -----------------------------------------------------
    # Extract URLs
    # -----------------------------------------------------

    urls = []

    if body:
        url_pattern = r'https?://[^\s<>"\']+'
        urls = re.findall(url_pattern, body)

    # -----------------------------------------------------
    # Authentication Results
    # SPF / DKIM / DMARC
    # -----------------------------------------------------

    auth_results = msg.get_all("Authentication-Results", [])

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

        spf.extend(match.lower() for match in spf_matches)

        # DKIM
        dkim_matches = re.findall(
            r'\bdkim=(pass|fail|neutral|none|temperror|permerror)\b',
            result,
            re.IGNORECASE
        )

        dkim.extend(match.lower() for match in dkim_matches)

        # DMARC
        dmarc_matches = re.findall(
            r'\bdmarc=(pass|fail|softfail|neutral|none|temperror|permerror)\b',
            result,
            re.IGNORECASE
        )

        dmarc.extend(match.lower() for match in dmarc_matches)

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

            file_data = part.get_payload(decode=True) or b""

            # SHA-256 hash
            sha256_hash = hashlib.sha256(file_data).hexdigest()

            attachment = {
                "filename": filename,
                "content_type": part.get_content_type(),
                "size": len(file_data),
                "sha256": sha256_hash
            }

            attachments.append(attachment)

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

        "Content-type":content_type,
        "mime-version":mime_version,

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


# ---------------------------------------------------------
# Run Parser
# ---------------------------------------------------------

if __name__ == "__main__":

    file_path = "Requirement/Email.eml"

    email_data = parse_email(file_path)

    print("\n========== EMAIL INFORMATION ==========\n")

    print("From:", email_data["from"])
    print("To:", email_data["to"])
    print("CC:", email_data["cc"])
    print("BCC:", email_data["bcc"])
    print("Subject:", email_data["subject"])
    print("Date:", email_data["date"])
    print("Reply-To:", email_data["reply_to"])
    print("Return-Path:", email_data["return_path"])
    print("Message-ID:", email_data["message_id"])

    print("\n========== RECEIVED HEADERS ==========\n")

    for header in email_data["received"]:
        print(header)

    print("\n========== AUTHENTICATION ==========\n")

    print("SPF:", email_data["authentication"]["spf"])
    print("DKIM:", email_data["authentication"]["dkim"])
    print("DMARC:", email_data["authentication"]["dmarc"])

    print("\n========== BODY ==========\n")

    print(email_data["body"])

    print("\n========== URLS ==========\n")

    for url in email_data["urls"]:
        print(url)
    print("\n===========Content type =============")
    

    print("Content-Type:",email_data["Content-type"])

    print("\n ========Mime version =========")
   

    print("Mime ", email_data[ "mime-version"])


    print("\n========== ATTACHMENTS ==========\n")

    if email_data["attachments"]:

        for attachment in email_data["attachments"]:
            print("Filename:", attachment["filename"])
            print("Content Type:", attachment["content_type"])
            print("Size:", attachment["size"], "bytes")
            print("SHA-256:", attachment["sha256"])
            print()

    else:
        print("No attachments found.")