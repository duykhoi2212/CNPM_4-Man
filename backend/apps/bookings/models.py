from decimal import Decimal

from django.db import models
from django.contrib.auth.models import User
from apps.fields.models import Field, TimeSlot


class Booking(models.Model):
    id = models.AutoField(primary_key=True)

    STATUS_CHOICES = [
        ('pending_payment', 'Chờ thanh toán cập'),
        ('confirmed', 'Đã xác nhận'),
        ('completed', 'Hoàn thành'),
        ('cancelled', 'Đã hủy'),
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
    field_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Tien san')
    service_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Tien dich vu')
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

    @property
    def payable_now_amount(self):
        return (self.deposit_amount or Decimal('0.00')) + (self.service_amount or Decimal('0.00'))


class ServiceProduct(models.Model):
    id = models.AutoField(primary_key=True)

    name = models.CharField(max_length=120, verbose_name='Ten dich vu')
    code = models.CharField(max_length=40, unique=True, verbose_name='Ma dich vu')
    unit_label = models.CharField(max_length=40, default='don vi', verbose_name='Don vi tinh')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Don gia')
    is_active = models.BooleanField(default=True, verbose_name='Dang kinh doanh')
    sort_order = models.PositiveIntegerField(default=0, verbose_name='Thu tu hien thi')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'service_products'
        verbose_name = 'San pham dich vu'
        verbose_name_plural = 'San pham dich vu'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.unit_price})"


class BookingServiceItem(models.Model):
    id = models.AutoField(primary_key=True)

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='service_items',
        verbose_name='Don dat',
    )
    service_product = models.ForeignKey(
        ServiceProduct,
        on_delete=models.SET_NULL,
        related_name='booking_items',
        null=True,
        blank=True,
        verbose_name='San pham dich vu',
    )
    service_name_snapshot = models.CharField(max_length=120, verbose_name='Ten dich vu tai thoi diem dat')
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Don gia tai thoi diem dat')
    unit_label_snapshot = models.CharField(max_length=40, default='don vi', verbose_name='Don vi tinh tai thoi diem dat')
    quantity = models.PositiveIntegerField(default=1, verbose_name='So luong')
    line_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Thanh tien')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'booking_service_items'
        verbose_name = 'Dong dich vu booking'
        verbose_name_plural = 'Dong dich vu booking'
        ordering = ['id']

    def __str__(self):
        return f"Booking #{self.booking_id} - {self.service_name_snapshot} x {self.quantity}"


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
