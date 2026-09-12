from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import ipaddress
import re

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

creds = Credentials.from_authorized_user_file(
    "token.json",
    SCOPES
)

gmail = build("gmail", "v1", credentials=creds)

result = gmail.users().messages().list(
    userId="me",
    maxResults=10,
    q="in:inbox"
).execute()

messages = result.get("messages", [])

for i, msg in enumerate(messages, 1):
    email = gmail.users().messages().get(
        userId="me",
        id=msg["id"],
        format="full",
        metadataHeaders=["From", "Subject", "Date"]
    ).execute()

    print(f"\n===== {i} =====")
    print("ID:", email["id"])
    

    for header in email["payload"]["headers"]:
        if header["name"] in ["From", "Subject", "Date"]:
            print(f"{header['name']}: {header['value']}")
           
            

def extract_ips(email):
    ips = []

    for header in email["payload"]["headers"]:
        if header["name"].lower() == "received":

            value = header["value"]

            # Find IPv4 addresses
            candidates = re.findall(
                r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
                value
            )

            for candidate in candidates:
                try:
                    ip = ipaddress.ip_address(candidate)

                    if ip.version == 4 and str(ip) not in ips:
                        ips.append(str(ip))

                except ValueError:
                    pass

    return ips

print(extract_ips(email))
