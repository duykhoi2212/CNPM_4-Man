from django.db import models


class FieldSchedule(models.Model):
    """
    Lịch hoạt động của sân theo ngày trong tuần
    day_of_week: 0=Thứ 2, 1=Thứ 3, ..., 6=Chủ nhật
    """
    DAY_CHOICES = [
        (0, 'Thứ Hai'),
        (1, 'Thứ Ba'),
        (2, 'Thứ Tư'),
        (3, 'Thứ Năm'),
        (4, 'Thứ Sáu'),
        (5, 'Thứ Bảy'),
        (6, 'Chủ Nhật'),
    ]

    field = models.ForeignKey(
        'fields.Field',
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name='San bong'
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES, verbose_name='Ngay trong tuan')
    is_open = models.BooleanField(default=True, verbose_name='Mo cua?')
    open_time = models.TimeField(verbose_name='Gio mo cua')
    close_time = models.TimeField(verbose_name='Gio dong cua')
    slot_duration = models.IntegerField(default=60, verbose_name='Thoi gian moi khung (phut)')

    class Meta:
        db_table = 'field_schedules'
        verbose_name = 'Lich hoat dong'
        verbose_name_plural = 'Lich hoat dong'
        unique_together = ['field', 'day_of_week']
        ordering = ['field', 'day_of_week']

    def __str__(self):
        status = 'Mo' if self.is_open else 'Dong'
        return f"{self.field.name} - {self.get_day_of_week_display()}: {status}"

    def generate_time_slots(self):
        """
        Tu dong sinh TimeSlot tu lich hoat dong
        """
        from apps.fields.models import TimeSlot
        from datetime import datetime, timedelta

        if not self.is_open:
            return []

        slots_generated = []
        current_time = datetime.strptime(str(self.open_time), '%H:%M:%S')
        end_time = datetime.strptime(str(self.close_time), '%H:%M:%S')
        duration = timedelta(minutes=self.slot_duration)

        while current_time + duration <= end_time:
            slot_end = current_time + duration
            
            # Xac dinh gio cao diem (18:00 - 21:00)
            is_peak = current_time.hour >= 18 and current_time.hour < 21
            
            # Lay gia tu Field
            field = self.field
            price = field.peak_hour_price if is_peak else field.price_per_hour

            # Kiem tra xem slot da ton tai chua
            existing = TimeSlot.objects.filter(
                field=self.field,
                start_time=current_time.time(),
                end_time=slot_end.time()
            ).first()

            if not existing:
                time_slot = TimeSlot.objects.create(
                    field=self.field,
                    start_time=current_time.time(),
                    end_time=slot_end.time(),
                    price=price,
                    is_peak_hour=is_peak,
                    is_active=True
                )
                slots_generated.append(time_slot)

            current_time = slot_end

        return slots_generated


class FieldClosure(models.Model):
    """
    Ngay dong cua dac biet (bao tri, le tet, su co, ...)
    """
    CLOSURE_TYPE_CHOICES = [
        ('maintenance', 'Bao tri'),
        ('holiday', 'Le/Tet'),
        ('issue', 'Su co/Sua chua'),
        ('weather', 'Thoi tiet xau'),
        ('other', 'Khac'),
    ]

    field = models.ForeignKey(
        'fields.Field',
        on_delete=models.CASCADE,
        related_name='closures',
        verbose_name='San bong'
    )
    start_date = models.DateField(verbose_name='Ngay bat dau')
    end_date = models.DateField(verbose_name='Ngay ket thuc')
    reason = models.TextField(verbose_name='Ly do')
    closure_type = models.CharField(
        max_length=20,
        choices=CLOSURE_TYPE_CHOICES,
        default='maintenance',
        verbose_name='Loai dong cua'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngay tao')

    class Meta:
        db_table = 'field_closures'
        verbose_name = 'Ngay dong cua'
        verbose_name_plural = 'Ngay dong cua'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.field.name} - Dong cua: {self.start_date} den {self.end_date}"

    def affects_date(self, check_date):
        """Kiem tra xem ngay nao do co bi anh huong boi dong cua khong"""
        return self.start_date <= check_date <= self.end_date
