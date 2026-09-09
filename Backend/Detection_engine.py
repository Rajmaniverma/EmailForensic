import os
import json

from dotenv import load_dotenv
from groq import Groq

from Email_parser import parse_email
from model import EmailTextAnalysis
from Social_Engineering import analyze_social_engineering

from Mlanalysis.extract_feature  import extract_features


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

my_api_key = os.getenv("GROQ_API_KEY")

if not my_api_key:
    raise ValueError("GROQ_API_KEY not found in .env file")


# =========================================================
# GROQ CLIENT
# =========================================================

client = Groq(api_key=my_api_key)

GROQ_MODEL = "openai/gpt-oss-120b"


# =========================================================
# PARSE EMAIL
# =========================================================

file_path = "Requirement/Email.eml"

email_data = parse_email(file_path)



features = extract_features(email_data)

print("+++++++++++++++++++++++++++++++++++++")
print(features)
print("+++++++++++++++++++++++++++++++++++=++")


# =========================================================
# EXTRACT SUBJECT AND BODY
# =========================================================

subject = email_data.get("subject") or ""
body = email_data.get("body") or ""


# =========================================================
# SYSTEM PROMPT
# =========================================================

system_prompt = """
You are an Email Security Analysis Engine.

Analyze the SUBJECT and BODY of an email for:

- phishing
- fraud
- social engineering
- credential theft
- financial scams
- suspicious instructions

Analyze ONLY the information provided.

Do not invent information.

Do not assume an email is malicious simply because
it contains a URL or attachment.


=========================================================
SUBJECT ANALYSIS
=========================================================

Analyze the subject for:

1. urgency
2. threats
3. financial requests
4. credential requests
5. unusual language



=========================================================
BODY ANALYSIS
=========================================================

Analyze the body for:

1. urgency
2. fear
3. pressure
4. financial requests
5. password requests
6. OTP requests
7. fake verification
8. impersonation
9. social engineering
10. suspicious instructions
11. phishing indicator


=========================================================
THREAT SCORE
=========================================================

Assign threat_score between 0 and 100.

0-20   = very low threat
21-40  = low threat
41-60  = medium threat
61-80  = high threat
81-100 = critical threat


=========================================================
SAFE SCORE
=========================================================

safe_score must be:

100 - threat_score

Therefore:

threat_score + safe_score = 100


=========================================================
RISK LEVEL
=========================================================

Use:

0-40   = low
41-60  = medium
61-80  = high
81-100 = critical


=========================================================
REASONS
=========================================================

Provide concise reasons explaining the detected
indicators and the assigned threat score.

Only mention evidence actually present in the email.


=========================================================
OUTPUT
=========================================================

Return ONLY valid JSON.

The JSON must follow the requested schema exactly.
"""


# =========================================================
# USER PROMPT
# =========================================================

user_prompt = f"""
Analyze this email.

================ SUBJECT ================

{subject}

================ BODY ================

{body}
"""


# =========================================================
# JSON SCHEMA
# =========================================================

schema = EmailTextAnalysis.model_json_schema()


# =========================================================
# GROQ API CALL
# =========================================================

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


# =========================================================
# GET AI RESPONSE
# =========================================================

raw_result = response.choices[0].message.content

if not raw_result:
    raise ValueError("AI returned an empty response")


# Convert JSON string → Python dictionary
result_dict = json.loads(raw_result)


# =========================================================
# PYDANTIC VALIDATION
# =========================================================

analysis = EmailTextAnalysis.model_validate(result_dict)


# =========================================================
# DISPLAY RESULT
# =========================================================

print("\n")
print("=" * 60)
print("              EMAIL AI ANALYSIS")
print("=" * 60)


# =========================================================
# SUBJECT ANALYSIS
# =========================================================

print("\n========== SUBJECT ANALYSIS ==========\n")

print("Urgency:",
      analysis.subject_analysis.urgency)

print("Threats:",
      analysis.subject_analysis.threats)

print("Financial Request:",
      analysis.subject_analysis.financial_request)

print("Credential Request:",
      analysis.subject_analysis.credential_request)

print("Unusual Language:",
      analysis.subject_analysis.unusual_language)



# =========================================================
# BODY ANALYSIS
# =========================================================

print("\n========== BODY ANALYSIS ==========\n")

print("Urgency:",
      analysis.body_analysis.urgency)

print("Fear:",
      analysis.body_analysis.fear)

print("Pressure:",
      analysis.body_analysis.pressure)

print("Financial Request:",
      analysis.body_analysis.financial_request)

print("Password Request:",
      analysis.body_analysis.password_request)

print("OTP Request:",
      analysis.body_analysis.otp_request)

print("Fake Verification:",
      analysis.body_analysis.fake_verification)

print("Impersonation:",
      analysis.body_analysis.impersonation)

print("Social Engineering:",
      analysis.body_analysis.social_engineering)

print("Suspicious Instructions:",
      analysis.body_analysis.suspicious_instructions)
print("Phising instructions:",
      analysis.body_analysis.phishing_indicator)

# =========================================================
# RISK ASSESSMENT
# =========================================================

print("\n========== RISK ASSESSMENT ==========\n")

print("Threat Score:",
      analysis.threat_score,
      "/ 100")

print("Safe Score:",
      analysis.safe_score,
      "/ 100")

print("Risk Level:",
      analysis.risk_level)


# =========================================================
# REASONS
# =========================================================

print("\n========== REASONS ==========\n")

for reason in analysis.reasons:
    print("-", reason)


print("\n" + "=" * 60)


if analysis.body_analysis.social_engineering:

        print("Social Engineering: TRUE")

        # Run detailed social engineering analysis
        social_analysis = analyze_social_engineering(
            subject,
            body
        )

else:

        print("Social Engineering: FALSE")




