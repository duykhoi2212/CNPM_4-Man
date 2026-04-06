import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

# Kiểm tra user
user = User.objects.get(username='cttt')
print(f"User found: {user.username}")
print(f"Is active: {user.is_active}")
print(f"Is staff: {user.is_staff}")
print(f"Email: {user.email}")

# Xóa token cũ và tạo mới
Token.objects.filter(user=user).delete()
token, created = Token.objects.get_or_create(user=user)
print(f"Token: {token.key}")
print("Token created/retrieved successfully")
