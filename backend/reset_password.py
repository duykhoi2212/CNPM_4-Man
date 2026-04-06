import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

# Reset password for cttt
user = User.objects.get(username='cttt')
user.set_password('Cttt@123456')  # Strong password
user.save()

print(f"Password reset for user: {user.username}")
print(f"New password: Cttt@123456")

# Verify login
from django.contrib.auth import authenticate
test_user = authenticate(username='cttt', password='Cttt@123456')
if test_user:
    print("✓ Password verification successful!")
else:
    print("✗ Password verification failed!")
