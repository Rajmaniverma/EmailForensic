from typing import List
from pydantic import BaseModel, Field


class SubjectAnalysis(BaseModel):
    urgency: bool
    threats: bool
    financial_request: bool
    credential_request: bool
    unusual_language: bool


class BodyAnalysis(BaseModel):
    urgency: bool
    fear: bool
    pressure: bool
    financial_request: bool
    password_request: bool
    otp_request: bool
    fake_verification: bool
    impersonation: bool
    social_engineering: bool
    suspicious_instructions: bool
    phishing_indicator:bool


class EmailTextAnalysis(BaseModel):
    subject_analysis: SubjectAnalysis
    body_analysis: BodyAnalysis

    threat_score: int = Field(ge=0, le=100)
    safe_score: int = Field(ge=0, le=100)

    risk_level: str
    reasons: List[str]

class SocialEngineeringAnalysis(BaseModel):
    urgency: bool
    authority_impersonation: bool
    fear: bool
    reward: bool
    secrecy: bool

    detected: bool

    techniques: List[str]

    explanation: str

    evidence: List[str]

    risk_impact: str

    recommendation: str

    social_engineering_score: int = Field(ge=0, le=100)

class Phising_indicate(BaseModel):
    suspicious_sender:str | None = None
    spoofed_sender:str | None = None
    lookalike_domain:str | None = None
    malicious_URL:List[str] | None = None
    shortened_URL:List[str] | None = None
    obfuscated_URL:List[str] | None = None
    suspicious_attachment:str | None = None
    fake_login_pages:str | None = None
    credential_harvesting:str | None = None
    suspicious_redirects:str | None = None
