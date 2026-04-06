import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.fields.models import Field, TimeSlot
from datetime import time

# Kiểm tra xem có sân nào không
fields = Field.objects.all()
print(f"Tổng số sân: {fields.count()}")

if fields.count() == 0:
    print("\n⚠️ Chưa có sân nào trong hệ thống!")
    print("Vui lòng tạo sân trước khi thêm khung giờ.")
else:
    # Khung giờ mẫu
    time_slots = [
        {"start": "06:00", "end": "07:00", "is_peak": False},
        {"start": "07:00", "end": "08:00", "is_peak": False},
        {"start": "08:00", "end": "09:00", "is_peak": False},
        {"start": "09:00", "end": "10:00", "is_peak": False},
        {"start": "10:00", "end": "11:00", "is_peak": False},
        {"start": "11:00", "end": "12:00", "is_peak": False},
        {"start": "12:00", "end": "13:00", "is_peak": True},   # Trưa
        {"start": "13:00", "end": "14:00", "is_peak": True},   # Trưa
        {"start": "14:00", "end": "15:00", "is_peak": False},
        {"start": "15:00", "end": "16:00", "is_peak": False},
        {"start": "16:00", "end": "17:00", "is_peak": False},
        {"start": "17:00", "end": "18:00", "is_peak": True},   # Chiều tối
        {"start": "18:00", "end": "19:00", "is_peak": True},   # Chiều tối
        {"start": "19:00", "end": "20:00", "is_peak": True},   # Tối
        {"start": "20:00", "end": "21:00", "is_peak": True},   # Tối
        {"start": "21:00", "end": "22:00", "is_peak": False},
    ]
    
    for field in fields:
        print(f"\n📍 Sân: {field.name}")
        
        for slot in time_slots:
            start_time = time.fromisoformat(slot["start"])
            end_time = time.fromisoformat(slot["end"])
            
            # Sử dụng peak_hour_price nếu là giờ cao điểm, nếu không dùng price_per_hour
            price = field.peak_hour_price if slot["is_peak"] else field.price_per_hour
            
            obj, created = TimeSlot.objects.get_or_create(
                field=field,
                start_time=start_time,
                end_time=end_time,
                defaults={
                    "price": price,
                    "is_peak_hour": slot["is_peak"],
                    "is_active": True
                }
            )
            
            if created:
                print(f"  ✓ {slot['start']}-{slot['end']} ({price} VND)" + (' [PEAK]' if slot['is_peak'] else ''))
            else:
                print(f"  → {slot['start']}-{slot['end']} (đã tồn tại)")

print("\n✓ Hoàn tất!")
