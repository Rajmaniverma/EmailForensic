from email import policy
from email.parser import BytesParser

with open("Requirement/Email.eml", "rb") as file:
    email_content = file.read()

msg = BytesParser(policy=policy.default).parsebytes(email_content)

print("From:", msg["From"])
print("To:", msg["To"])
print("Subject:", msg["Subject"])
print("Date:", msg["Date"])
print("Reply-To:", msg["Reply-To"])
