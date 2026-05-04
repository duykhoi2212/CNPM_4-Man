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
    field_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Tiền sân')
    service_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Tiền dịch vụ')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Tổng tiền')
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Tiền đặt cọc')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending_payment',
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

    @property
    def remaining_amount(self):
        return self.total_amount - self.deposit_amount

    @property
    def payable_now_amount(self):
        return (self.deposit_amount or Decimal('0.00')) + (self.service_amount or Decimal('0.00'))


class ServiceProduct(models.Model):
    id = models.AutoField(primary_key=True)

    name = models.CharField(max_length=120, verbose_name='Tên dịch vụ')
    code = models.CharField(max_length=40, unique=True, verbose_name='Mã dịch vụ')
    unit_label = models.CharField(max_length=40, default='đơn vị', verbose_name='Đơn vị tính')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Đơn giá')
    is_active = models.BooleanField(default=True, verbose_name='Đang kinh doanh')
    sort_order = models.PositiveIntegerField(default=0, verbose_name='Thứ tự hiển thị')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'service_products'
        verbose_name = 'Sản phẩm dịch vụ'
        verbose_name_plural = 'Sản phẩm dịch vụ'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.unit_price})"


class BookingServiceItem(models.Model):
    id = models.AutoField(primary_key=True)

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='service_items',
        verbose_name='Đơn đặt',
    )
    service_product = models.ForeignKey(
        ServiceProduct,
        on_delete=models.SET_NULL,
        related_name='booking_items',
        null=True,
        blank=True,
        verbose_name='Sản phẩm dịch vụ',
    )
    service_name_snapshot = models.CharField(max_length=120, verbose_name='Tên dịch vụ tại thời điểm đặt')
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Đơn giá tại thời điểm đặt')
    unit_label_snapshot = models.CharField(max_length=40, default='đơn vị', verbose_name='Đơn vị tính tại thời điểm đặt')
    quantity = models.PositiveIntegerField(default=1, verbose_name='Số lượng')
    line_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Thành tiền')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'booking_service_items'
        verbose_name = 'Mục dịch vụ booking'
        verbose_name_plural = 'Mục dịch vụ booking'
        ordering = ['id']

    def __str__(self):
        return f"Booking #{self.booking_id} - {self.service_name_snapshot} x {self.quantity}"


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
