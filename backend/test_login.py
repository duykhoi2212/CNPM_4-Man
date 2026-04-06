import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

# Test login với username
user = authenticate(username='cttt', password='123456')
print(f"Login with username='cttt', password='123456': {user}")

if user:
    token = Token.objects.get(user=user)
    print(f"Token: {token.key}")
else:
    print("Authentication failed!")
    # Check if user exists
    try:
        existing_user = User.objects.get(username='cttt')
        print(f"User exists: {existing_user}")
        print(f"Is active: {existing_user.is_active}")
    except User.DoesNotExist:
        print("User not found!")
