from django.db import models
from django.contrib.auth.models import User


class IncidentReport(models.Model):
    """
    Báo cáo sự cố khi đang sử dụng sân
    """
    STATUS_CHOICES = [
        ('pending', 'Chờ xử lý'),
        ('investigating', 'Đang điều tra'),
        ('resolving', 'Đang giải quyết'),
        ('resolved', 'Đã giải quyết'),
        ('cancelled', 'Đã hủy'),
    ]

    ISSUE_TYPE_CHOICES = [
        ('field_damage', 'Sân bị hư hỏng (đèn, cỏ, mặt sân, ...)'),
        ('weather', 'Thời tiết xấu'),
        ('emergency', 'Sự cố khẩn cấp'),
        ('equipment', 'Thiết bị hư hỏng'),
        ('safety', 'Vấn đề an toàn'),
        ('other', 'Khác'),
    ]

    SEVERITY_CHOICES = [
        ('low', 'Thấp - Có thể tiếp tục chơi'),
        ('medium', 'Trung bình - Nên đổi sân'),
        ('high', 'Cao - Buộc phải dừng chơi'),
    ]

    field = models.ForeignKey(
        'fields.Field',
        on_delete=models.CASCADE,
        related_name='incidents',
        verbose_name='Sân bóng'
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='incidents',
        verbose_name='Booking liên quan'
    )
    reported_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reported_incidents',
        verbose_name='Người báo cáo'
    )
    issue_type = models.CharField(
        max_length=20,
        choices=ISSUE_TYPE_CHOICES,
        verbose_name='Loại sự cố'
    )
    severity = models.CharField(
        max_length=10,
        choices=SEVERITY_CHOICES,
        default='medium',
        verbose_name='Mức độ nghiêm trọng'
    )
    description = models.TextField(verbose_name='Mô tả chi tiết')
    photos = models.JSONField(blank=True, default=list, verbose_name='URL ảnh sự cố')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Trạng thái'
    )
    admin_notes = models.TextField(blank=True, default='', verbose_name='Ghi chú admin')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngày cập nhật')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày giải quyết')

    class Meta:
        db_table = 'incident_reports'
        verbose_name = 'Báo cáo sự cố'
        verbose_name_plural = 'Báo cáo sự cố'
        ordering = ['-created_at']

    def __str__(self):
        return f"Sự cố {self.get_issue_type_display()} - {self.field.name} ({self.status})"


class FieldSwap(models.Model):
    """
    Xử lý đổi sân khi có sự cố
    """
    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),
        ('searching', 'Đang tìm sân thay thế'),
        ('proposed', 'Đã đề xuất'),
        ('confirmed', 'Đã xác nhận'),
        ('completed', 'Đã hoàn thành'),
        ('cancelled', 'Đã hủy'),
        ('failed', 'Không thể đổi'),
    ]

    incident = models.ForeignKey(
        IncidentReport,
        on_delete=models.CASCADE,
        related_name='swaps',
        verbose_name='Sự cố liên quan'
    )
    original_field = models.ForeignKey(
        'fields.Field',
        on_delete=models.CASCADE,
        related_name='swap_originals',
        verbose_name='Sân cũ'
    )
    new_field = models.ForeignKey(
        'fields.Field',
        on_delete=models.CASCADE,
        related_name='swap_news',
        null=True,
        blank=True,
        verbose_name='Sân mới'
    )
    original_booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='swap_originals',
        verbose_name='Booking cũ'
    )
    new_booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        related_name='swap_news',
        null=True,
        blank=True,
        verbose_name='Booking mới'
    )
    price_difference = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Chênh lệch giá (VND)'
    )
    compensation_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Bồi thường (VND)'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Trạng thái'
    )
    swap_reason = models.TextField(verbose_name='Lý do đổi sân')
    customer_notified = models.BooleanField(default=False, verbose_name='Đã thông báo khách?')
    customer_accepted = models.BooleanField(null=True, verbose_name='Khách đã chấp nhận?')
    admin_notes = models.TextField(blank=True, default='', verbose_name='Ghi chú admin')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngày cập nhật')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày xác nhận')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày hoàn thành')

    class Meta:
        db_table = 'field_swaps'
        verbose_name = 'Đổi sân'
        verbose_name_plural = 'Đổi sân'
        ordering = ['-created_at']

    def __str__(self):
        return f"Đổi sân: {self.original_field.name} -> {self.new_field.name if self.new_field else 'Chưa có'} ({self.status})"
