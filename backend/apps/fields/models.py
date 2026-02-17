from django.db import models


# =====================================================
# MODEL 1: FieldType - Loại sân
# =====================================================
class FieldType(models.Model):
    """
    Phân loại sân bóng
    Ví dụ: Sân 5 người, Sân 7 người, Sân 11 người, Futsal
    """
    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Tên loại sân'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Mô tả'
    )

    class Meta:
        db_table = 'field_types'
        verbose_name = 'Loại sân'
        verbose_name_plural = 'Loại sân'
        ordering = ['id']

    def __str__(self):
        return self.name


# =====================================================
# MODEL 2: Field - Thông tin sân bóng
# =====================================================
class Field(models.Model):
    """
    Thông tin chi tiết sân bóng
    """
    field_type = models.ForeignKey(
        FieldType,
        on_delete=models.RESTRICT,
        related_name='fields',
        verbose_name='Loại sân'
    )
    name = models.CharField(
        max_length=255,
        verbose_name='Tên sân'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Mô tả'
    )
    location = models.CharField(
        max_length=500,
        verbose_name='Địa chỉ'
    )
    price_per_hour = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Giá giờ thường (VND)'
    )
    peak_hour_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Giá giờ cao điểm (VND)'
    )
    deposit_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=30.00,
        verbose_name='% tiền cọc'
    )
    avg_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        verbose_name='Đánh giá TB'
    )
    total_reviews = models.IntegerField(
        default=0,
        verbose_name='Số lượt review'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Còn hoạt động?'
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
        db_table = 'fields'
        verbose_name = 'Sân bóng'
        verbose_name_plural = 'Sân bóng'
        ordering = ['-avg_rating', 'name']

    def __str__(self):
        return f"{self.name} ({self.field_type.name})"

    # ── Custom methods ──────────────────────────────
    def calculate_deposit(self, total_amount):
        """Tính tiền cọc từ tổng tiền"""
        return total_amount * (self.deposit_percent / 100)

    @property
    def primary_image(self):
        """Lấy ảnh chính của sân"""
        image = self.images.filter(is_primary=True).first()
        return image.image_url if image else None

    @property
    def is_available(self):
        """Sân còn hoạt động không?"""
        return self.is_active


# =====================================================
# MODEL 3: FieldImage - Ảnh sân
# =====================================================
class FieldImage(models.Model):
    """
    Ảnh gallery của sân bóng
    """
    field = models.ForeignKey(
        Field,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Sân bóng'
    )
    image_url = models.ImageField(
        upload_to='fields/',
        verbose_name='Ảnh sân'
    )
    is_primary = models.BooleanField(
        default=False,
        verbose_name='Ảnh chính?'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Thứ tự'
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Ngày upload'
    )

    class Meta:
        db_table = 'field_images'
        verbose_name = 'Ảnh sân'
        verbose_name_plural = 'Ảnh sân'
        ordering = ['order']

    def __str__(self):
        return f"Ảnh {self.order} - {self.field.name}"

    def save(self, *args, **kwargs):
        """Đảm bảo chỉ có 1 ảnh primary"""
        if self.is_primary:
            FieldImage.objects.filter(
                field=self.field,
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


# =====================================================
# MODEL 4: TimeSlot - Khung giờ
# =====================================================
class TimeSlot(models.Model):
    """
    Khung giờ của từng sân (06:00 - 22:00)
    """
    field = models.ForeignKey(
        Field,
        on_delete=models.CASCADE,
        related_name='time_slots',
        verbose_name='Sân bóng'
    )
    start_time = models.TimeField(
        verbose_name='Giờ bắt đầu'
    )
    end_time = models.TimeField(
        verbose_name='Giờ kết thúc'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Giá (VND)'
    )
    is_peak_hour = models.BooleanField(
        default=False,
        verbose_name='Giờ cao điểm?'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Còn mở?'
    )

    class Meta:
        db_table = 'time_slots'
        verbose_name = 'Khung giờ'
        verbose_name_plural = 'Khung giờ'
        ordering = ['start_time']
        # Không trùng giờ trong cùng 1 sân
        unique_together = ['field', 'start_time', 'end_time']

    def __str__(self):
        peak = " (Cao điểm)" if self.is_peak_hour else ""
        return f"{self.field.name}: {self.start_time}-{self.end_time}{peak}"

    @property
    def duration_hours(self):
        """Số giờ của khung giờ này"""
        start = self.start_time.hour + self.start_time.minute / 60
        end = self.end_time.hour + self.end_time.minute / 60
        return end - start