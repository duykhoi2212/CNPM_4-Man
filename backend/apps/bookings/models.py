from django.db import models
from django.contrib.auth.models import User
from apps.fields.models import Field, TimeSlot


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),
        ('confirmed', 'Đã xác nhận'),
        ('completed', 'Hoàn thành'),
        ('cancelled', 'Đã hủy'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name='Người đặt'
    )
    field = models.ForeignKey(
        Field,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name='Sân bóng'
    )
    booking_date = models.DateField(verbose_name='Ngày đặt sân')
    customer_name = models.CharField(max_length=100, verbose_name='Tên khách hàng')
    customer_phone = models.CharField(max_length=15, verbose_name='Số điện thoại')
    customer_email = models.EmailField(verbose_name='Email')
    notes = models.TextField(null=True, blank=True, verbose_name='Ghi chú')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Tổng tiền')
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Tiền đặt cọc')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Trạng thái'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings'
        verbose_name = 'Đơn đặt sân'
        verbose_name_plural = 'Đơn đặt sân'
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.pk} - {self.customer_name} - {self.field} ({self.booking_date})"


class BookingTimeSlot(models.Model):
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='booking_timeslots',
        verbose_name='Đơn đặt'
    )
    timeslot = models.ForeignKey(
        TimeSlot,
        on_delete=models.RESTRICT,
        related_name='booking_timeslots',
        verbose_name='Khung giờ'
    )

    class Meta:
        db_table = 'booking_timeslots'
        verbose_name = 'Khung giờ đặt'
        verbose_name_plural = 'Khung giờ đặt'
        unique_together = ['booking', 'timeslot']

    def __str__(self):
        return f"Booking #{self.booking.pk} - {self.timeslot}"