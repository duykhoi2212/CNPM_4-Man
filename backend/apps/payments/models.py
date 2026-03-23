from django.db import models
from apps.bookings.models import Booking


class Payment(models.Model):
    METHOD_CHOICES = [
        ('atm', 'ATM'),
        ('momo', 'MoMo'),
        ('zalopay', 'ZaloPay'),
        ('bank_transfer', 'Chuyển khoản ngân hàng'),
        ('cash', 'Tiền mặt'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Chờ thanh toán'),
        ('completed', 'Đã thanh toán'),
        ('failed', 'Thất bại'),
        ('refunded', 'Đã hoàn tiền'),
    ]

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='payment',
        verbose_name='Đơn đặt sân'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=METHOD_CHOICES,
        verbose_name='Phương thức thanh toán'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Số tiền')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Trạng thái'
    )
    transaction_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Mã giao dịch'
    )
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian thanh toán')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Thanh toán'
        verbose_name_plural = 'Thanh toán'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.pk} - Booking #{self.booking.pk} - {self.get_status_display()}"