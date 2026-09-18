# import joblib
# import os
# import pandas as pd
# import json
# from groq import Groq
# from dotenv import load_dotenv
# from Mlanalysis.extract_feature import extract_features
# from model import Phising_indicate


# # =========================================================
# # LOAD ENVIRONMENT VARIABLES
# # =========================================================

# load_dotenv()

# my_api_key = os.getenv("GROQ_API_KEY")

# if not my_api_key:
#     raise ValueError("GROQ_API_KEY not found in .env file")


# # =========================================================
# # GROQ CLIENT
# # =========================================================

# client = Groq(api_key=my_api_key)


# # =========================================================
# # EMAIL ANALYSIS FUNCTION
# # =========================================================

# def Phising_email(email_data):

#     # ==========================================
#     # 1. EXTRACT FEATURES
#     # ==========================================

#     features = extract_features(email_data)

#     print("Extracted Features:")
#     print(features)


#     # ==========================================
#     # 2. KEEP SAME FEATURE ORDER
#     # ==========================================

#     feature_values = [
#         features["url_count"],
#         features["ip_url_count"],
#         features["suspicious_tld_count"],
#         features["long_url_count"],
#         features["urgent_count"],
#         features["credential_count"],
#         features["threat_count"],
#         features["reply_to_mismatch"],
#         features["attachment_count"],
#         features["suspicious_attachment_count"],
#         features["text_length"],
#         features["exclamation_count"]
#     ]


#     feature_df = pd.DataFrame(
#         [feature_values],
#         columns=[
#             "url_count",
#             "ip_url_count",
#             "suspicious_tld_count",
#             "long_url_count",
#             "urgent_count",
#             "credential_count",
#             "threat_count",
#             "reply_to_mismatch",
#             "attachment_count",
#             "suspicious_attachment_count",
#             "text_length",
#             "exclamation_count"
#         ]
#     )


#     # ==========================================
#     # 3. LOAD TRAINED MODEL
#     # ==========================================

#     file_paths = "dataset/phishing_model.pkl"

#     model = joblib.load(file_paths)


#     # ==========================================
#     # 4. PREDICT
#     # ==========================================

#     prediction = model.predict(feature_df)

#     probability = model.predict_proba(feature_df)

#     print("RAW PROBABILITY:", probability)
#     print("MODEL CLASSES:", model.classes_)


#     # ==========================================
#     # 5. GET PROBABILITY
#     # ==========================================

#     # Assuming:
#     # 0 = Legitimate
#     # 1 = Phishing

#     phishing_index = list(model.classes_).index(1)
#     legitimate_index = list(model.classes_).index(0)

#     phishing_score = probability[0][phishing_index] * 100
#     legitimate_score = probability[0][legitimate_index] * 100


#     # ==========================================
#     # 6. DISPLAY RESULT
#     # ==========================================

#     print(f"\nPhishing Score: {phishing_score:.2f}%")
#     print(f"Legitimate Score: {legitimate_score:.2f}%")


#     if prediction[0] == 1:

#         print("⚠️ PHISHING EMAIL")

#     else:

#         print("✅ LEGITIMATE EMAIL")


#     ##################################################################################
#     # AI used for the reasoning
#     ##################################################################################

#     if legitimate_score >= 75:

#         Explanation = "This is LEGITIMATE EMAIL ✅"

#         print("Explanation:", Explanation)

#         ai_analysis = None

#     else:

#         email_text = email_data.get("body", "")
#         subject = email_data.get("subject", "")
#         sender = email_data.get("from", "")


#         prompt = f"""
# You are an expert email security analyst.

# Analyze this email for phishing and social-engineering indicators.

# Subject:
# {subject}

# Sender:
# {sender}

# Body:
# {email_text}

# Machine Learning Analysis:
# Phishing Score: {phishing_score:.2f}%
# Legitimate Score: {legitimate_score:.2f}%

# Extracted Features:
# {features}

# Analyze these indicators:

# 1. suspicious sender
# 2. spoofed sender
# 3. lookalike domain
# 4. malicious URL
# 5. shortened URL
# 6. obfuscated URL
# 7. suspicious attachment
# 8. fake login pages
# 9. credential harvesting
# 10. suspicious redirects

# For malicious URL, shortened URL, and obfuscated URL,
# return the actual URL if one exists. Otherwise return an empty list.
# this is the output Format

# suspicious_sender:str | None = None
#     suspicious_sender_bool:bool|None= None
#     spoofed_sender:str | None = None
#     spoofed_sender_bool:bool|None= None
#     lookalike_domain:str | None = None
#     lookalike_domain_bool:bool | None  = None
#     malicious_URL:List[str] | None = None
#     malicious_url_data:bool | None = None
#     shortened_URL:List[str] | None = None
#     shortend_url_data:bool | None = None

#     obfuscated_URL:List[str] | None = None
#     obfuscated__url_data:bool | None = None

#     suspicious_attachment:str | None = None
#     suspicious_attachment_data:bool | None = None
#     fake_login_pages:str | None = None
#     fake_login_pages_data:bool | None
#     credential_harvesting:str | None = None
#     credential_harvesting:bool | None
#     suspicious_redirects:str | None = None
#     Explanation:str | None

# For the other indicators, provide the explanation in a single sentence.

# Do not invent information that is not present in the email.
# """


#         # Create JSON schema BEFORE API call

#         schema = Phising_indicate.model_json_schema()


#         response = client.chat.completions.create(

#             model="openai/gpt-oss-safeguard-20b",

#             messages=[
#                 {
#                     "role": "system",
#                     "content": "You are an expert email security analyst."
#                 },
#                 {
#                     "role": "user",
#                     "content": prompt
#                 }
#             ],

#             temperature=0,

#             response_format={
#                 "type": "json_schema",
#                 "json_schema": {
#                     "name": "email_text_analysis",
#                     "schema": schema
#                 }
#             }
#         )

 
#         ai_analysis = response.choices[0].message.content
#         ai_analysis_data = json.loads(ai_analysis)
#         Explanation = ai_analysis_data.get("Explanation")


#         print("\n===== AI ANALYSIS =====")
#         print(ai_analysis)


#     # ==========================================
#     # RETURN ALL RESULTS
#     # ==========================================

#     return {
#         "features": features,
#         "prediction": int(prediction[0]),
#         "phishing_score": round(phishing_score, 2),
#         "legitimate_score": round(legitimate_score, 2),
#         "explanation": Explanation ,
#         "ai_analysis": ai_analysis
#     }


import os
import json
import joblib
import pandas as pd

from groq import Groq
from dotenv import load_dotenv

from Mlanalysis.extract_feature import extract_features
from model import Phising_indicate


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")


# =========================================================
# GROQ CLIENT
# =========================================================

client = Groq(api_key=GROQ_API_KEY)


# =========================================================
# MODEL PATH
# =========================================================

MODEL_PATH = "dataset/phishing_model.pkl"


# =========================================================
# IMPORTANT:
# MUST BE EXACTLY THE SAME FEATURES USED DURING TRAINING
# =========================================================

FEATURE_COLUMNS = [
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


# =========================================================
# LOAD MODEL ONCE
# =========================================================

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Phishing model not found: {MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)


# =========================================================
# CHECK MODEL FEATURES
# =========================================================

if hasattr(model, "feature_names_in_"):

    model_features = list(model.feature_names_in_)

    if model_features != FEATURE_COLUMNS:
        raise ValueError(
            "\nModel feature mismatch!\n"
            f"Expected: {FEATURE_COLUMNS}\n"
            f"Model has: {model_features}"
        )


# =========================================================
# PHISHING EMAIL ANALYSIS
# =========================================================

def Phising_email(email_data):

    # =====================================================
    # 1. EXTRACT FEATURES
    # =====================================================

    features = extract_features(email_data)

    print("\n===== EXTRACTED FEATURES =====")

    for key, value in features.items():
        print(f"{key}: {value}")


    # =====================================================
    # 2. CREATE DATAFRAME
    # =====================================================

    # Select features by NAME, not manually by position.
    # This prevents feature-order mistakes.

    try:

        feature_df = pd.DataFrame(
            [features],
            columns=FEATURE_COLUMNS
        )

    except Exception as e:

        raise ValueError(
            f"Failed to create feature dataframe: {e}"
        )


    # =====================================================
    # 3. CHECK FOR MISSING FEATURES
    # =====================================================

    missing_features = [
        feature
        for feature in FEATURE_COLUMNS
        if feature not in features
    ]

    if missing_features:

        raise ValueError(
            f"Missing features: {missing_features}"
        )


    # =====================================================
    # 4. PREDICT
    # =====================================================

    try:

        prediction = model.predict(feature_df)

        probability = model.predict_proba(feature_df)

    except Exception as e:

        raise RuntimeError(
            f"ML prediction failed: {e}"
        )


    print("\n===== MODEL OUTPUT =====")

    print("Prediction:", prediction)
    print("Classes:", model.classes_)
    print("Probability:", probability)


    # =====================================================
    # 5. GET CLASS PROBABILITIES
    # =====================================================

    classes = list(model.classes_)

    if 1 not in classes or 0 not in classes:

        raise ValueError(
            "Model must contain both classes 0 (legitimate) "
            "and 1 (phishing)."
        )

    phishing_index = classes.index(1)
    legitimate_index = classes.index(0)

    phishing_score = (
        probability[0][phishing_index] * 100
    )

    legitimate_score = (
        probability[0][legitimate_index] * 100
    )


    # =====================================================
    # 6. FINAL ML CLASSIFICATION
    # =====================================================

    is_phishing = int(prediction[0]) == 1


    if is_phishing:

        ml_result = "PHISHING"

    else:

        ml_result = "LEGITIMATE"


    print(
        f"\nPhishing Risk Score: "
        f"{phishing_score:.2f}"
    )

    print(
        f"Legitimate Score: "
        f"{legitimate_score:.2f}"
    )

    print(
        f"ML Classification: {ml_result}"
    )


    # =====================================================
    # 7. PREPARE EMAIL DATA FOR AI
    # =====================================================

    subject = str(
        email_data.get("subject", "")
    )

    sender = str(
        email_data.get("from", "")
    )

    reply_to = str(
        email_data.get("reply_to", "")
    )

    body = str(
        email_data.get("body", "")
    )

    urls = email_data.get("urls", []) or []

    attachments = email_data.get(
        "attachments",
        []
    ) or []


    # =====================================================
    # 8. AI ANALYSIS
    # =====================================================

    ai_analysis = None

    Explanation = None


    # -----------------------------------------------------
    # OPTIONAL OPTIMIZATION
    # -----------------------------------------------------
    #
    # If ML strongly considers the email legitimate,
    # you can skip LLM to save API calls.
    #
    # -----------------------------------------------------

    if legitimate_score >= 75:

        Explanation = (
            "The machine-learning model classified this "
            "email as low phishing risk based on the "
            "extracted email features."
        )

        ai_analysis = None

    else:

        # =================================================
        # 9. LLM PROMPT
        # =================================================

        prompt = f"""
You are an expert email security analyst.

Analyze the following email for phishing and
social-engineering indicators.

IMPORTANT RULES:

1. Do NOT assume that a URL is malicious only because
   it is long.

2. Do NOT assume that a legitimate domain is malicious.

3. Do NOT invent URLs, domains, attachments, sender
   information, or other evidence.

4. Only report an indicator when there is evidence in
   the provided email.

5. The machine-learning score represents an EMAIL
   PHISHING RISK SCORE. It is not proof that a URL
   is malicious.

6. URL maliciousness should only be confirmed when
   actual URL reputation/threat-intelligence evidence
   is available.

7. If there is insufficient evidence, return false
   or null rather than guessing.

---------------------------------------------------------
EMAIL
---------------------------------------------------------

Subject:
{subject}

Sender:
{sender}

Reply-To:
{reply_to}

Body:
{body}

URLs extracted from the email:
{json.dumps(urls, indent=2)}

Attachments:
{json.dumps(attachments, indent=2)}

---------------------------------------------------------
MACHINE LEARNING ANALYSIS
---------------------------------------------------------

Phishing Risk Score:
{phishing_score:.2f}

Legitimate Score:
{legitimate_score:.2f}

ML Classification:
{ml_result}

Extracted Features:
{json.dumps(features, indent=2)}

---------------------------------------------------------
ANALYZE THESE INDICATORS
---------------------------------------------------------

1. Suspicious sender
2. Spoofed sender
3. Lookalike domain
4. Malicious URL
5. Shortened URL
6. Obfuscated URL
7. Suspicious attachment
8. Fake login page
9. Credential harvesting
10. Suspicious redirects

For URL-related indicators:

- Return the actual URL from the email when applicable.
- Never create or modify a URL.
- A long URL alone is NOT malicious.
- A suspicious-looking URL is NOT automatically malicious.
- If there is no evidence, return false/null.

For every other indicator, provide a short explanation
based only on evidence present in the email.

Finally provide one concise overall explanation.

Do not invent information.
"""


        # =================================================
        # 10. JSON SCHEMA
        # =================================================

        schema = Phising_indicate.model_json_schema()


        # =================================================
        # 11. GROQ REQUEST
        # =================================================

        try:

            response = client.chat.completions.create(

                model="openai/gpt-oss-safeguard-20b",

                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert email "
                            "security analyst. "
                            "Never invent evidence."
                        )
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

        except Exception as e:

            print(
                f"LLM analysis failed: {e}"
            )

            ai_analysis = None

            Explanation = (
                "ML analysis completed, but AI explanation "
                "was unavailable."
            )

        else:

            # =============================================
            # 12. PARSE AI RESPONSE
            # =============================================

            ai_analysis = (
                response
                .choices[0]
                .message
                .content
            )

            try:

                ai_analysis_data = json.loads(
                    ai_analysis
                )

                Explanation = (
                    ai_analysis_data.get(
                        "Explanation"
                    )
                )

            except json.JSONDecodeError:

                print(
                    "Invalid JSON returned by AI."
                )

                Explanation = (
                    "ML analysis completed, but the "
                    "AI response could not be parsed."
                )


        print("\n===== AI ANALYSIS =====")

        print(ai_analysis)


    # =====================================================
    # 13. RETURN FINAL RESULT
    # =====================================================

    return {

        "features": features,

        "prediction": int(
            prediction[0]
        ),

        "phishing_score": round(
            phishing_score,
            2
        ),

        "legitimate_score": round(
            legitimate_score,
            2
        ),

        "explanation": Explanation,

        "ai_analysis": ai_analysis
    }