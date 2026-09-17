import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from jose import jwt
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from Database import get_db
from DBmodel import GmailAccount

from Gmail_Auth import SCOPES

from Gmail_Parser import (
    parse_gmail_message,
    convert_gmail_to_email_data
)

from Detection_engine import analyze_email
from Phishing import Phising_email
from Social_Engineering import analyze_social_engineering
from IPGeolocation.IP_Geolocation import get_ip_intelligence


router = APIRouter()


# ============================================================
# CONFIGURATION
# ============================================================

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"


# ============================================================
# VALIDATE ENVIRONMENT
# ============================================================

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is not set")


# ============================================================
# GOOGLE SCOPES
# ============================================================

# Keep this consistent with Gmail_Auth.py
# If SCOPES is already defined there, we use that value.

GMAIL_SCOPES = SCOPES


# ============================================================
# HELPER: GET GMAIL CLIENT
# ============================================================

def get_gmail_client(
    request: Request,
    db: Session
):
    """
    Authenticate the user using JWT,
    retrieve the Google OAuth token from MySQL,
    and create an authenticated Gmail API client.

    IMPORTANT:
    - Gmail messages are NOT stored in MySQL.
    - Only GmailAccount contains the OAuth token.
    - Email content exists only temporarily during the request.
    """

    # --------------------------------------------------------
    # 1. GET JWT FROM AUTHORIZATION HEADER
    # --------------------------------------------------------

    authorization = request.headers.get("Authorization")

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )

    token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Empty authorization token"
        )

    # --------------------------------------------------------
    # 2. DECODE JWT
    # --------------------------------------------------------

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Authentication token expired"
        )

    except jwt.JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    # --------------------------------------------------------
    # 3. GET ACCOUNT ID
    # --------------------------------------------------------

    account_id = payload.get("account_id")

    if not account_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    # --------------------------------------------------------
    # 4. GET GMAIL ACCOUNT FROM DATABASE
    # --------------------------------------------------------

    account = (
        db.query(GmailAccount)
        .filter(GmailAccount.id == account_id)
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Gmail account not found"
        )

    # --------------------------------------------------------
    # 5. CHECK GOOGLE TOKEN
    # --------------------------------------------------------

    if not account.google_token:
        raise HTTPException(
            status_code=401,
            detail="Gmail account not connected"
        )

    # --------------------------------------------------------
    # 6. LOAD GOOGLE TOKEN
    # --------------------------------------------------------

    try:
        token_data = json.loads(account.google_token)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Invalid Google token stored in database"
        )

    if not isinstance(token_data, dict):
        raise HTTPException(
            status_code=500,
            detail="Invalid Google token format"
        )

    # --------------------------------------------------------
    # 7. CREATE GOOGLE CREDENTIALS
    # --------------------------------------------------------

    try:
        credentials = Credentials.from_authorized_user_info(
            token_data,
            GMAIL_SCOPES
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create Google credentials: {str(e)}"
        )

    # --------------------------------------------------------
    # 8. CREATE GMAIL CLIENT
    # --------------------------------------------------------

    try:
        gmail = build(
            "gmail",
            "v1",
            credentials=credentials,
            cache_discovery=False
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create Gmail client: {str(e)}"
        )

    return gmail, account


# ============================================================
# GET GMAIL MESSAGES
# ============================================================

@router.get("/messages")
def get_messages(
    request: Request,
    page_token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get Gmail inbox messages.

    IMPORTANT:
    - Does NOT save messages in MySQL.
    - Gmail remains the source of truth.
    - Only message_id and subject are returned.
    - Full email content is NOT fetched here.
    """

    # --------------------------------------------------------
    # 1. GET GMAIL CLIENT
    # --------------------------------------------------------

    gmail, account = get_gmail_client(
        request,
        db
    )

    # --------------------------------------------------------
    # 2. GMAIL LIST PARAMETERS
    # --------------------------------------------------------

    params = {
        "userId": "me",
        "maxResults": 10,
        "q": "in:inbox"
    }

    if page_token:
        params["pageToken"] = page_token

    # --------------------------------------------------------
    # 3. GET MESSAGE IDS
    # --------------------------------------------------------

    try:

        result = (
            gmail.users()
            .messages()
            .list(**params)
            .execute()
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Gmail messages: {str(e)}"
        )

    messages = result.get("messages", [])

    # --------------------------------------------------------
    # 4. NO MESSAGES
    # --------------------------------------------------------

    if not messages:

        return {
            "success": True,
            "messages": [],
            "next_page_token": result.get("nextPageToken"),
            "has_next": bool(
                result.get("nextPageToken")
            )
        }

    # --------------------------------------------------------
    # 5. TEMPORARY RESPONSE LIST
    # --------------------------------------------------------

    response_messages = []

    # --------------------------------------------------------
    # 6. CREATE GMAIL BATCH REQUEST
    # --------------------------------------------------------

    batch = gmail.new_batch_http_request()

    def process_message(
        request_id,
        response,
        exception
    ):

        if exception:

            print(
                f"Failed to fetch Gmail message "
                f"{request_id}: {exception}"
            )

            return

        # ----------------------------------------------------
        # Extract headers
        # ----------------------------------------------------

        headers = (
            response
            .get("payload", {})
            .get("headers", [])
        )

        subject = "(No Subject)"

        for header in headers:

            if (
                header.get("name", "").lower()
                == "subject"
            ):

                subject = header.get(
                    "value",
                    "(No Subject)"
                )

                break

        # ----------------------------------------------------
        # Add temporarily to response
        # ----------------------------------------------------

        response_messages.append(
            {
                "message_id": request_id,
                "name": subject
            }
        )

    # --------------------------------------------------------
    # 7. ADD MESSAGES TO BATCH
    # --------------------------------------------------------

    for msg in messages:

        message_id = msg.get("id")

        if not message_id:
            continue

        batch.add(
            gmail.users()
            .messages()
            .get(
                userId="me",
                id=message_id,
                format="metadata",
                metadataHeaders=["Subject"]
            ),
            callback=process_message,
            request_id=message_id
        )

    # --------------------------------------------------------
    # 8. EXECUTE BATCH
    # --------------------------------------------------------

    try:

        batch.execute()

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to fetch Gmail "
                f"message metadata: {str(e)}"
            )
        )

    # --------------------------------------------------------
    # 9. RETURN RESPONSE
    # --------------------------------------------------------

    return {
        "success": True,
        "messages": response_messages,
        "next_page_token": result.get(
            "nextPageToken"
        ),
        "has_next": bool(
            result.get("nextPageToken")
        )
    }


# ============================================================
# GET COMPLETE EMAIL
# ============================================================

@router.get("/message/{message_id}")
def get_email_by_message_id(
    message_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Fetch one complete Gmail email.

    The email is:
        Gmail
          ↓
        Backend
          ↓
        Parse
          ↓
        Frontend

    It is NOT stored in MySQL.
    """

    # --------------------------------------------------------
    # Validate message ID
    # --------------------------------------------------------

    if not message_id:
        raise HTTPException(
            status_code=400,
            detail="Message ID is required"
        )

    # --------------------------------------------------------
    # Get Gmail client
    # --------------------------------------------------------

    gmail, account = get_gmail_client(
        request,
        db
    )

    # --------------------------------------------------------
    # Fetch full Gmail message
    # --------------------------------------------------------

    try:

        gmail_msg = (
            gmail.users()
            .messages()
            .get(
                userId="me",
                id=message_id,
                format="full"
            )
            .execute()
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch email: {str(e)}"
        )

    # --------------------------------------------------------
    # Parse Gmail message
    # --------------------------------------------------------

    try:

        gmail_parsed = parse_gmail_message(
            gmail_msg
        )

        email_data = convert_gmail_to_email_data(
            gmail_parsed,
            gmail_msg
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse email: {str(e)}"
        )

    # --------------------------------------------------------
    # Return email
    # --------------------------------------------------------

    return {
        "success": True,
        "message_id": message_id,
        "email": email_data
    }


# ============================================================
# FULL EMAIL SECURITY ANALYSIS
# ============================================================

@router.get("/full-analysis/{message_id}")
def full_analysis(
    message_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Perform complete security analysis on one Gmail message.

    Pipeline:

        Gmail
          ↓
        Fetch email
          ↓
        Parse email
          ↓
        Feature extraction
          ↓
        ┌──────────────────────────┐
        │ Parallel analysis       │
        │                          │
        │ 1. Detection Engine      │
        │ 2. Phishing Detection    │
        │ 3. Social Engineering    │
        │ 4. IP Intelligence       │
        └──────────────────────────┘
          ↓
        Forensic Result
          ↓
        Frontend

    IMPORTANT:
    No analysis result is cached.
    No email content is stored in MySQL.
    """

    # --------------------------------------------------------
    # Validate message ID
    # --------------------------------------------------------

    if not message_id:

        raise HTTPException(
            status_code=400,
            detail="Message ID is required"
        )

    # --------------------------------------------------------
    # Get Gmail client
    # --------------------------------------------------------

    gmail, account = get_gmail_client(
        request,
        db
    )

    # --------------------------------------------------------
    # FETCH COMPLETE EMAIL
    # --------------------------------------------------------

    try:

        gmail_msg = (
            gmail.users()
            .messages()
            .get(
                userId="me",
                id=message_id,
                format="full"
            )
            .execute()
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch email: {str(e)}"
        )

    # --------------------------------------------------------
    # PARSE EMAIL
    # --------------------------------------------------------

    try:

        gmail_parsed = parse_gmail_message(
            gmail_msg
        )

        email_data = convert_gmail_to_email_data(
            gmail_parsed,
            gmail_msg
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse email: {str(e)}"
        )

    # ========================================================
    # ANALYSIS FUNCTIONS
    # ========================================================

    # --------------------------------------------------------
    # 1. Detection Engine
    # --------------------------------------------------------

    def run_detection():

        try:

            return analyze_email(
                email_data
            )

        except Exception as e:

            return {
                "success": False,
                "error": str(e)
            }

    # --------------------------------------------------------
    # 2. Phishing Detection
    # --------------------------------------------------------

    def run_phishing():

        try:

            return Phising_email(
                email_data
            )

        except Exception as e:

            return {
                "success": False,
                "error": str(e)
            }

    # --------------------------------------------------------
    # 3. Social Engineering
    # --------------------------------------------------------

    def run_social():

        try:

            social = analyze_social_engineering(
                email_data
            )

            # Pydantic v2
            if hasattr(
                social,
                "model_dump"
            ):

                social = social.model_dump()

            # Pydantic v1
            elif hasattr(
                social,
                "dict"
            ):

                social = social.dict()

            return social

        except Exception as e:

            return {
                "success": False,
                "error": str(e)
            }

    # --------------------------------------------------------
    # 4. IP Intelligence
    # --------------------------------------------------------

    def run_ip():

        try:

            origin_ip = email_data.get(
                "origin_ip"
            )

            if not origin_ip:

                return {
                    "success": False,
                    "message": "Origin IP not found"
                }

            return get_ip_intelligence(
                origin_ip
            )

        except Exception as e:

            return {
                "success": False,
                "error": str(e)
            }

    # ========================================================
    # RUN ALL ANALYSES IN PARALLEL
    # ========================================================

    try:

        with ThreadPoolExecutor(
            max_workers=4
        ) as executor:

            detection_future = (
                executor.submit(
                    run_detection
                )
            )

            phishing_future = (
                executor.submit(
                    run_phishing
                )
            )

            social_future = (
                executor.submit(
                    run_social
                )
            )

            ip_future = (
                executor.submit(
                    run_ip
                )
            )

            # ------------------------------------------------
            # Wait for results
            # ------------------------------------------------

            detection = (
                detection_future.result()
            )

            phishing = (
                phishing_future.result()
            )

            social = (
                social_future.result()
            )

            ip_data = (
                ip_future.result()
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

    # ========================================================
    # FINAL FORENSIC RESULT
    # ========================================================

    result = {

        "message_id": message_id,

        "email": email_data,

        "detection_engine": detection,

        "phishing": phishing,

        "social": social,

        "ip_tracing": ip_data
    }

    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {

        "success": True,

        "source": "new_analysis",

        "data": result
    }


# ============================================================
# OPTIONAL: HEALTH CHECK
# ============================================================

@router.get("/health")
def health_check():

    return {
        "success": True,
        "service": "Email Forensic API",
        "status": "running"
    }