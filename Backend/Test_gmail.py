from Gmail_Auth import authenticate_gmail

credentials = authenticate_gmail()

print("Authentication successful!")
print(credentials.token)