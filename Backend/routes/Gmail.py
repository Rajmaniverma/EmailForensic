import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from jose import jwt
from cachetools import TTLCache

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


# ============================================================
# ROUTER
# ============================================================

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
    raise RuntimeError(
        "JWT_SECRET environment variable is not set"
    )


# ============================================================
# GOOGLE SCOPES
# ============================================================

# Use the SCOPES defined in Gmail_Auth.py
GMAIL_SCOPES = SCOPES


# ============================================================
# TEMPORARY ANALYSIS CACHE
# ============================================================

"""
Temporary in-memory cache.

TTL:
    1800 seconds = 30 minutes

Maximum entries:
    100

IMPORTANT:
    This cache is NOT MySQL storage.

    Email analysis results are kept temporarily
    in application memory and automatically expire
    after 30 minutes.
"""

analysis_cache = TTLCache(
    maxsize=100,
    ttl=1800
)


# ============================================================
# GET GMAIL CLIENT
# ============================================================

def get_gmail_client(
    request: Request,
    db: Session
):
    """
    Authenticate user using JWT.

    Then:
        JWT
         ↓
        account_id
         ↓
        GmailAccount
         ↓
        google_token
         ↓
        Gmail API client

    Gmail messages are NOT stored in MySQL.
    """

    # ========================================================
    # 1. GET JWT FROM AUTHORIZATION HEADER
    # ========================================================

    authorization = request.headers.get(
        "Authorization"
    )

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )

    if not authorization.startswith(
        "Bearer "
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )

    token = authorization.split(
        " ",
        1
    )[1].strip()

    if not token:

        raise HTTPException(
            status_code=401,
            detail="Empty authorization token"
        )

    # ========================================================
    # 2. DECODE JWT
    # ========================================================

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

    # ========================================================
    # 3. GET ACCOUNT ID
    # ========================================================

    account_id = payload.get(
        "account_id"
    )

    if not account_id:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    # ========================================================
    # 4. GET GMAIL ACCOUNT
    # ========================================================

    account = (
        db.query(GmailAccount)
        .filter(
            GmailAccount.id == account_id
        )
        .first()
    )

    if not account:

        raise HTTPException(
            status_code=404,
            detail="Gmail account not found"
        )

    # ========================================================
    # 5. CHECK GOOGLE TOKEN
    # ========================================================

    if not account.google_token:

        raise HTTPException(
            status_code=401,
            detail="Gmail account not connected"
        )

    # ========================================================
    # 6. LOAD GOOGLE TOKEN
    # ========================================================

    try:

        token_data = json.loads(
            account.google_token
        )

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="Invalid Google token stored in database"
        )

    if not isinstance(
        token_data,
        dict
    ):

        raise HTTPException(
            status_code=500,
            detail="Invalid Google token format"
        )

    # ========================================================
    # 7. CREATE GOOGLE CREDENTIALS
    # ========================================================

    try:

        credentials = (
            Credentials.from_authorized_user_info(
                token_data,
                GMAIL_SCOPES
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to create Google credentials: "
                f"{str(e)}"
            )
        )

    # ========================================================
    # 8. CREATE GMAIL CLIENT
    # ========================================================

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
            detail=(
                "Failed to create Gmail client: "
                f"{str(e)}"
            )
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
        Gmail messages are NOT stored in MySQL.

    Only temporary response data is created:

        message_id
        subject
    """

    # ========================================================
    # 1. GET GMAIL CLIENT
    # ========================================================

    gmail, account = get_gmail_client(
        request,
        db
    )

    # ========================================================
    # 2. GMAIL LIST PARAMETERS
    # ========================================================

    params = {
        "userId": "me",
        "maxResults": 10,
        "q": "in:inbox"
    }

    if page_token:

        params["pageToken"] = page_token

    # ========================================================
    # 3. GET MESSAGE IDS
    # ========================================================

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
            detail=(
                "Failed to fetch Gmail messages: "
                f"{str(e)}"
            )
        )

    messages = result.get(
        "messages",
        []
    )

    # ========================================================
    # 4. NO MESSAGES
    # ========================================================

    if not messages:

        return {
            "success": True,
            "messages": [],
            "next_page_token": (
                result.get(
                    "nextPageToken"
                )
            ),
            "has_next": bool(
                result.get(
                    "nextPageToken"
                )
            )
        }

    # ========================================================
    # 5. TEMPORARY RESPONSE LIST
    # ========================================================

    response_messages = []

    # ========================================================
    # 6. CREATE GMAIL BATCH REQUEST
    # ========================================================

    batch = gmail.new_batch_http_request()

    def process_message(
        request_id,
        response,
        exception
    ):

        # ----------------------------------------------------
        # Handle individual Gmail request error
        # ----------------------------------------------------

        if exception:

            print(
                f"Failed to fetch Gmail message "
                f"{request_id}: {exception}"
            )

            return

        # ----------------------------------------------------
        # Get headers
        # ----------------------------------------------------

        headers = (
            response
            .get(
                "payload",
                {}
            )
            .get(
                "headers",
                []
            )
        )

        subject = "(No Subject)"

        # ----------------------------------------------------
        # Find Subject
        # ----------------------------------------------------

        for header in headers:

            if (
                header
                .get(
                    "name",
                    ""
                )
                .lower()
                == "subject"
            ):

                subject = header.get(
                    "value",
                    "(No Subject)"
                )

                break

        # ----------------------------------------------------
        # Add temporary response
        # ----------------------------------------------------

        response_messages.append(
            {
                "message_id": request_id,
                "name": subject
            }
        )

    # ========================================================
    # 7. ADD MESSAGES TO BATCH
    # ========================================================

    for msg in messages:

        message_id = msg.get(
            "id"
        )

        if not message_id:
            continue

        batch.add(
            gmail.users()
            .messages()
            .get(
                userId="me",
                id=message_id,
                format="metadata",
                metadataHeaders=[
                    "Subject"
                ]
            ),
            callback=process_message,
            request_id=message_id
        )

    # ========================================================
    # 8. EXECUTE BATCH
    # ========================================================

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

    # ========================================================
    # 9. RETURN MESSAGES
    # ========================================================

    return {
        "success": True,

        "messages": response_messages,

        "next_page_token": (
            result.get(
                "nextPageToken"
            )
        ),

        "has_next": bool(
            result.get(
                "nextPageToken"
            )
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
    Fetch complete Gmail email.

    This endpoint does NOT perform analysis.

    It only:

        Gmail
          ↓
        Fetch full email
          ↓
        Parse
          ↓
        Return email data

    No GmailMessage database storage.
    """

    # ========================================================
    # 1. VALIDATE MESSAGE ID
    # ========================================================

    if not message_id:

        raise HTTPException(
            status_code=400,
            detail="Message ID is required"
        )

    # ========================================================
    # 2. GET GMAIL CLIENT
    # ========================================================

    gmail, account = get_gmail_client(
        request,
        db
    )

    # ========================================================
    # 3. FETCH FULL EMAIL
    # ========================================================

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
            detail=(
                "Failed to fetch email: "
                f"{str(e)}"
            )
        )

    # ========================================================
    # 4. PARSE EMAIL
    # ========================================================

    try:

        gmail_parsed = (
            parse_gmail_message(
                gmail_msg
            )
        )

        email_data = (
            convert_gmail_to_email_data(
                gmail_parsed,
                gmail_msg
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to parse email: "
                f"{str(e)}"
            )
        )

    # ========================================================
    # 5. RETURN EMAIL
    # ========================================================

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
    Perform complete security analysis.

    Flow:

        Gmail
          ↓
        Fetch email
          ↓
        Parse email
          ↓
        Check cache
          ↓
        ┌──────────────────────┐
        │ Cache HIT            │
        │                      │
        │ Return immediately   │
        └──────────────────────┘

                 OR

        ┌──────────────────────┐
        │ Cache MISS           │
        │                      │
        │ Run 4 analyses       │
        └──────────────────────┘
                  ↓
        Store result in cache
                  ↓
             Return result

    Cache:
        30 minutes
    """

    # ========================================================
    # 1. VALIDATE MESSAGE ID
    # ========================================================

    if not message_id:

        raise HTTPException(
            status_code=400,
            detail="Message ID is required"
        )

    # ========================================================
    # 2. GET GMAIL CLIENT
    # ========================================================

    gmail, account = get_gmail_client(
        request,
        db
    )

    # ========================================================
    # 3. CREATE UNIQUE CACHE KEY
    # ========================================================

    """
    Include account ID.

    Example:

        account 1 + message 123
        account 2 + message 123

    are treated as different cache entries.
    """

    cache_key = (
        f"{account.id}:{message_id}"
    )

    # ========================================================
    # 4. CHECK CACHE FIRST
    # ========================================================

    cached_result = analysis_cache.get(
        cache_key
    )

    if cached_result is not None:

        print(
            f"[CACHE HIT] {cache_key}"
        )

        return {
            "success": True,

            "source": "cache",

            "cached": True,

            "cache_ttl": "30 minutes",

            "data": cached_result
        }

    # ========================================================
    # CACHE MISS
    # ========================================================

    print(
        f"[CACHE MISS] {cache_key}"
    )

    # ========================================================
    # 5. FETCH COMPLETE EMAIL
    # ========================================================

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
            detail=(
                "Failed to fetch email: "
                f"{str(e)}"
            )
        )

    # ========================================================
    # 6. PARSE EMAIL
    # ========================================================

    try:

        gmail_parsed = (
            parse_gmail_message(
                gmail_msg
            )
        )

        email_data = (
            convert_gmail_to_email_data(
                gmail_parsed,
                gmail_msg
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to parse email: "
                f"{str(e)}"
            )
        )

    # ========================================================
    # 7. DETECTION ENGINE
    # ========================================================

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

    # ========================================================
    # 8. PHISHING DETECTION
    # ========================================================

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

    # ========================================================
    # 9. SOCIAL ENGINEERING
    # ========================================================

    def run_social():

        try:

            social = (
                analyze_social_engineering(
                    email_data
                )
            )

            # ------------------------------------------------
            # Pydantic v2
            # ------------------------------------------------

            if hasattr(
                social,
                "model_dump"
            ):

                social = (
                    social.model_dump()
                )

            # ------------------------------------------------
            # Pydantic v1
            # ------------------------------------------------

            elif hasattr(
                social,
                "dict"
            ):

                social = (
                    social.dict()
                )

            return social

        except Exception as e:

            return {
                "success": False,
                "error": str(e)
            }

    # ========================================================
    # 10. IP INTELLIGENCE
    # ========================================================

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
    # 11. RUN ALL ANALYSES IN PARALLEL
    # ========================================================

    try:

        with ThreadPoolExecutor(
            max_workers=4
        ) as executor:

            # ------------------------------------------------
            # Submit all analysis jobs
            # ------------------------------------------------

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
            # Get results
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
            detail=(
                "Analysis failed: "
                f"{str(e)}"
            )
        )

    # ========================================================
    # 12. CREATE FORENSIC RESULT
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
    # 13. STORE RESULT IN 30-MINUTE CACHE
    # ========================================================

    analysis_cache[
        cache_key
    ] = result

    print(
        f"[CACHE SET] {cache_key}"
    )

    # ========================================================
    # 14. RETURN NEW ANALYSIS
    # ========================================================

    return {

        "success": True,

        "source": "new_analysis",

        "cached": False,

        "cache_ttl": "30 minutes",

        "data": result
    }


# ============================================================
# CLEAR ANALYSIS CACHE
# ============================================================

@router.delete("/analysis-cache")
def clear_analysis_cache():

    """
    Clear all temporary analysis results.

    Useful during development/testing.

    Do not expose this endpoint publicly without
    proper admin authentication.
    """

    analysis_cache.clear()

    return {
        "success": True,
        "message": "Analysis cache cleared"
    }


# ============================================================
# CACHE STATUS
# ============================================================

@router.get("/analysis-cache/status")
def analysis_cache_status():

    """
    Return cache information.

    Does NOT return email content.
    """

    return {

        "success": True,

        "cache_enabled": True,

        "ttl_seconds": 1800,

        "ttl_minutes": 30,

        "max_entries": 100,

        "current_entries": len(
            analysis_cache
        )
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@router.get("/health")
def health_check():

    return {

        "success": True,

        "service": "Email Forensic API",

        "status": "running"
    }