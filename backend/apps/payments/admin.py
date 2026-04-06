from django.contrib import admin
from .models import Payment, PaymentQR

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'booking', 'payment_method', 'amount', 'status', 'paid_at', 'created_at']
    list_filter = ['status', 'payment_method']
    search_fields = ['transaction_id', 'booking__customer_name']
    readonly_fields = ['created_at']


@admin.register(PaymentQR)
class PaymentQRAdmin(admin.ModelAdmin):
    list_display = ['name', 'payment_method', 'is_active', 'created_at', 'updated_at']
    list_filter = ['payment_method', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Thong tin co ban', {
            'fields': ('name', 'payment_method', 'is_active')
        }),
        ('Anh QR', {
            'fields': ('qr_image',),
            'description': 'Upload anh QR code duoi dang base64 data URL'
        }),
        ('Thong tin them', {
            'fields': ('description',),
            'classes': ('collapse',)
        }),
        ('Thoi gian', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_delete_permission(self, request, obj=None):
        # Cho phép xóa nếu không phải QR code đang active
        if obj and obj.is_active:
            return False
        return super().has_delete_permission(request, obj)
