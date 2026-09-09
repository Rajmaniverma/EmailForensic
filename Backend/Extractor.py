import os 
import re
from Mlanalysis.extract_feature import extract_features

from email import policy
from Email_parser import parse_email

file_path = "Requirement/Email.eml"

email_data = parse_email(file_path)



features = extract_features(email_data)

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

print(feature_values)

