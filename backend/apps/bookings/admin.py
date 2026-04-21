from django.contrib import admin
from .models import Booking, BookingTimeSlot, ServiceProduct, BookingServiceItem

class BookingTimeSlotInline(admin.TabularInline):
    model = BookingTimeSlot
    extra = 0

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer_name', 'field', 'booking_date', 'status', 'field_amount', 'service_amount', 'total_amount', 'created_at']
    list_filter = ['status', 'booking_date', 'field']
    search_fields = ['customer_name', 'customer_phone', 'customer_email']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [BookingTimeSlotInline]

@admin.register(BookingTimeSlot)
class BookingTimeSlotAdmin(admin.ModelAdmin):
    list_display = ['id', 'booking', 'timeslot']
    list_filter = ['timeslot']


@admin.register(ServiceProduct)
class ServiceProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code', 'unit_price', 'unit_label', 'is_active', 'sort_order']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(BookingServiceItem)
class BookingServiceItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'booking', 'service_name_snapshot', 'quantity', 'unit_price_snapshot', 'line_total']
    search_fields = ['booking__id', 'service_name_snapshot']