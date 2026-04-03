from django.db import models


class ContactMessage(models.Model):
    name = models.CharField(max_length=100, verbose_name='Ho ten')
    email = models.EmailField(verbose_name='Email')
    phone = models.CharField(max_length=20, blank=True, verbose_name='So dien thoai')
    subject = models.CharField(max_length=200, verbose_name='Chu de')
    message = models.TextField(verbose_name='Noi dung')
    is_resolved = models.BooleanField(default=False, verbose_name='Da xu ly')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contact_messages'
        verbose_name = 'Lien he'
        verbose_name_plural = 'Lien he'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - {self.subject}'
