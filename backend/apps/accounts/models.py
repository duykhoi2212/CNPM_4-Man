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
        verbose_name='So dien thoai',
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name='Dia chi',
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name='Avatar',
    )
    last_seen_bookings_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Lan cuoi da xem booking',
    )
    last_seen_reviews_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Lan cuoi da xem review',
    )
    last_seen_contacts_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Lan cuoi da xem lien he',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Ngay tao',
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Ngay cap nhat',
    )

    class Meta:
        db_table = 'accounts_userprofile'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.phone}"
