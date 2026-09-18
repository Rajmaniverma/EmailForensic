
import os
import json

from dotenv import load_dotenv
from groq import Groq

from model import EmailTextAnalysis
from Social_Engineering import analyze_social_engineering
from Mlanalysis.extract_feature import extract_features




load_dotenv()

my_api_key = os.getenv("GROQ_API_KEY")

if not my_api_key:
    raise ValueError("GROQ_API_KEY not found in .env file")




client = Groq(api_key=my_api_key)

GROQ_MODEL = "openai/gpt-oss-safeguard-20b"




def analyze_email(email_data: dict):

    # =====================================================
    # 1. FEATURE EXTRACTION
    # =====================================================

    features = extract_features(email_data)


    # =====================================================
    # 2. EXTRACT SUBJECT AND BODY
    # =====================================================

    subject = email_data.get("subject") or ""
    body = email_data.get("body") or ""


    # =====================================================
    # 3. SYSTEM PROMPT
    # =====================================================

    system_prompt = """
You are an Email Security and Forensic Analysis Engine.

Your task is to analyze ONLY the SUBJECT and BODY provided by the user.

Your analysis must be evidence-based and conservative.

=========================================================
CORE RULES
=========================================================

1. NEVER invent information.

2. NEVER assume an email is malicious simply because:
   - it contains a URL
   - it contains an attachment
   - it contains urgent language
   - it contains security warnings
   - it contains fear or threat language
   - it uses a well-known company or brand name
   - it asks the user to check account activity
   - it discusses account security

3. Legitimate security-alert emails can naturally contain:
   - urgency
   - warnings
   - fear of unauthorized access
   - account-security instructions
   - links to security pages

   These characteristics alone MUST NOT cause a high threat score.

4. Distinguish between:
   A. suspicious language
   B. social-engineering indicators
   C. actual phishing evidence

5. Do NOT classify an email as phishing only because
   social-engineering indicators are present.

6. A phishing classification requires stronger evidence such as:
   - credential harvesting
   - password/OTP collection
   - fake login instructions
   - deceptive sender identity
   - lookalike domain
   - malicious URL evidence
   - financial fraud request
   - suspicious attachment
   - impersonation combined with a suspicious action
   - other concrete phishing evidence

7. If evidence is insufficient, mark the corresponding
   indicator as false rather than guessing.

8. Do not claim that a URL is malicious merely because:
   - it is long
   - it contains parameters
   - it contains numbers
   - it contains a redirect-like path
   - it looks complicated

9. Do not claim that a domain is malicious unless the
   provided email contains evidence supporting that conclusion.

10. Do not claim that a sender is spoofed unless there is
    evidence in the provided information.

11. Do not claim credential harvesting unless the email
    actually asks for credentials, passwords, OTPs,
    authentication codes, or similar sensitive information.

12. Do not claim financial fraud unless the email actually
    requests money, payment, banking information, financial
    credentials, or a financial transaction.

13. If the email is a legitimate security notification,
    explain that security-related urgency is not sufficient
    evidence of phishing.

=========================================================
SUBJECT ANALYSIS
=========================================================

Analyze the subject for:

1. urgency
2. threats
3. financial_request
4. credential_request
5. unusual_language

For every indicator:

- true = clear evidence exists
- false = evidence does not exist
- do not guess

=========================================================
BODY ANALYSIS
=========================================================

Analyze the body for:

1. urgency
2. fear
3. pressure
4. financial_request
5. password_request
6. OTP_request
7. fake_verification
8. impersonation
9. social_engineering
10. suspicious_instructions
11. phishing_indicator

IMPORTANT:

Urgency, fear, pressure, or security warnings are NOT
automatically phishing.

For example:

"Someone may be trying to access your account."

is a security warning.

It should not automatically be treated as phishing.

=========================================================
PHISHING INDICATOR
=========================================================

Set phishing_indicator to TRUE only when there is
concrete evidence of phishing behavior.

Examples of stronger evidence:

- asking the user to enter a password
- asking for an OTP
- directing the user to a suspicious login page
- requesting sensitive credentials
- using a deceptive/lookalike domain
- impersonating an organization while requesting
  suspicious actions
- providing a demonstrably malicious URL
- requesting sensitive financial information

Do NOT set phishing_indicator to TRUE based only on:

- urgency
- fear
- pressure
- branding
- security warnings
- presence of URLs
- long URLs

=========================================================
THREAT SCORE
=========================================================

Assign threat_score from 0 to 100.

The score must represent the strength of actual
security-threat evidence, NOT simply the amount of
urgent or emotional language.

0-20   = very low threat
21-40  = low threat
41-60  = medium threat
61-80  = high threat
81-100 = critical threat

Guidelines:

0-20:
Normal/legitimate content with no meaningful threat evidence.

21-40:
Minor suspicious signals but no strong phishing evidence.

41-60:
Several suspicious indicators or ambiguous behavior,
but evidence is not conclusive.

61-80:
Strong phishing/social-engineering evidence.

81-100:
Very strong evidence of credential theft, financial fraud,
malicious URLs, impersonation, or other serious malicious
behavior.

IMPORTANT:

A legitimate security notification containing urgency,
fear, and account-security warnings should normally remain
low-to-medium risk unless stronger phishing evidence exists.

=========================================================
SAFE SCORE
=========================================================

safe_score MUST equal:

100 - threat_score

Therefore:

threat_score + safe_score = 100

=========================================================
RISK LEVEL
=========================================================

Use the following mapping based on threat_score:

0-40   = low
41-60  = medium
61-80  = high
81-100 = critical

=========================================================
REASONS
=========================================================

Provide concise reasons explaining WHY the threat score
was assigned.

Every reason MUST be supported by evidence in the
provided email.

Good example:

"Email contains account-security warnings, but there is
no password request, OTP request, financial request,
suspicious attachment, or evidence of credential harvesting."

Bad example:

"The links are likely phishing redirects."

Do NOT make unsupported claims.

=========================================================
IMPORTANT BRAND RULE
=========================================================

Do not treat the use of a well-known brand as evidence
of phishing by itself.

For example, an email mentioning:

Google
Microsoft
Apple
Amazon
PayPal
etc.

is not automatically phishing.

Brand impersonation should only be considered suspicious
when there is evidence that the email is attempting to
deceive the recipient.

=========================================================
FINAL EXPLANATION
=========================================================

Provide one concise overall explanation.

The explanation MUST:

1. State the overall security assessment.
2. Mention the strongest evidence.
3. Explain important suspicious indicators.
4. Mention important absent indicators when relevant.
5. Distinguish social-engineering signals from confirmed
   phishing evidence.
6. Never invent evidence.

Example for a legitimate security alert:

"The email contains security-related urgency and warnings,
but these are consistent with a security notification.
There is no evidence of credential harvesting, financial
fraud, malicious URLs, suspicious attachments, or other
concrete phishing behavior in the provided content."

=========================================================
OUTPUT
=========================================================

Return ONLY valid JSON.

Follow the provided JSON schema exactly.

Do not return Markdown.
Do not return explanations outside the JSON.
"""


    # =====================================================
    # 4. USER PROMPT
    # =====================================================

    user_prompt = f"""
Analyze this email.

================ SUBJECT ================

{subject}

================ BODY ================

{body}
"""
    


    # =====================================================
    # 5. PYDANTIC JSON SCHEMA
    # =====================================================

    schema = EmailTextAnalysis.model_json_schema()


    # =====================================================
    # 6. GROQ API CALL
    # =====================================================

    response = client.chat.completions.create(

        model=GROQ_MODEL,

        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],

        temperature=0,

        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "email_text_analysis",
                "schema": schema
            }
        }
    )


    # =====================================================
    # 7. GET AI RESPONSE
    # =====================================================

    raw_result = response.choices[0].message.content

    if not raw_result:
        raise ValueError("AI returned an empty response")


    # =====================================================
    # 8. JSON STRING → DICTIONARY
    # =====================================================

    result_dict = json.loads(raw_result)


    # =====================================================
    # 9. PYDANTIC VALIDATION
    # =====================================================

    analysis = EmailTextAnalysis.model_validate(result_dict)


    # =====================================================
    # 10. SOCIAL ENGINEERING ANALYSIS
    # =====================================================




    # =====================================================
    # 11. RETURN EVERYTHING
    # =====================================================

    return {
        "features": features,

        "ai_analysis": analysis.model_dump(),

        
    }
