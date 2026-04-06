from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    SKILL_LEVEL_CHOICES = [
        ('beginner', 'Yếu - Người mới bắt đầu'),
        ('intermediate', 'Trung bình - Có kinh nghiệm'),
        ('advanced', 'Khá - Kỹ thuật tốt'),
        ('professional', 'Tốt - Chuyên nghiệp'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='User'
    )
    phone = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Số điện thoại'
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name='Địa chỉ'
    )
    
    # Team information
    team_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Tên đội bóng'
    )
    
    # Skill level and statistics
    skill_level = models.CharField(
        max_length=20,
        choices=SKILL_LEVEL_CHOICES,
        default='beginner',
        verbose_name='Trình độ kỹ năng đội bóng'
    )
    total_matches = models.IntegerField(
        default=0,
        verbose_name='Tổng số trận đấu'
    )
    total_wins = models.IntegerField(
        default=0,
        verbose_name='Tổng số trận thắng'
    )
    total_draws = models.IntegerField(
        default=0,
        verbose_name='Tổng số trận hòa'
    )
    rating = models.FloatField(
        default=0.0,
        verbose_name='Đánh giá đội bóng (0-5 sao)'
    )
    bio = models.TextField(
        blank=True,
        null=True,
        verbose_name='Giới thiệu đội bóng'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Ngày tạo'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Ngày cập nhật'
    )
    
    class Meta:
        db_table = 'accounts_userprofile'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.phone}"
    
    @property
    def win_rate(self):
        """Tính tỷ lệ thắng"""
        if self.total_matches == 0:
            return 0
        return round((self.total_wins / self.total_matches) * 100, 1)
