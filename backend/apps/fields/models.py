from django.contrib.auth.models import User
from django.db import models


class FieldType(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name='Ten loai san')
    description = models.TextField(blank=True, null=True, verbose_name='Mo ta')

    class Meta:
        db_table = 'field_types'
        verbose_name = 'Loai san'
        verbose_name_plural = 'Loai san'
        ordering = ['id']

    def __str__(self):
        return self.name


class Field(models.Model):
    field_type = models.ForeignKey(FieldType, on_delete=models.RESTRICT, related_name='fields', verbose_name='Loai san')
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='owned_fields',
        blank=True,
        null=True,
        verbose_name='Chu san',
    )
    name = models.CharField(max_length=255, verbose_name='Ten san')
    description = models.TextField(blank=True, null=True, verbose_name='Mo ta')
    location = models.CharField(max_length=500, verbose_name='Dia chi')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, verbose_name='Vi do')
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, verbose_name='Kinh do')
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Gia gio thuong (VND)')
    peak_hour_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Gia gio cao diem (VND)')
    deposit_percent = models.DecimalField(max_digits=5, decimal_places=2, default=30.00, verbose_name='% tien coc')
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, verbose_name='Danh gia TB')
    total_reviews = models.IntegerField(default=0, verbose_name='So luot review')
    is_active = models.BooleanField(default=True, verbose_name='Con hoat dong?')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngay tao')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngay cap nhat')

    class Meta:
        db_table = 'fields'
        verbose_name = 'San bong'
        verbose_name_plural = 'San bong'
        ordering = ['-avg_rating', 'name']

    def __str__(self):
        return f"{self.name} ({self.field_type.name})"

    def calculate_deposit(self, total_amount):
        return total_amount * (self.deposit_percent / 100)

    @property
    def primary_image(self):
        image = self.images.filter(is_primary=True).first()
        return image.image_url if image else None

    @property
    def is_available(self):
        return self.is_active


class FieldImage(models.Model):
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='images', verbose_name='San bong')
    image_url = models.ImageField(upload_to='fields/', verbose_name='Anh san')
    is_primary = models.BooleanField(default=False, verbose_name='Anh chinh?')
    order = models.IntegerField(default=0, verbose_name='Thu tu')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngay upload')

    class Meta:
        db_table = 'field_images'
        verbose_name = 'Anh san'
        verbose_name_plural = 'Anh san'
        ordering = ['order']

    def __str__(self):
        return f"Anh {self.order} - {self.field.name}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            FieldImage.objects.filter(field=self.field, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class TimeSlot(models.Model):
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='time_slots', verbose_name='San bong')
    start_time = models.TimeField(verbose_name='Gio bat dau')
    end_time = models.TimeField(verbose_name='Gio ket thuc')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Gia (VND)')
    is_peak_hour = models.BooleanField(default=False, verbose_name='Gio cao diem?')
    is_active = models.BooleanField(default=True, verbose_name='Con mo?')

    class Meta:
        db_table = 'time_slots'
        verbose_name = 'Khung gio'
        verbose_name_plural = 'Khung gio'
        ordering = ['start_time']
        unique_together = ['field', 'start_time', 'end_time']

    def __str__(self):
        peak = " (Cao diem)" if self.is_peak_hour else ""
        return f"{self.field.name}: {self.start_time}-{self.end_time}{peak}"

    @property
    def duration_hours(self):
        start = self.start_time.hour + self.start_time.minute / 60
        end = self.end_time.hour + self.end_time.minute / 60
        return end - start
