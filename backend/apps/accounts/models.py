from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='User',
    )
    phone = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Số điện thoại',
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name='Địa chỉ',
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name='Avatar',
    )
    team_name = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        verbose_name='Tên đội bóng',
    )
    team_image = models.ImageField(
        upload_to='team-images/',
        blank=True,
        null=True,
        verbose_name='Ảnh đội bóng',
    )
    last_seen_bookings_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Lần cuối xem booking',
    )
    last_seen_reviews_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Lần cuối xem đánh giá',
    )
    last_seen_contacts_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Lần cuối xem liên hệ',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Ngày tạo',
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Ngày cập nhật',
    )

    class Meta:
        db_table = 'accounts_userprofile'
        verbose_name = 'Hồ sơ người dùng'
        verbose_name_plural = 'Hồ sơ người dùng'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.phone}"
