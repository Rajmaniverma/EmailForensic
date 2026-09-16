
import os
import secrets
from typing import Optional
from fastapi import Header
from fastapi import FastAPI, HTTPException, Request
from google_auth_oauthlib.flow import Flow
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from Gmail_Auth import SCOPES, create_google_flow
from client import GmailClient
from starlette.middleware.sessions import SessionMiddleware
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from Email_parser import parse_email
from Detection_engine import analyze_email
from Phishing import Phising_email
from fastapi import Depends
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from fastapi import Depends
from sqlalchemy.orm import Session
from Database import get_db
from DBmodel import  GmailAccount
from Database import engine, Base
from jose import jwt
from datetime import datetime, timedelta
from routes.Gmail import router as gmail_router
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
# import DBmodel


# ============================================================
# FASTAPI APP
# ============================================================
# Routes

app = FastAPI( title="Gmail Email Analyzer", version="1.0.0")
# ============================================================
# CORS CONFIGURATION
# ============================================================
app.add_middleware( CORSMiddleware,
    allow_origins=[
        "https://email-forensic.vercel.app",
        "http://localhost:5173",
        "https://emailforensic31.online/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# SESSION CONFIGURATION
# ============================================================

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY_VALUE"),
    same_site="none",
    https_only=True,
)

class GmailAnalyzeRequest(BaseModel):
    message_id: str



app.include_router( gmail_router, prefix="/gmail", tags=["Gmail"])
# ============================================================
# ROOT
# ============================================================


def create_access_token(account_id: int):
    expire = datetime.utcnow() + timedelta(days=7)

    payload = {
        "account_id": account_id,
        "exp": expire
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
# ============================================================
# AUTH STATUS
# ============================================================

@app.get("/auth/status")
def auth_status(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        return {
            "authenticated": False
    }
    if not authorization.startswith("Bearer "):
        return {
            "authenticated": False
        }

    token = authorization.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        account_id = payload.get("account_id")

        if not account_id:
            return {
                "authenticated": False
            }

    except Exception:
        return {
            "authenticated": False
        }

    account = db.query(GmailAccount).filter(
        GmailAccount.id == account_id
    ).first()

    if not account:
        return {
            "authenticated": False
        }

    return {
        "authenticated": True,
        "user": {
            "id": account.id,
            "email": account.email,
            "name": account.name,
            "photo": account.photo_url
        }
    }

# ============================================================
# GOOGLE LOGIN
# ============================================================

@app.get("/auth/login")
def google_login(request: Request):




    flow = create_google_flow()
    redirect_uri = (
        str(request.base_url).rstrip("/")
        + "/auth/callback"
    )

    flow.redirect_uri = redirect_uri



    # Generate Google authorization URL
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        code_challenge_method="S256",
    )



    # IMPORTANT:
    # Save both state AND PKCE code verifier
    request.session["oauth_state"] = state
    request.session["code_verifier"] = flow.code_verifier




    print("REDIRECTING TO GOOGLE")


    return RedirectResponse(
        authorization_url
    )

# ============================================================
# GOOGLE OAUTH CALLBACK
# ============================================================

@app.get("/auth/callback")
def google_callback(request: Request , db: Session = Depends(get_db)):



    # ==================================================
    # STEP 1
    # ==================================================

 


    # ==================================================
    # STEP 2
    # ==================================================


    state_from_url = request.query_params.get("state")


    if not state_from_url:
        print("[ERROR] State missing from Google")

        raise HTTPException(
            status_code=400,
            detail="OAuth state missing from Google callback."
        )



    # ==================================================
    # STEP 3
    # ==================================================


    state_from_session = request.session.get(
        "oauth_state"
    )



    if not state_from_session:
        print("[ERROR] OAuth state NOT FOUND")

        raise HTTPException(
            status_code=400,
            detail="OAuth state not found in session."
        )



    # ==================================================
    # STEP 4
    # ==================================================


    if state_from_url != state_from_session:

        print("[ERROR] STATE MISMATCH")

        raise HTTPException(
            status_code=400,
            detail="OAuth state mismatch."
        )



    # ==================================================
    # STEP 5
    # Get PKCE code verifier
    # ==================================================
    print("\n[5] Getting PKCE code verifier...")

    code_verifier = request.session.get(
        "code_verifier"
    )

    if not code_verifier:
  

        raise HTTPException(
            status_code=400,
            detail="OAuth code verifier not found in session."
        )

   

    # ==================================================
    # STEP 6
    # Create OAuth flow
    # ==================================================
  

    try:

        flow = create_google_flow(
        state=state_from_session
        )

    

    except Exception as exc:



        raise HTTPException(
            status_code=500,
            detail=f"Failed to create OAuth flow: {exc}"
        )

    # ==================================================
    # STEP 7
    # Restore PKCE verifier
    # ==================================================

    flow.code_verifier = code_verifier



    # ==================================================
    # STEP 8
    # Redirect URI
    # ==================================================


    redirect_uri = (
        str(request.base_url).rstrip("/")
        + "/auth/callback"
    )

    

    flow.redirect_uri = redirect_uri

  

    # ==================================================
    # STEP 9
    # Authorization response
    # ==================================================


    authorization_response = str(
        request.url
    )

  

    # ==================================================
    # STEP 10
    # Exchange code for token
    # ==================================================


    try:

        flow.fetch_token(
            authorization_response=authorization_response
        )

        print("[OK] Google OAuth token received")

    except Exception as exc:

        print("[ERROR] fetch_token() FAILED")
        print(
            f"[ERROR TYPE] "
            f"{type(exc).__name__}"
        )
        print(
            f"[ERROR DETAILS] {exc}"
        )

        raise HTTPException(
            status_code=400,
            detail=f"Google OAuth failed: {exc}"
        )

    # ==================================================
    # STEP 11
    # Get credentials
    # ==================================================
    print("\n[11] Getting credentials...")

    credentials = flow.credentials

    print("ACCESS TOKEN:", bool(credentials.token))
    print("REFRESH TOKEN:", bool(credentials.refresh_token))
    print("VALID:", credentials.valid)
    print("EXPIRED:", credentials.expired)

    if not credentials:

        print("[ERROR] Credentials not received")

        raise HTTPException(
            status_code=400,
            detail="Google returned no credentials."
        )

    print("[OK] Credentials received")

    print(
        f"[INFO] Token valid: "
        f"{credentials.valid}"
    )

    print(
        f"[INFO] Refresh token: "
        f"{bool(credentials.refresh_token)}"
    )

    # ==================================================
    # STEP 12
    # Save token.json
    # ==================================================
    print("\n[12] Saving token.json...")

    try:
        google_service = build(
        "oauth2",
        "v2",
        credentials=credentials
)

        user_info = google_service.userinfo().get().execute()
        gmail_email = user_info["email"]
        gmail_name = user_info.get("name")
        gmail_photo = user_info.get("picture")


        google_token = credentials.to_json()

        account = db.query(GmailAccount).filter(
            GmailAccount.email == gmail_email
        ).first()
        
        if account:
        
            # Existing Gmail account
            account.name = gmail_name
            account.photo_url = gmail_photo
            account.google_token = google_token
        
        else:

    # New Gmail account
          account = GmailAccount(
              email=gmail_email,
              name=gmail_name,
              photo_url=gmail_photo,
              google_token=google_token
          )
      
          db.add(account)

        db.commit()
        db.refresh(account)
        
        # Save account ID in session
        request.session["gmail_account_id"] = account.id
        access_token = create_access_token(account.id)

        print(
        "[OK] Gmail account ID saved in session:",
        account.id
        )


    except Exception as exc:

        print("[ERROR] Failed to save token.json")
        print(f"[ERROR] {exc}")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save token.json: {exc}"
        )

    # ==================================================
    # STEP 13
    # Clear OAuth session data
    # ==================================================
    print("\n[13] Clearing OAuth session data...")

    request.session.pop(
        "oauth_state",
        None
    )

    request.session.pop(
        "code_verifier",
        None
    )

    return RedirectResponse(
    url=f"https://emailforensic31.online/dashboard?token={access_token}",
    status_code=303
)

    # ==================================================
    # SUCCESS
    # ==================================================


    return {
        "success": True,
        "message": (
            "Gmail authentication successful. "
            "You can now analyze Gmail emails."
        )
    }


