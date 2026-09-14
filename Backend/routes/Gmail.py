import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from jose import jwt
from cachetools import TTLCache
from sqlalchemy.dialects.mysql import insert
from typing import Optional

from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from IPGeolocation.IP_Geolocation import get_ip_intelligence
from Database import get_db
from DBmodel import GmailAccount, GmailMessage
from Gmail_Auth import SCOPES

from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from Detection_engine import analyze_email
from Database import get_db
from DBmodel import GmailAccount, GmailMessage
from Phishing import Phising_email
from Gmail_Parser import (
    parse_gmail_message,
    convert_gmail_to_email_data
)
from Social_Engineering import analyze_social_engineering


router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
# =========================================
# GOOGLE SCOPES
# =========================================
analysis_cache = TTLCache(
    maxsize=100,
    ttl=1800
)

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly"
]


# =========================================
# GET GMAIL CLIENT
# =========================================




# =========================================
# SAVE ONE MESSAGE MANUALLY
# =========================================

from sqlalchemy.dialects.mysql import insert


@router.post("/message")
def save_message(
    message_id: str,
    name: str,
    request: Request,
    db: Session = Depends(get_db)
):

    account_id = request.session.get("gmail_account_id")

    if not account_id:
        raise HTTPException(
            status_code=401,
            detail="Gmail account not connected"
        )

    # -------------------------------------
    # Verify Gmail account
    # -------------------------------------

    account = db.query(GmailAccount).filter(
        GmailAccount.id == account_id
    ).first()

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Gmail account not found"
        )

    # -------------------------------------
    # INSERT or UPDATE message
    # -------------------------------------

    stmt = insert(GmailMessage).values(
        gmail_account_id=account.id,
        message_id=message_id,
        name=name
    )

    stmt = stmt.on_duplicate_key_update(
        name=stmt.inserted.name
    )

    db.execute(stmt)
    db.commit()

    return {
        "message": "Gmail message saved/updated",
        "message_id": message_id,
        "name": name
    }
# =========================================
# SYNC LATEST 100 GMAIL MESSAGES
# =========================================
@router.get("/refresh")
def refresh_messages(
    request: Request,
    db: Session = Depends(get_db)
):

    # --------------------------------------------
    # Get Gmail client
    # --------------------------------------------

    gmail, account = get_gmail_client(
        request,
        db
    )

    # --------------------------------------------
    # Get latest 10 inbox messages
    # --------------------------------------------

    try:

        result = (
            gmail.users()
            .messages()
            .list(
                userId="me",
                maxResults=10,
                q="in:inbox"
            )
            .execute()
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Gmail messages: {str(e)}"
        )

    messages = result.get(
        "messages",
        []
    )

    new_messages = []

    # ========================================================
    # PROCESS ONLY 10 MESSAGES
    # ========================================================

    for msg in messages:

        message_id = msg["id"]

        # --------------------------------------------
        # Check if message already exists
        # --------------------------------------------

        existing = (
            db.query(GmailMessage)
            .filter(
                GmailMessage.gmail_account_id == account.id,
                GmailMessage.message_id == message_id
            )
            .first()
        )

        # Already exists → don't insert again
        if existing:

            continue

        # --------------------------------------------
        # Get Subject
        # --------------------------------------------

        try:

            email = (
                gmail.users()
                .messages()
                .get(
                    userId="me",
                    id=message_id,
                    format="metadata",
                    metadataHeaders=["Subject"]
                )
                .execute()
            )

        except Exception as e:

            print(
                f"Failed to fetch message "
                f"{message_id}: {e}"
            )

            continue

        # --------------------------------------------
        # Extract headers
        # --------------------------------------------

        headers = (
            email
            .get("payload", {})
            .get("headers", [])
        )

        subject = "(No Subject)"

        for header in headers:

            if header["name"].lower() == "subject":

                subject = header["value"]

                break

        # --------------------------------------------
        # Save new message
        # --------------------------------------------

        new_message = GmailMessage(
            gmail_account_id=account.id,
            message_id=message_id,
            name=subject
        )

        db.add(new_message)

        new_messages.append({
            "message_id": message_id,
            "name": subject
        })

    # ========================================================
    # COMMIT
    # ========================================================

    try:

        db.commit()

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save messages: {str(e)}"
        )

    # ========================================================
    # GET LATEST 10 FROM DATABASE
    # ========================================================

    latest_messages = (
        db.query(GmailMessage)
        .filter(
            GmailMessage.gmail_account_id == account.id
        )
        .order_by(
            GmailMessage.id.desc()
        )
        .limit(10)
        .all()
    )

    return {
        "success": True,
        "message": "Gmail refreshed successfully",

        # Number of actually new emails
        "new_count": len(new_messages),

        # Latest 10 emails
        "messages": [
            {
                "message_id": message.message_id,
                "name": message.name
            }
            for message in latest_messages
        ]
    }
@router.get("/messages")
def get_messages(
    request: Request,
    page_token: Optional[str] = None,
    db: Session = Depends(get_db)
):

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
            detail=f"Failed to fetch Gmail messages: {str(e)}"
        )

    messages = result.get("messages", [])

    response_messages = []

    # ========================================================
    # 4. IF NO MESSAGES
    # ========================================================

    if not messages:

        return {
            "success": True,
            "messages": [],
            "next_page_token": result.get("nextPageToken"),
            "has_next": bool(
                result.get("nextPageToken")
            )
        }

    # ========================================================
    # 5. CREATE BATCH REQUEST
    # ========================================================

    batch = gmail.new_batch_http_request()

    def process_message(request_id, response, exception):

        if exception:

            print(
                f"Failed to fetch Gmail message "
                f"{request_id}: {exception}"
            )

            return

        # --------------------------------------------
        # Extract payload
        # --------------------------------------------

        headers = (
            response
            .get("payload", {})
            .get("headers", [])
        )

        subject = "(No Subject)"

        for header in headers:

            if header.get("name", "").lower() == "subject":

                subject = header.get(
                    "value",
                    "(No Subject)"
                )

                break

        response_messages.append({
            "message_id": request_id,
            "name": subject
        })

    # ========================================================
    # 6. ADD ALL MESSAGE REQUESTS TO BATCH
    # ========================================================

    for msg in messages:

        message_id = msg["id"]

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

    # ========================================================
    # 7. EXECUTE BATCH
    # ========================================================

    try:

        batch.execute()

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Gmail message metadata: {str(e)}"
        )

    # ========================================================
    # 8. RETURN EXACT SAME OUTPUT
    # ========================================================

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






@router.get("/message/{message_id}")
def get_email_by_message_id(
    message_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Fetch complete Gmail email using Gmail message ID.
    """

    gmail, account = get_gmail_client(request, db)

    try:

        # Fetch complete Gmail message
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

        # Parse Gmail response
        gmail_parsed = parse_gmail_message(gmail_msg)

        # Convert into your analyzer format
        email_data = convert_gmail_to_email_data(
            gmail_parsed,
            gmail_msg
        )

        return {
            "success": True,
            "email": email_data
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch email: {str(e)}"
        )
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
@router.get("/cached-analysis/{message_id}")
def get_cached_analysis(
    message_id: str,
    request: Request,
    db: Session = Depends(get_db)
):

    # ==========================================
    # GET ACCOUNT
    # ==========================================

    gmail, account = get_gmail_client(
        request,
        db
    )

    # ==========================================
    # CACHE KEY
    # ==========================================

    cache_key = f"{account.id}:{message_id}"

    # ==========================================
    # CHECK CACHE
    # ==========================================

    cached_data = analysis_cache.get(cache_key)

    if cached_data is None:

        return {
            "success": False,
            "cached": False,
            "message": "Analysis not found in cache"
        }

    # ==========================================
    # RETURN CACHE
    # ==========================================

    return {

        "success": True,

        "cached": True,

        "source": "cache",

        "data": cached_data
    }
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@router.get("/full-analysis/{message_id}")
def full_analysis(
    message_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    gmail, account = get_gmail_client(request, db)

    cache_key = f"{account.id}:{message_id}"

    # =========================
    # CHECK CACHE
    # =========================
    cached_data = analysis_cache.get(cache_key)

    if cached_data is not None:
        return {
            "success": True,
            "source": "cache",
            "data": cached_data
        }

    # =========================
    # FETCH EMAIL
    # =========================
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

    # =========================
    # PARSE EMAIL
    # =========================
    try:
        gmail_parsed = parse_gmail_message(gmail_msg)

        email_data = convert_gmail_to_email_data(
            gmail_parsed,
            gmail_msg
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse email: {str(e)}"
        )

    # =====================================================
    # RUN ALL 4 ANALYSES IN PARALLEL
    # =====================================================

    def run_detection():
        try:
            return analyze_email(email_data)
        except Exception as e:
            return {"error": str(e)}

    def run_phishing():
        try:
            return Phising_email(email_data)
        except Exception as e:
            return {"error": str(e)}

    def run_social():
        try:
            social = analyze_social_engineering(email_data)

            if hasattr(social, "model_dump"):
                social = social.model_dump()

            return social

        except Exception as e:
            return {"error": str(e)}

    def run_ip():
        try:
            origin_ip = email_data.get("origin_ip")

            if origin_ip:
                return get_ip_intelligence(origin_ip)

            return {
                "message": "Origin IP not found"
            }

        except Exception as e:
            return {"error": str(e)}

    # Run simultaneously
    with ThreadPoolExecutor(max_workers=4) as executor:

        detection_future = executor.submit(run_detection)
        phishing_future = executor.submit(run_phishing)
        social_future = executor.submit(run_social)
        ip_future = executor.submit(run_ip)

        # Get results
        detection = detection_future.result()
        phishing = phishing_future.result()
        social = social_future.result()
        ip_data = ip_future.result()

    # =====================================================
    # SAME RESULT STRUCTURE AS BEFORE
    # =====================================================

    result = {
        "message_id": message_id,
        "email": email_data,
        "detection_engine": detection,
        "phishing": phishing,
        "social": social,
        "ip_tracing": ip_data
    }

    # =========================
    # SAVE TO CACHE
    # =========================
    analysis_cache[cache_key] = result

    # =========================
    # SAME RESPONSE AS BEFORE
    # =========================
    return {
        "success": True,
        "source": "new_analysis",
        "data": result
    }
# @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# @router.get("/analyze/{message_id}")
# def get_email_by_message_id(
#     message_id: str,
#     request: Request,
#     db: Session = Depends(get_db)
# ):
#     """
#     Fetch complete Gmail email using Gmail message ID.
#     """

#     gmail, account = get_gmail_client(request, db)

#     try:

#         # Fetch complete Gmail message
#         gmail_msg = (
#             gmail.users()
#             .messages()
#             .get(
#                 userId="me",
#                 id=message_id,
#                 format="full"
#             )
#             .execute()
#         )

#         # Parse Gmail response
#         gmail_parsed = parse_gmail_message(gmail_msg)

#         # Convert into your analyzer format
#         email_data = convert_gmail_to_email_data(
#             gmail_parsed,
#             gmail_msg
#         )
#         detection_engine_data = analyze_email(email_data)

#         return {
#             "success": True,
#             "Detection_engine_data": detection_engine_data,
#             "email_data":email_data
#         }

#     except Exception as e:

#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to fetch email: {str(e)}"
#         )

# @router.get("/Phising/{message_id}")
# def get_email_by_message_id(
#     message_id: str,
#     request: Request,
#     db: Session = Depends(get_db)
# ):
#     """
#     Fetch complete Gmail email using Gmail message ID.
#     """

#     gmail, account = get_gmail_client(request, db)

#     try:

#         # Fetch complete Gmail message
#         gmail_msg = (
#             gmail.users()
#             .messages()
#             .get(
#                 userId="me",
#                 id=message_id,
#                 format="full"
#             )
#             .execute()
#         )

#         # Parse Gmail response
#         gmail_parsed = parse_gmail_message(gmail_msg)

#         # Convert into your analyzer format
#         email_data = convert_gmail_to_email_data(
#             gmail_parsed,
#             gmail_msg
#         )
#         Phising= Phising_email(email_data)

#         return {
#             "success": True,
#             "Phising": Phising
#         }

#     except Exception as e:

#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to fetch email: {str(e)}"
#         )
# @router.get("/Social/{message_id}")
# def get_email_by_message_id(
#     message_id: str,
#     request: Request,
#     db: Session = Depends(get_db)
# ):
#     """
#     Fetch complete Gmail email and run
#     social engineering analysis.
#     """

#     gmail, account = get_gmail_client(request, db)

#     try:

#         # 1. Fetch complete Gmail message
#         gmail_msg = (
#             gmail.users()
#             .messages()
#             .get(
#                 userId="me",
#                 id=message_id,
#                 format="full"
#             )
#             .execute()
#         )

#         # 2. Parse Gmail response
#         gmail_parsed = parse_gmail_message(gmail_msg)

#         # 3. Convert Gmail data into email_data
#         email_data = convert_gmail_to_email_data(
#             gmail_parsed,
#             gmail_msg
#         )

#         # 4. Run Social Engineering analysis
#         social_analysis = analyze_social_engineering(
#             email_data
#         )

#         # 5. Return result to frontend
#         return {
#             "success": True,
#             "message_id": message_id,
#             "social_engineering": social_analysis.model_dump()
#         }

#     except Exception as e:

#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to fetch/analyze email: {str(e)}"
#         )
def get_gmail_client(
    request: Request,
    db: Session
):
    """
    Get the authenticated Gmail account using JWT,
    retrieve its Google OAuth token from MySQL,
    and create a Gmail API client.
    """

    # =========================================
    # 1. GET JWT FROM AUTHORIZATION HEADER
    # =========================================

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

    token = authorization.split(" ", 1)[1]

    # =========================================
    # 2. DECODE JWT
    # =========================================

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        account_id = payload.get("account_id")

        if not account_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
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

    # =========================================
    # 3. GET ACCOUNT FROM MYSQL
    # =========================================

    account = db.query(GmailAccount).filter(
        GmailAccount.id == account_id
    ).first()

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Gmail account not found"
        )

    # =========================================
    # 4. CHECK GOOGLE TOKEN
    # =========================================

    if not account.google_token:
        raise HTTPException(
            status_code=401,
            detail="Gmail account not connected"
        )

    try:
        token_data = json.loads(account.google_token)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Invalid Google token stored in database"
        )

    # =========================================
    # 5. CREATE GOOGLE CREDENTIALS
    # =========================================

    try:
        credentials = Credentials.from_authorized_user_info(
            token_data,
            SCOPES
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create Google credentials: {str(e)}"
        )

    # =========================================
    # 6. CREATE GMAIL CLIENT
    # =========================================

    try:
        gmail = build(
            "gmail",
            "v1",
            credentials=credentials
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create Gmail client: {str(e)}"
        )

    return gmail, account