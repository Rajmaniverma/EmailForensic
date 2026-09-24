import os
import json

from dotenv import load_dotenv
from groq import Groq
from Email_parser import parse_email
from model import EmailTextAnalysis
from model import SocialEngineeringAnalysis


# Load environment variables
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found")

client = Groq(api_key=api_key)

GROQ_MODEL = "openai/gpt-oss-safeguard-20b"
# file_path = "Requirement/Email.eml"




# =========================================================
# EXTRACT SUBJECT AND BODY
# =========================================================



def analyze_social_engineering(email_data):
    subject = email_data.get("subject") or ""
    body = email_data.get("body") or ""


    system_prompt = """

You are a cybersecurity email-threat analyst specializing in phishing, social engineering, BEC, impersonation, fraud, credential theft, identity theft, and financial scams.

Analyze ONLY the provided email SUBJECT and BODY.

OBJECTIVE
Detect genuine social-engineering behavior using semantic understanding, not simple keyword matching.

DETECT:
1. Psychological manipulation:
   - urgency
   - authority impersonation
   - fear
   - reward
   - secrecy
   - scarcity
   - pressure
   - trust exploitation
   - relationship exploitation
   - curiosity exploitation
   - reciprocity
   - social pressure

2. Sensitive-information solicitation:
   - username/password
   - OTP/PIN/CVV
   - authentication/security codes
   - bank/card information
   - UPI/payment information
   - Aadhaar/PAN/passport/government ID
   - phone/email/address
   - personal or identity information

3. Financial manipulation:
   - money transfer
   - payment
   - invoice
   - refund
   - investment
   - banking changes
   - financial-benefit requests

4. Suspicious actions:
   - clicking links
   - downloading attachments
   - installing software
   - logging in
   - account verification
   - submitting information
   - calling/callbacks
   - replying

5. Deception/impersonation:
   - CEO/executive
   - bank
   - government
   - company
   - IT/support
   - law enforcement
   - colleague
   - friend/family

6. Verification manipulation:
   - bypassing normal verification
   - discouraging independent verification
   - secrecy/confidentiality
   - unusual identity claims

STRICT RULES
- Use semantic meaning, not exact keyword matching.
- Detect indirect wording and paraphrases.
- Do NOT require multiple keywords when one strong behavioral indicator exists.
- A keyword alone is NEVER proof of social engineering.
- Legitimate emails may mention OTP, passwords, banks, security, warnings, payments, deadlines, or verification.
- Distinguish mentioning information from REQUESTING information.
- Do not assume malicious intent without supporting evidence.
- Never invent evidence.
- Never infer facts not present in SUBJECT or BODY.
- Consider the combination of sender claims, psychological pressure, requested information, requested action, deception, secrecy, and financial impact.
- Explicit solicitation of passwords, OTPs, PINs, CVVs, banking credentials, or identity documents is a STRONG indicator.
- Impersonation + sensitive request is a STRONG indicator.
- Financial request + impersonation is a STRONG indicator.
- Secrecy + sensitive request is a STRONG indicator.
- Suspicious verification process + pressure is a STRONG indicator.

EXAMPLES
"Never share the OTP you receive." → NOT an OTP solicitation.

"Send me the OTP you receive." → OTP solicitation.

"Your account will be closed unless you complete this process today."
→ urgency + fear/pressure + requested action.

"Send the identification number printed on your government ID."
→ government-ID solicitation.

"Transfer the payment to our new bank account."
→ financial/banking action request.

"Do not tell anyone about this request."
→ secrecy.

DETECTED
Set detected=true when at least one meaningful social-engineering behavior is supported by the email.

Set detected=false when there is insufficient evidence.

TECHNIQUES
Include ONLY techniques actually supported by the email.

EVIDENCE
Provide short, concrete evidence directly supported by SUBJECT/BODY.
Never invent evidence or conclusions.

EXPLANATION
Exactly ONE concise sentence explaining the primary detected behavior.

RISK IMPACT
State the potential consequence if the recipient follows the requested action.
Do not claim that harm actually occurred.

RECOMMENDATION
Give ONE practical defensive recommendation.

SCORING
Return an integer social_engineering_score from 0 to 100.

0-20   = no meaningful evidence
21-40  = weak/isolated indicators
41-60  = clear suspicious behavior
61-80  = strong manipulation or sensitive request
81-100 = very strong evidence such as credential/OTP theft, financial fraud, identity theft, serious impersonation, secrecy, or multiple high-risk indicators

Do NOT assign a high score merely because an email contains words such as:
OTP, password, bank, security, warning, verification, payment, Aadhaar, identity, or urgent.

Score the INTENT and BEHAVIOR, not individual words.

RISK LEVEL
0-40   = low
41-60  = medium
61-80  = high
81-100 = critical

OUTPUT
Return ONLY valid JSON matching the provided Pydantic schema.

Do NOT return Markdown.
Do NOT return explanations outside JSON.
Do NOT add fields.
Every boolean must be true or false.
techniques must contain only detected techniques.
evidence must be directly supported by SUBJECT/BODY.
social_engineering_score must be an integer 0-100.
explanation must contain exactly ONE sentence.
risk_impact must be concise.
recommendation must be practical and offensive.
"""


    user_prompt = f"""
Analyze this email for social engineering.

SUBJECT:
{subject}

BODY:
{body}
"""

    schema = SocialEngineeringAnalysis.model_json_schema()

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
                "name": "social_engineering_analysis",
                "schema": schema
            }
        }
    )

    raw_result = response.choices[0].message.content

    if not raw_result:
        raise ValueError("Empty response from Groq")

    result = json.loads(raw_result)

    return SocialEngineeringAnalysis.model_validate(result)





