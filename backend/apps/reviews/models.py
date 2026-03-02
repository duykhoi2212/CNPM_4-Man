from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User
from apps.fields.models import Field
from apps.bookings.models import Booking


class Review(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Người đánh giá'
    )
    field = models.ForeignKey(
        Field,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Sân bóng'
    )
    booking = models.OneToOneField(
        Booking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='review',
        verbose_name='Đơn đặt sân'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Điểm đánh giá'
    )
    comment = models.TextField(verbose_name='Nội dung đánh giá')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reviews'
        verbose_name = 'Đánh giá'
        verbose_name_plural = 'Đánh giá'
        ordering = ['-created_at']

    def __str__(self):
        return f"Review #{self.pk} - {self.user.username} - {self.field} ({self.rating}★)"


class ReviewImage(models.Model):
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Đánh giá'
    )
    image_url = models.ImageField(upload_to='reviews/', verbose_name='Ảnh')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'review_images'
        verbose_name = 'Ảnh đánh giá'
        verbose_name_plural = 'Ảnh đánh giá'

    def __str__(self):
        return f"Image for Review #{self.review.pk}"