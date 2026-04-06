from django.db import models
from apps.bookings.models import Booking


class Payment(models.Model):
    METHOD_CHOICES = [
        ('bank_transfer', 'Chuyen khoan ngan hang'),
        ('momo', 'MoMo'),
        ('vnpay', 'VNPay'),
        ('cash', 'Tien mat'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Cho thanh toan'),
        ('user_confirmed', 'Nguoi dung da thanh toan - cho xac nhan admin'),
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
    qr_code = models.TextField(
        null=True,
        blank=True,
        verbose_name='Ma QR (data URL)'
    )
    expiry_time = models.DateTimeField(null=True, blank=True, verbose_name='Thoi han thanh toan')
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='Thoi gian thanh toan')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Thanh toan'
        verbose_name_plural = 'Thanh toan'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.pk} - Booking #{self.booking.pk} - {self.get_status_display()}"


class PaymentQR(models.Model):
    """
    Model để lưu trữ QR codes cho các phương thức thanh toán
    """
    METHOD_CHOICES = [
        ('bank_transfer', 'Chuyen khoan ngan hang'),
        ('momo', 'MoMo'),
        ('vnpay', 'VNPay'),
        ('all', 'Tat ca phuong thuc'),
    ]

    name = models.CharField(
        max_length=100,
        verbose_name='Ten QR code',
        help_text='Ten de nhan biet QR code'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=METHOD_CHOICES,
        default='all',
        verbose_name='Phuong thuc thanh toan',
        help_text='Phuong thuc thanh toan ma QR code nay su dung'
    )
    qr_image = models.TextField(
        verbose_name='Anh QR (base64)',
        help_text='Anh QR code duoi dang base64 data URL'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Dang hoat dong',
        help_text='Chi su dung QR code dang active'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Mo ta',
        help_text='Thong tin them ve QR code'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngay tao')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngay cap nhat')

    class Meta:
        db_table = 'payment_qr_codes'
        verbose_name = 'QR Code thanh toan'
        verbose_name_plural = 'QR Codes thanh toan'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.get_payment_method_display()} - {'Active' if self.is_active else 'Inactive'}"

    @property
    def is_image_valid(self):
        """Kiểm tra QR image có hợp lệ không"""
        return self.qr_image.startswith('data:image/') if self.qr_image else False


class PaymentQR(models.Model):
    """
    Model để lưu trữ QR codes cho các phương thức thanh toán
    """
    METHOD_CHOICES = [
        ('bank_transfer', 'Chuyen khoan ngan hang'),
        ('momo', 'MoMo'),
        ('vnpay', 'VNPay'),
        ('all', 'Tat ca phuong thuc'),
    ]

    name = models.CharField(
        max_length=100,
        verbose_name='Ten QR code',
        help_text='Ten de nhan biet QR code'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=METHOD_CHOICES,
        default='all',
        verbose_name='Phuong thuc thanh toan',
        help_text='Phuong thuc thanh toan ma QR code nay su dung'
    )
    qr_image = models.TextField(
        verbose_name='Anh QR (base64)',
        help_text='Anh QR code duoi dang base64 data URL'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Dang hoat dong',
        help_text='Chi su dung QR code dang active'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Mo ta',
        help_text='Thong tin them ve QR code'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngay tao')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngay cap nhat')

    class Meta:
        db_table = 'payment_qr_codes'
        verbose_name = 'QR Code thanh toan'
        verbose_name_plural = 'QR Codes thanh toan'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.get_payment_method_display()} - {'Active' if self.is_active else 'Inactive'}"

    @property
    def is_image_valid(self):
        """Kiểm tra QR image có hợp lệ không"""
        return self.qr_image.startswith('data:image/') if self.qr_image else False
