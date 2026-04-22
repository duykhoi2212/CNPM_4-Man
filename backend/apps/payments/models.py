from django.db import models
from apps.bookings.models import Booking


class Payment(models.Model):
    METHOD_CHOICES = [
        ('vnpay', 'VNPay'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Cho thanh toan'),
        ('completed', 'Da thanh toan'),
        ('failed', 'That bai'),
        ('refunded', 'Da hoan tien'),
    ]

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='payment',
        verbose_name='Don dat san'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=METHOD_CHOICES,
        verbose_name='Phuong thuc thanh toan'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='So tien')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Trang thai'
    )
    transaction_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Ma giao dich'
    )
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='Thoi gian thanh toan')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Thanh toan'
        verbose_name_plural = 'Thanh toan'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.pk} - Booking #{self.booking.pk} - {self.get_status_display()}"
