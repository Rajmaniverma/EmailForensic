
import os

from dotenv import load_dotenv
from google_auth_oauthlib.flow import Flow


load_dotenv()


# ============================================================
# GOOGLE OAUTH CREDENTIALS
# ============================================================

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")


if not GOOGLE_CLIENT_ID:
    raise ValueError(
        "GOOGLE_CLIENT_ID not found in environment variables"
    )

if not GOOGLE_CLIENT_SECRET:
    raise ValueError(
        "GOOGLE_CLIENT_SECRET not found in environment variables"
    )


# ============================================================
# GOOGLE SCOPES
# ============================================================

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
]


# ============================================================
# CREATE GOOGLE OAUTH FLOW
# ============================================================

def create_google_flow(state=None):

    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,

            "auth_uri":
                "https://accounts.google.com/o/oauth2/auth",

            "token_uri":
                "https://oauth2.googleapis.com/token",

            "redirect_uris": []
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        state=state
    )

    return flow
