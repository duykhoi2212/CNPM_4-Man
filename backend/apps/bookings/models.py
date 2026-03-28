from django.db import models
from django.contrib.auth.models import User
from apps.fields.models import Field, TimeSlot


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending_payment', 'Cho thanh toan coc'),
        ('confirmed', 'Da xac nhan'),
        ('completed', 'Hoan thanh'),
        ('cancelled', 'Da huy'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name='Nguoi dat'
    )
    field = models.ForeignKey(
        Field,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name='San bong'
    )
    booking_date = models.DateField(verbose_name='Ngay dat san')
    customer_name = models.CharField(max_length=100, verbose_name='Ten khach hang')
    customer_phone = models.CharField(max_length=15, verbose_name='So dien thoai')
    customer_email = models.EmailField(verbose_name='Email')
    notes = models.TextField(null=True, blank=True, verbose_name='Ghi chu')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Tong tien')
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Tien dat coc')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending_payment',
        verbose_name='Trang thai'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings'
        verbose_name = 'Don dat san'
        verbose_name_plural = 'Don dat san'
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.pk} - {self.customer_name} - {self.field} ({self.booking_date})"

    @property
    def remaining_amount(self):
        return self.total_amount - self.deposit_amount


class BookingTimeSlot(models.Model):
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='booking_timeslots',
        verbose_name='Don dat'
    )
    timeslot = models.ForeignKey(
        TimeSlot,
        on_delete=models.RESTRICT,
        related_name='booking_timeslots',
        verbose_name='Khung gio'
    )

    class Meta:
        db_table = 'booking_timeslots'
        verbose_name = 'Khung gio dat'
        verbose_name_plural = 'Khung gio dat'
        unique_together = ['booking', 'timeslot']

    def __str__(self):
        return f"Booking #{self.booking.pk} - {self.timeslot}"
