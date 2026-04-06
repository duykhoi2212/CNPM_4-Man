import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import UserProfile

# Kiểm tra user cttt
user = User.objects.get(username='cttt')
print(f"User: {user.username}")
print(f"Email: {user.email}")

# Kiểm tra có profile không
try:
    profile = user.profile
    print(f"Profile exists: {profile.phone}")
except UserProfile.DoesNotExist:
    print("❌ Profile không tồn tại!")
    print("\nTạo profile cho user...")
    
    # Tạo profile
    profile = UserProfile.objects.create(
        user=user,
        phone='0999999999',  # Phone required
        address='123 Địa chỉ'
    )
    print(f"✓ Profile tạo thành công!")
    print(f"  Phone: {profile.phone}")
    print(f"  Address: {profile.address}")
