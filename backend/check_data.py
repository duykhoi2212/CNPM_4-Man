import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.fields.models import Field, FieldType, TimeSlot

print("=" * 60)
print("KIỂM TRA DỮ LIỆU FIELDS VÀ TIMESLOTS")
print("=" * 60)

# FieldType
field_types = FieldType.objects.all()
print(f"\n📋 Loại sân (FieldType): {field_types.count()}")
for ft in field_types:
    print(f"   {ft.id}. {ft.name} - {ft.description}")

# Field
fields = Field.objects.all()
print(f"\n⚽ Sân bóng (Field): {fields.count()}")
for field in fields:
    timeslot_count = field.time_slots.count()
    print(f"   {field.id}. {field.name} ({field.field_type.name})")
    print(f"      Giá: {field.price_per_hour} vnđ (thường) / {field.peak_hour_price} vnđ (cao điểm)")
    print(f"      TimeSlot: {timeslot_count}")

# TimeSlot
timeslots = TimeSlot.objects.all()
print(f"\n⏰ Khung giờ (TimeSlot): {timeslots.count()}")

if timeslots.count() == 0:
    print("   ⚠️ Chưa có khung giờ nào!")
else:
    for field in fields:
        slots = field.time_slots.all().order_by('start_time')
        print(f"\n   {field.name}:")
        for slot in slots:
            peak = "[PEAK]" if slot.is_peak_hour else ""
            print(f"      {slot.start_time}-{slot.end_time}: {slot.price} vnđ {peak}")

print("\n" + "=" * 60)
