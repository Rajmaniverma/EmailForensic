import joblib
import os
from Email_parser import parse_email
from Mlanalysis.extract_feature import extract_features
import pandas as pd
from groq import Groq
from dotenv import load_dotenv
from model import Phising_indicate


load_dotenv()

my_api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=my_api_key)
# ==========================================
# 1. EMAIL FILE
# ==========================================

file_path = "Requirement/Email.eml"


# ==========================================
# 2. PARSE EMAIL
# ==========================================

email_data = parse_email(file_path)


# ==========================================
# 3. EXTRACT FEATURES
# ==========================================

features = extract_features(email_data)

print("Extracted Features:")
print(features)


# ==========================================
# 4. KEEP SAME FEATURE ORDER
# ==========================================

feature_values = [
    features["url_count"],
    features["ip_url_count"],
    features["suspicious_tld_count"],
    features["long_url_count"],
    features["urgent_count"],
    features["credential_count"],
    features["threat_count"],
    features["reply_to_mismatch"],
    features["attachment_count"],
    features["suspicious_attachment_count"],
    features["text_length"],
    features["exclamation_count"]
]


feature_df = pd.DataFrame(
    [feature_values],
    columns=[
        "url_count",
        "ip_url_count",
        "suspicious_tld_count",
        "long_url_count",
        "urgent_count",
        "credential_count",
        "threat_count",
        "reply_to_mismatch",
        "attachment_count",
        "suspicious_attachment_count",
        "text_length",
        "exclamation_count"
    ]
)

# ==========================================
# 5. LOAD TRAINED MODEL
# ==========================================
file_paths= "dataset/phishing_model.pkl"
model = joblib.load(file_paths)


# ==========================================
# 6. PREDICT
# ==========================================

prediction = model.predict(feature_df)

# Probability / score
probability = model.predict_proba(feature_df)

phishing_score = probability[0][1] * 100
legitimate_score = probability[0][0] * 100

print(f"\nPhishing Score: {phishing_score:.2f}%")
print(f"Legitimate Score: {legitimate_score:.2f}%")

if prediction[0] == 1:
    print("⚠️ PHISHING EMAIL")
else:
    print("✅ LEGITIMATE EMAIL")

################################################################################## AI used for the resoning ################################
##################################################################################
# AI USED FOR REASONING
##################################################################################

if legitimate_score >= 75:

    Explanation = "This is LEGITIMATE EMAIL ✅"
    print("Explanation:", Explanation)

else:

    email_text = email_data.get("body", "")
    subject = email_data.get("subject", "")
    sender = email_data.get("from", "")

    prompt = f"""
You are an expert email security analyst.

Analyze this email for phishing and social-engineering indicators.

Subject:
{subject}

Sender:
{sender}

Body:
{email_text}

Machine Learning Analysis:
Phishing Score: {phishing_score:.2f}%
Legitimate Score: {legitimate_score:.2f}%

Extracted Features:
{features}

Analyze these indicators:

1. suspicious sender
2. spoofed sender
3. lookalike domain
4. malicious URL
5. shortened URL
6. obfuscated URL
7. suspicious attachment
8. fake login pages
9. credential harvesting
10. suspicious redirects

For malicious URL, shortened URL, and obfuscated URL,
return the actual URL if one exists. Otherwise return an empty list.

For the other indicators, provide the explanation in a single sentence.

Do not invent information that is not present in the email.
"""

    # Create JSON schema BEFORE API call
    schema = Phising_indicate.model_json_schema()

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",

        messages=[
            {
                "role": "system",
                "content": "You are an expert email security analyst."
            },
            {
                "role": "user",
                "content": prompt
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

    ai_analysis = response.choices[0].message.content

    print("\n===== AI ANALYSIS =====")
    print(ai_analysis)