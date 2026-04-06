import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.fields.models import FieldType

# Danh sách loại sân thường gặp
field_types = [
    {"name": "Sân 5 người", "description": "Sân bóng mini, phù hợp cho nhóm nhỏ"},
    {"name": "Sân 7 người", "description": "Sân bóng vừa, phù hợp cho đội bóng học sinh"},
    {"name": "Sân 11 người", "description": "Sân bóng tiêu chuẩn, phù hợp cho giải đấu"},
    {"name": "Sân futsal", "description": "Sân bóng trong nhà, mặt sân là gạch hoặc thảm"},
]

for ft in field_types:
    obj, created = FieldType.objects.get_or_create(
        name=ft["name"],
        defaults={"description": ft["description"]}
    )
    if created:
        print(f"✓ Tạo: {obj.name}")
    else:
        print(f"→ Đã tồn tại: {obj.name}")

print("\n✓ Hoàn tất!")
