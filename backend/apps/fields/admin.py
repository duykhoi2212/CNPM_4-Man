# apps/fields/admin.py
from django.contrib import admin
from .models import FieldType, Field, FieldImage, TimeSlot

@admin.register(FieldType)
class FieldTypeAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']

class FieldImageInline(admin.TabularInline):
    model = FieldImage
    extra = 1

class TimeSlotInline(admin.TabularInline):
    model = TimeSlot
    extra = 1

@admin.register(Field)
class FieldAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'field_type', 'owner', 'price_per_hour', 'is_active']
    list_filter = ['field_type', 'is_active', 'owner']
    search_fields = ['name', 'location']
    inlines = [FieldImageInline, TimeSlotInline]

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['id', 'field', 'start_time', 'end_time', 'price', 'is_peak_hour', 'is_active']  # ✅ sửa ở đây
    list_filter = ['is_active', 'is_peak_hour']  # ✅ sửa ở đây
    search_fields = ['field__name']
