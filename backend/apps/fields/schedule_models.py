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
        verbose_name='Sân bóng'
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES, verbose_name='Ngày trong tuần')
    is_open = models.BooleanField(default=True, verbose_name='Mở cửa?')
    open_time = models.TimeField(verbose_name='Giờ mở cửa')
    close_time = models.TimeField(verbose_name='Giờ đóng cửa')
    slot_duration = models.IntegerField(default=60, verbose_name='Thời gian mỗi khung (phút)')

    class Meta:
        db_table = 'field_schedules'
        verbose_name = 'Lịch hoạt động'
        verbose_name_plural = 'Lịch hoạt động'
        unique_together = ['field', 'day_of_week']
        ordering = ['field', 'day_of_week']

    def __str__(self):
        status = 'Mở' if self.is_open else 'Đóng'
        return f"{self.field.name} - {self.get_day_of_week_display()}: {status}"

    def generate_time_slots(self):
        """
        Tự động sinh TimeSlot từ lịch hoạt động
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
            
            # Xác định giờ cao điểm (18:00 - 21:00)
            is_peak = current_time.hour >= 18 and current_time.hour < 21
            
            # Lấy giá từ Field
            field = self.field
            price = field.peak_hour_price if is_peak else field.price_per_hour

            # Kiểm tra xem slot đã tồn tại chưa
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
    Ngày đóng cửa đặc biệt (bảo trì, lễ/tết, sự cố, ...)
    """
    CLOSURE_TYPE_CHOICES = [
        ('maintenance', 'Bảo trì'),
        ('holiday', 'Lễ/Tết'),
        ('issue', 'Sự cố/Sửa chữa'),
        ('weather', 'Thời tiết xấu'),
        ('other', 'Khác'),
    ]

    field = models.ForeignKey(
        'fields.Field',
        on_delete=models.CASCADE,
        related_name='closures',
        verbose_name='Sân bóng'
    )
    start_date = models.DateField(verbose_name='Ngày bắt đầu')
    end_date = models.DateField(verbose_name='Ngày kết thúc')
    reason = models.TextField(verbose_name='Lý do')
    closure_type = models.CharField(
        max_length=20,
        choices=CLOSURE_TYPE_CHOICES,
        default='maintenance',
        verbose_name='Loại đóng cửa'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')

    class Meta:
        db_table = 'field_closures'
        verbose_name = 'Ngày đóng cửa'
        verbose_name_plural = 'Ngày đóng cửa'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.field.name} - Đóng cửa: {self.start_date} đến {self.end_date}"

    def affects_date(self, check_date):
        """Kiểm tra xem ngày nào đó có bị ảnh hưởng bởi đóng cửa không"""
        return self.start_date <= check_date <= self.end_date
