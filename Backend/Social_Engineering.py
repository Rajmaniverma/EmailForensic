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

GROQ_MODEL = "openai/gpt-oss-120b"
# file_path = "Requirement/Email.eml"




# =========================================================
# EXTRACT SUBJECT AND BODY
# =========================================================



def analyze_social_engineering(email_data):
    subject = email_data.get("subject") or ""
    body = email_data.get("body") or ""


    system_prompt = """
You are a cybersecurity analyst specializing in
social engineering and email fraud detection.

Analyze the given email subject and body.

Identify these psychological manipulation techniques:

1. Urgency
   Example: "Transfer ₹50,000 immediately."

2. Authority impersonation
   Example: "This is the Director. Keep this confidential."

3. Fear
   Example: "Your account will be permanently blocked."

4. Reward
   Example: "You have won ₹10 lakh."

5. Secrecy
   Example: "Do not inform anyone about this transaction."

#important

For each technique, determine whether it is present.

Rules:
- Use only information present in the email.
- Do not invent evidence.
- Provide evidence from the email.
- Explain why the detected techniques are social engineering.
- If multiple techniques are present, detect all of them.
- Calculate a social engineering score from 0 to 100.

Score:
0-20   = Very Low
21-40  = Low
41-60  = Medium
61-80  = High
81-100 = Critical

#important
Explanation:summary in only one line

Return only JSON matching the provided schema.
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





