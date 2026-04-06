from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from apps.fields.models import Field


class OpponentRequest(models.Model):
    """
    Model để lưu trữ yêu cầu tìm đối thủ
    """
    STATUS_CHOICES = [
        ('active', 'Đang tìm'),
        ('matched', 'Đã match'),
        ('cancelled', 'Đã hủy'),
        ('expired', 'Hết hạn'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='opponent_requests',
        verbose_name='Người dùng'
    )
    
    # Field info
    field = models.ForeignKey(
        Field,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Sân bóng'
    )
    
    # Filter criteria
    preferred_skill_level = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Yếu'),
            ('intermediate', 'Trung bình'),
            ('advanced', 'Khá'),
            ('professional', 'Tốt'),
            ('any', 'Bất kỳ'),
        ],
        default='any',
        verbose_name='Trình độ ưa thích'
    )
    
    min_rating = models.FloatField(
        default=0.0,
        verbose_name='Đánh giá tối thiểu'
    )
    
    # Time info
    preferred_date = models.DateField(
        verbose_name='Ngày ưa thích (optional)',
        null=True,
        blank=True
    )
    preferred_time_start = models.TimeField(
        verbose_name='Giờ bắt đầu ưa thích (optional)',
        null=True,
        blank=True
    )
    preferred_time_end = models.TimeField(
        verbose_name='Giờ kết thúc ưa thích (optional)',
        null=True,
        blank=True
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Ghi chú / Yêu cầu đặc biệt'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Trạng thái'
    )
    
    is_open_to_team = models.BooleanField(
        default=True,
        verbose_name='Chấp nhận được join vào đội'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Ngày tạo'
    )
    expires_at = models.DateTimeField(
        verbose_name='Hết hạn',
        null=True,
        blank=True
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Ngày cập nhật'
    )

    def save(self, *args, **kwargs):
        """Tự động tính toán expires_at nếu chưa có"""
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'matchmaking_opponent_requests'
        verbose_name = 'Yêu cầu tìm đối thủ'
        verbose_name_plural = 'Yêu cầu tìm đối thủ'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()}"

    @property
    def is_expired(self):
        """Kiểm tra xem yêu cầu có hết hạn không"""
        return timezone.now() > self.expires_at


class MatchmakingMatch(models.Model):
    """
    Model để lưu trữ kết quả match giữa các người chơi
    """
    STATUS_CHOICES = [
        ('pending_confirmation', 'Chờ xác nhận'),
        ('confirmed', 'Đã xác nhận'),
        ('completed', 'Hoàn thành'),
        ('cancelled', 'Đã hủy'),
    ]

    # Primary players
    requester = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='matches_as_requester',
        verbose_name='Người tìm đối thủ'
    )
    opponent = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='matches_as_opponent',
        verbose_name='Đối thủ'
    )
    
    # Related request
    opponent_request = models.ForeignKey(
        OpponentRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Yêu cầu tìm đối thủ'
    )
    
    # Match details
    field = models.ForeignKey(
        Field,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Sân bóng'
    )
    
    scheduled_date = models.DateField(
        verbose_name='Ngày đấu'
    )
    scheduled_time_start = models.TimeField(
        verbose_name='Giờ bắt đầu'
    )
    scheduled_time_end = models.TimeField(
        verbose_name='Giờ kết thúc'
    )
    
    # Confirmation
    requester_confirmed = models.BooleanField(
        default=False,
        verbose_name='Người tìm đã xác nhận'
    )
    opponent_confirmed = models.BooleanField(
        default=False,
        verbose_name='Đối thủ đã xác nhận'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending_confirmation',
        verbose_name='Trạng thái'
    )
    
    # Match result (optional, filled after match)
    match_result = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        choices=[
            ('requester_win', 'Người tìm thắng'),
            ('opponent_win', 'Đối thủ thắng'),
            ('draw', 'Hòa'),
        ],
        verbose_name='Kết quả trận đấu'
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Ghi chú'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Ngày tạo'
    )
    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Ngày xác nhận'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Ngày hoàn thành'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Ngày cập nhật'
    )

    class Meta:
        db_table = 'matchmaking_matches'
        verbose_name = 'Match'
        verbose_name_plural = 'Matches'
        ordering = ['-created_at']
        unique_together = [['requester', 'opponent', 'scheduled_date', 'scheduled_time_start']]

    def __str__(self):
        return f"{self.requester.username} vs {self.opponent.username} ({self.scheduled_date})"

    @property
    def both_confirmed(self):
        """Kiểm tra xem cả hai người đều xác nhận"""
        return self.requester_confirmed and self.opponent_confirmed
