
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

GROQ_MODEL = "openai/gpt-oss-120b"




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
