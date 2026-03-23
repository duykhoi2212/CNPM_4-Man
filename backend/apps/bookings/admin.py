from django.contrib import admin
from .models import Booking, BookingTimeSlot

class BookingTimeSlotInline(admin.TabularInline):
    model = BookingTimeSlot
    extra = 0

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer_name', 'field', 'booking_date', 'status', 'total_amount', 'created_at']
    list_filter = ['status', 'booking_date', 'field']
    search_fields = ['customer_name', 'customer_phone', 'customer_email']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [BookingTimeSlotInline]

@admin.register(BookingTimeSlot)
class BookingTimeSlotAdmin(admin.ModelAdmin):
    list_display = ['id', 'booking', 'timeslot']
    list_filter = ['timeslot']