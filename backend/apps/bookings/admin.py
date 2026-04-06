from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.http import HttpResponseRedirect
from django.utils import timezone
from .models import Booking, BookingTimeSlot


class BookingTimeSlotInline(admin.TabularInline):
    model = BookingTimeSlot
    extra = 0


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'customer_name', 'field', 'booking_date', 'status_badge',
        'total_amount', 'action_buttons', 'created_at'
    ]
    list_filter = ['status', 'booking_date', 'field']
    search_fields = ['customer_name', 'customer_phone', 'customer_email']
    readonly_fields = ['created_at', 'updated_at', 'user', 'total_amount', 'deposit_amount']
    inlines = [BookingTimeSlotInline]
    actions = ['action_confirm_booking', 'action_complete_booking', 'action_cancel_booking']

    fieldsets = (
        ('Thông tin khách hàng', {
            'fields': ('user', 'customer_name', 'customer_phone', 'customer_email')
        }),
        ('Thông tin đặt sân', {
            'fields': ('field', 'booking_date', 'total_amount', 'deposit_amount', 'notes')
        }),
        ('Trạng thái', {
            'fields': ('status',)
        }),
        ('Thời gian', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        """Hiển thị status dưới dạng badge màu"""
        colors = {
            'pending_payment': 'orange',
            'confirmed': '#28a745',
            'completed': '#007bff',
            'cancelled': '#dc3545',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Trạng thái'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:booking_id>/confirm/', self.admin_site.admin_view(self.confirm_booking_view), name='bookings_booking_confirm'),
            path('<int:booking_id>/complete/', self.admin_site.admin_view(self.complete_booking_view), name='bookings_booking_complete'),
            path('<int:booking_id>/cancel/', self.admin_site.admin_view(self.cancel_booking_view), name='bookings_booking_cancel'),
        ]
        return custom_urls + urls

    def action_buttons(self, obj):
        """Hiển thị các nút hành động trực tiếp từ list display"""
        buttons_html = []
        
        if obj.status == 'pending_payment':
            confirm_url = reverse('admin:bookings_booking_confirm', args=[obj.id])
            buttons_html.append(
                '<a class="button" style="background-color: #417690; margin-right: 5px;" '
                f'href="{confirm_url}" '
                'onclick="return confirm(\'Xác nhận đặt sân này?\');">✓ Xác nhận</a>'
            )
        
        if obj.status == 'confirmed':
            complete_url = reverse('admin:bookings_booking_complete', args=[obj.id])
            buttons_html.append(
                '<a class="button" style="background-color: #28a745; margin-right: 5px;" '
                f'href="{complete_url}" '
                'onclick="return confirm(\'Đánh dấu đặt sân này là hoàn thành?\');">✓ Hoàn thành</a>'
            )
        
        if obj.status in ['pending_payment', 'confirmed']:
            cancel_url = reverse('admin:bookings_booking_cancel', args=[obj.id])
            buttons_html.append(
                '<a class="button" style="background-color: #dc3545;" '
                f'href="{cancel_url}" '
                'onclick="return confirm(\'Hủy đặt sân này?\');">✕ Hủy</a>'
            )
        
        return format_html(''.join(buttons_html))
    action_buttons.short_description = 'Hành động'

    def action_confirm_booking(self, request, queryset):
        """Admin action: xác nhận đặt sân"""
        confirmed_count = 0
        for booking in queryset:
            if booking.status == 'pending_payment':
                booking.status = 'confirmed'
                booking.save(update_fields=['status', 'updated_at'])
                confirmed_count += 1
        
        self.message_user(
            request,
            f'Đã xác nhận {confirmed_count} đặt sân thành công.',
            level='success'
        )
    action_confirm_booking.short_description = '✓ Xác nhận đặt sân đã chọn'

    def action_complete_booking(self, request, queryset):
        """Admin action: hoàn thành đặt sân"""
        completed_count = 0
        for booking in queryset:
            if booking.status == 'confirmed':
                booking.status = 'completed'
                booking.save(update_fields=['status', 'updated_at'])
                completed_count += 1
        
        self.message_user(
            request,
            f'Đã hoàn thành {completed_count} đặt sân.',
            level='success'
        )
    action_complete_booking.short_description = '✓ Đánh dấu hoàn thành'

    def action_cancel_booking(self, request, queryset):
        """Admin action: hủy đặt sân"""
        cancelled_count = 0
        for booking in queryset:
            if booking.status in ['pending_payment', 'confirmed']:
                booking.status = 'cancelled'
                booking.save(update_fields=['status', 'updated_at'])
                cancelled_count += 1
        
        self.message_user(
            request,
            f'Đã hủy {cancelled_count} đặt sân.',
            level='warning'
        )
    action_cancel_booking.short_description = '✕ Hủy đặt sân đã chọn'

    def confirm_booking_view(self, request, booking_id):
        booking = self.get_object(request, booking_id)
        if booking is None:
            return HttpResponseRedirect(reverse('admin:bookings_booking_changelist'))

        if booking.status == 'pending_payment':
            booking.status = 'confirmed'
            booking.save(update_fields=['status', 'updated_at'])
            self.message_user(request, 'Đã xác nhận booking thành công.', level='success')
        else:
            self.message_user(request, 'Booking không ở trạng thái chờ thanh toán.', level='error')

        return HttpResponseRedirect(reverse('admin:bookings_booking_changelist'))

    def complete_booking_view(self, request, booking_id):
        booking = self.get_object(request, booking_id)
        if booking is None:
            return HttpResponseRedirect(reverse('admin:bookings_booking_changelist'))

        if booking.status == 'confirmed':
            booking.status = 'completed'
            booking.save(update_fields=['status', 'updated_at'])
            self.message_user(request, 'Đã đánh dấu booking là hoàn thành.', level='success')
        else:
            self.message_user(request, 'Booking phải ở trạng thái đã xác nhận để hoàn thành.', level='error')

        return HttpResponseRedirect(reverse('admin:bookings_booking_changelist'))

    def cancel_booking_view(self, request, booking_id):
        booking = self.get_object(request, booking_id)
        if booking is None:
            return HttpResponseRedirect(reverse('admin:bookings_booking_changelist'))

        if booking.status in ['pending_payment', 'confirmed']:
            booking.status = 'cancelled'
            booking.save(update_fields=['status', 'updated_at'])
            self.message_user(request, 'Đã hủy booking.', level='warning')
        else:
            self.message_user(request, 'Booking không thể hủy ở trạng thái hiện tại.', level='error')

        return HttpResponseRedirect(reverse('admin:bookings_booking_changelist'))


@admin.register(BookingTimeSlot)
class BookingTimeSlotAdmin(admin.ModelAdmin):
    list_display = ['id', 'booking', 'timeslot']
    list_filter = ['timeslot']