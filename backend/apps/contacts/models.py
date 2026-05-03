from django.db import models


class ContactMessage(models.Model):
    name = models.CharField(max_length=100, verbose_name='Họ tên')
    email = models.EmailField(verbose_name='Email')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Số điện thoại')
    subject = models.CharField(max_length=200, verbose_name='Chủ đề')
    message = models.TextField(verbose_name='Nội dung')
    is_resolved = models.BooleanField(default=False, verbose_name='Đã xử lý')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contact_messages'
        verbose_name = 'Liên hệ'
        verbose_name_plural = 'Liên hệ'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - {self.subject}'
