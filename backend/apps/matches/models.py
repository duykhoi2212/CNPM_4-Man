from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from apps.fields.models import Field, TimeSlot


class MatchRequest(models.Model):
    STATUS_WAITING_OPPONENT = 'waiting_opponent'
    STATUS_ACCEPTED_WAITING_DEPOSIT = 'accepted_waiting_deposit'
    STATUS_DEPOSIT_PAID = 'deposit_paid'
    STATUS_EXPIRED = 'expired'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_WAITING_OPPONENT, 'Chờ đối chấp nhận'),
        (STATUS_ACCEPTED_WAITING_DEPOSIT, 'Đã có đối chấp nhận, chờ thanh toán cọc'),
        (STATUS_DEPOSIT_PAID, 'Đã thanh toán cọc'),
        (STATUS_EXPIRED, 'Hết hạn'),
        (STATUS_CANCELLED, 'Đã hủy'),
    ]

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='match_requests',
        verbose_name='Người tạo',
    )
    accepted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='accepted_match_requests',
        blank=True,
        null=True,
        verbose_name='Người chấp nhận',
    )
    field = models.ForeignKey(
        Field,
        on_delete=models.CASCADE,
        related_name='match_requests',
        verbose_name='Sân bóng',
    )
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        related_name='match_request',
        null=True,
        blank=True,
        db_constraint=False,
        verbose_name='Booking liên kết',
    )
    booking_date = models.DateField(verbose_name='Ngày đặt sân')
    created_team_name = models.CharField(max_length=120, verbose_name='Tên đội tạo')
    created_team_image_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Ảnh đội tạo',
    )
    accepted_team_name = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        verbose_name='Tên đội chấp nhận',
    )
    accepted_team_image_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Ảnh đội chấp nhận',
    )
    notes = models.TextField(blank=True, null=True, verbose_name='Ghi chú')
    status = models.CharField(
        max_length=40,
        choices=STATUS_CHOICES,
        default=STATUS_WAITING_OPPONENT,
        verbose_name='Trạng thái',
    )
    reserved_until = models.DateTimeField(blank=True, null=True, verbose_name='Giữ chỗ đến')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Tổng tiền')
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Tiền đặt cọc')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngày cập nhật')

    class Meta:
        db_table = 'match_requests'
        verbose_name = 'Yêu cầu giao lưu'
        verbose_name_plural = 'Yêu cầu giao lưu'
        ordering = ['-created_at']

    def __str__(self):
        return f'#{self.pk} - {self.created_team_name} - {self.field.name}'

    @property
    def is_hold_active(self):
        return bool(
            self.status == self.STATUS_ACCEPTED_WAITING_DEPOSIT
            and self.reserved_until
            and self.reserved_until > timezone.now()
        )

    @property
    def reserved_seconds_left(self):
        if not self.reserved_until:
            return 0
        remaining = (self.reserved_until - timezone.now()).total_seconds()
        return max(0, int(remaining))

    @property
    def remaining_amount(self):
        return self.total_amount - self.deposit_amount

    @property
    def is_active(self):
        return self.status in {
            self.STATUS_WAITING_OPPONENT,
            self.STATUS_ACCEPTED_WAITING_DEPOSIT,
            self.STATUS_DEPOSIT_PAID,
        }


class MatchRequestTimeSlot(models.Model):
    match_request = models.ForeignKey(
        MatchRequest,
        on_delete=models.CASCADE,
        related_name='match_timeslots',
        verbose_name='Yeu cau giao luu',
    )
    timeslot = models.ForeignKey(
        TimeSlot,
        on_delete=models.RESTRICT,
        related_name='match_timeslots',
        verbose_name='Khung giờ',
    )

    class Meta:
        db_table = 'match_request_timeslots'
        verbose_name = 'Khung giờ giao luu'
        verbose_name_plural = 'Khung giờ giao luu'
        unique_together = ['match_request', 'timeslot']

    def __str__(self):
        return f'MatchRequest #{self.match_request_id} - {self.timeslot}'
