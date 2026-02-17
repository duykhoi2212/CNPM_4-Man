from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'booking', 'payment_method', 'amount', 'status', 'paid_at', 'created_at']
    list_filter = ['status', 'payment_method']
    search_fields = ['transaction_id', 'booking__customer_name']
    readonly_fields = ['created_at']
