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
    # Psychological
    urgency: bool
    authority_impersonation: bool
    fear: bool
    reward: bool
    secrecy: bool
    scarcity: bool
    pressure: bool
    trust_exploitation: bool
    relationship_exploitation: bool
    curiosity_exploitation: bool
    reciprocity: bool
    social_pressure: bool

    # Sensitive information
    sensitive_data_target: SensitiveDataTarget

    # Financial
    money_transfer_request: bool
    payment_request: bool
    refund_manipulation: bool
    investment_lure: bool
    financial_benefit_lure: bool
    banking_action_request: bool

    # Actions
    suspicious_link_request: bool
    attachment_request: bool
    download_request: bool
    software_installation_request: bool
    login_request: bool
    account_verification_request: bool
    information_submission_request: bool
    call_request: bool
    callback_request: bool
    reply_request: bool

    # Impersonation
    executive_impersonation: bool
    bank_impersonation: bool
    government_impersonation: bool
    company_impersonation: bool
    it_support_impersonation: bool
    law_enforcement_impersonation: bool
    colleague_impersonation: bool
    friend_or_family_impersonation: bool

    # Context
    unusual_request: bool
    verification_bypass: bool
    isolation_from_verification: bool
    confidentiality_request: bool
    suspicious_identity_claim: bool

    # Overall
    detected: bool
    techniques: List[str]
    explanation: str
    evidence: List[str]
    risk_impact: str
    recommendation: str

    social_engineering_score: int = Field(
        ge=0,
        le=100
    )

class Phising_indicate(BaseModel):

    suspicious_sender: str | None = None
    suspicious_sender_bool: bool | None = None

    spoofed_sender: str | None = None
    spoofed_sender_bool: bool | None = None

    lookalike_domain: str | None = None
    lookalike_domain_bool: bool | None = None

    malicious_URL: List[str] | None = None
    malicious_url_data: bool | None = None

    shortened_URL: List[str] | None = None
    shortened_url_data: bool | None = None

    obfuscated_URL: List[str] | None = None
    obfuscated_url_data: bool | None = None

    suspicious_attachment: str | None = None
    suspicious_attachment_data: bool | None = None

    fake_login_pages: str | None = None
    fake_login_pages_data: bool | None = None

    credential_harvesting: str | None = None
    credential_harvesting_data: bool | None = None

    suspicious_redirects: str | None = None
    suspicious_redirects_data: bool | None = None

    Explanation: str | None = None

class SensitiveDataTarget(BaseModel):
    detected: bool
    categories: List[str]
    evidence: List[str]