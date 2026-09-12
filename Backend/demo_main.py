import os
from pydantic import BaseModel, Field

# =========================================
# LOCAL DEVELOPMENT ONLY
# =========================================
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware

# from Gmail_Auth import create_google_flow, get_gmail_service, is_authenticated
# from Gmail_Parser import parse_gmail_message, convert_gmail_to_email_data
from Email_parser import parse_email
from Detection_engine import analyze_email
from Phishing import Phising_email


app = FastAPI(title="Email Security Forensics API")


# =========================================
# SESSION MIDDLEWARE
# =========================================
app.add_middleware(
    SessionMiddleware,
    secret_key="emaildetect-development-session-secret-key",
    session_cookie="emaildetect_session",
    same_site="lax",
    https_only=False
)


# =========================================
# CORS MIDDLEWARE
# =========================================
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"chrome-extension://.*|http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================
# REQUEST MODELS
# =========================================
class GmailAnalyzeRequest(BaseModel):
    message_id: str = Field(..., min_length=1, description="Gmail Message ID")


# =========================================
# EML FILE UPLOAD ENDPOINT
# =========================================
@app.post("/")
async def upload_eml(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".eml"):
        raise HTTPException(
            status_code=400,
            detail="Only .eml files are supported"
        )

    content = await file.read()
    email_data = parse_email(content)
    analysis = analyze_email(email_data)
    phishing = Phising_email(email_data)

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "message": "EML file received successfully",
        "size": len(content),
        "Data": email_data,
        "analysis": analysis,
        "phishing": phishing
    }


# =========================================
# GOOGLE OAUTH LOGIN ENDPOINTS
# =========================================
# @app.get("/auth/login")
# @app.get("/auth/google")
# def google_login(request: Request):
#     flow = create_google_flow(redirect_uri="http://localhost:8000/auth/callback")
#     authorization_url, state = flow.authorization_url(
#         access_type="offline",
#         include_granted_scopes="true",
#         prompt="consent"
#     )

#     request.session["oauth_state"] = state
#     request.session["code_verifier"] = flow.code_verifier

#     return RedirectResponse(authorization_url)


# # =========================================
# # GOOGLE OAUTH CALLBACK ENDPOINTS
# # =========================================
# @app.get("/auth/callback")
# @app.get("/auth/google/callback")
# def google_callback(request: Request):
#     stored_state = request.session.get("oauth_state")
#     stored_verifier = request.session.get("code_verifier")

#     # Fallback to query params if session state lost
#     if not stored_state:
#         stored_state = request.query_params.get("state")

#     flow = create_google_flow(redirect_uri="http://localhost:8000/auth/callback")

#     if stored_state:
#         flow.state = stored_state
#     if stored_verifier:
#         flow.code_verifier = stored_verifier

#     try:
#         flow.fetch_token(authorization_response=str(request.url))
#     except Exception as e:
#         raise HTTPException(
#             status_code=400,
#             detail=f"OAuth authentication failed: {str(e)}"
#         )

#     credentials = flow.credentials

#     # Save credentials securely to token.json
#     base_dir = os.path.dirname(os.path.abspath(__file__))
#     token_path = os.path.join(base_dir, "token.json")
#     with open(token_path, "w") as token:
#         token.write(credentials.to_json())

#     request.session.pop("oauth_state", None)
#     request.session.pop("code_verifier", None)

#     return RedirectResponse("http://localhost:5173/?auth=success")


# # =========================================
# # OAUTH AUTHENTICATION STATUS ENDPOINT
# # =========================================
# @app.get("/auth/status")
# def auth_status():
#     authenticated, email = is_authenticated()
#     return {
#         "authenticated": authenticated,
#         "email": email
#     }


# # =========================================
# # GMAIL MESSAGE RETRIEVAL ENDPOINT
# # =========================================
# @app.get("/gmail/message/{message_id}")
# def get_gmail_message_details(message_id: str):
#     if not message_id or not message_id.strip():
#         raise HTTPException(status_code=400, detail="Invalid message ID")

#     try:
#         service = get_gmail_service()
#     except ValueError as err:
#         raise HTTPException(status_code=401, detail=str(err))

#     try:
#         raw_message = service.users().messages().get(
#             userId="me",
#             id=message_id,
#             format="full"
#         ).execute()
#     except Exception as e:
#         raise HTTPException(
#             status_code=404,
#             detail=f"Failed to retrieve message '{message_id}' from Gmail API: {str(e)}"
#         )

#     parsed_message = parse_gmail_message(raw_message)
#     return {
#         "success": True,
#         "message": parsed_message
#     }


# # =========================================
# # GMAIL EMAIL ANALYZE ENDPOINT
# # =========================================
# @app.post("/gmail/analyze")
# def analyze_gmail_email(req: GmailAnalyzeRequest):
#     message_id = req.message_id.strip()
#     if not message_id:
#         raise HTTPException(status_code=400, detail="Invalid or empty Gmail message ID")

#     try:
#         service = get_gmail_service()
#     except ValueError as err:
#         raise HTTPException(status_code=401, detail=str(err))

#     try:
#         raw_message = service.users().messages().get(
#             userId="me",
#             id=message_id,
#             format="full"
#         ).execute()
#     except Exception as e:
#         raise HTTPException(
#             status_code=404,
#             detail=f"Failed to fetch Gmail message '{message_id}'. Ensure the ID is valid and accessible."
#         )

#     # Parse Gmail MIME payload
#     parsed_gmail = parse_gmail_message(raw_message)

#     # Convert to email_data format expected by email analyzer pipeline
#     email_data = convert_gmail_to_email_data(parsed_gmail, raw_message)

#     # Execute existing email analysis pipeline
#     analysis = analyze_email(email_data)
#     phishing = Phising_email(email_data)

#     return {
#         "success": True,
#         "message_id": message_id,
#         "email": {
#             "sender": parsed_gmail.get("sender"),
#             "to": parsed_gmail.get("to"),
#             "cc": parsed_gmail.get("cc"),
#             "bcc": parsed_gmail.get("bcc"),
#             "subject": parsed_gmail.get("subject"),
#             "date": parsed_gmail.get("date"),
#             "body": email_data.get("body"),
#             "attachments": parsed_gmail.get("attachments", [])
#         },
#         "Data": email_data,
#         "analysis": analysis,
#         "phishing": phishing
#     }
