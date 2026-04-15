from django.db import models
from django.contrib.auth.models import User


class IncidentReport(models.Model):
    """
    Bao cao su co khi dang su dung san
    """
    STATUS_CHOICES = [
        ('pending', 'Cho xu ly'),
        ('investigating', 'Dang dieu tra'),
        ('resolving', 'Dang giai quyet'),
        ('resolved', 'Da giai quyet'),
        ('cancelled', 'Da huy'),
    ]

    ISSUE_TYPE_CHOICES = [
        ('field_damage', 'San bi hu hong (den, co, mat san, ...)'),
        ('weather', 'Thoi tiet xau'),
        ('emergency', 'Su co khan cap'),
        ('equipment', 'Thiet bi hu hong'),
        ('safety', 'Van de an toan'),
        ('other', 'Khac'),
    ]

    SEVERITY_CHOICES = [
        ('low', 'Thap - Co the tiep tuc choi'),
        ('medium', 'Trung binh - Nen doi san'),
        ('high', 'Cao - Buoc phai dung choi'),
    ]

    field = models.ForeignKey(
        'fields.Field',
        on_delete=models.CASCADE,
        related_name='incidents',
        verbose_name='San bong'
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='incidents',
        verbose_name='Booking lien quan'
    )
    reported_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reported_incidents',
        verbose_name='Nguoi bao cao'
    )
    issue_type = models.CharField(
        max_length=20,
        choices=ISSUE_TYPE_CHOICES,
        verbose_name='Loai su co'
    )
    severity = models.CharField(
        max_length=10,
        choices=SEVERITY_CHOICES,
        default='medium',
        verbose_name='Muc do nghiem trong'
    )
    description = models.TextField(verbose_name='Mo ta chi tiet')
    photos = models.JSONField(blank=True, default=list, verbose_name='URL anh su co')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Trang thai'
    )
    admin_notes = models.TextField(blank=True, default='', verbose_name='Ghi chu admin')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngay tao')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngay cap nhat')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngay giai quyet')

    class Meta:
        db_table = 'incident_reports'
        verbose_name = 'Bao cao su co'
        verbose_name_plural = 'Bao cao su co'
        ordering = ['-created_at']

    def __str__(self):
        return f"Su co {self.get_issue_type_display()} - {self.field.name} ({self.status})"


class FieldSwap(models.Model):
    """
    Xu ly doi san khi co su co
    """
    STATUS_CHOICES = [
        ('pending', 'Cho xac nhan'),
        ('searching', 'Dang tim san thay the'),
        ('proposed', 'Da de xuat'),
        ('confirmed', 'Da xac nhan'),
        ('completed', 'Da hoan thanh'),
        ('cancelled', 'Da huy'),
        ('failed', 'Khong the doi'),
    ]

    incident = models.ForeignKey(
        IncidentReport,
        on_delete=models.CASCADE,
        related_name='swaps',
        verbose_name='Su co lien quan'
    )
    original_field = models.ForeignKey(
        'fields.Field',
        on_delete=models.CASCADE,
        related_name='swap_originals',
        verbose_name='San cu'
    )
    new_field = models.ForeignKey(
        'fields.Field',
        on_delete=models.CASCADE,
        related_name='swap_news',
        null=True,
        blank=True,
        verbose_name='San moi'
    )
    original_booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='swap_originals',
        verbose_name='Booking cu'
    )
    new_booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        related_name='swap_news',
        null=True,
        blank=True,
        verbose_name='Booking moi'
    )
    price_difference = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Chenh lech gia (VND)'
    )
    compensation_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Boi thuong (VND)'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Trang thai'
    )
    swap_reason = models.TextField(verbose_name='Ly do doi san')
    customer_notified = models.BooleanField(default=False, verbose_name='Da thong bao khach?')
    customer_accepted = models.BooleanField(null=True, verbose_name='Khach da chap nhan?')
    admin_notes = models.TextField(blank=True, default='', verbose_name='Ghi chu admin')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngay tao')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngay cap nhat')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngay xac nhan')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngay hoan thanh')

    class Meta:
        db_table = 'field_swaps'
        verbose_name = 'Doi san'
        verbose_name_plural = 'Doi san'
        ordering = ['-created_at']

    def __str__(self):
        return f"Doi san: {self.original_field.name} -> {self.new_field.name if self.new_field else 'Chua co'} ({self.status})"
