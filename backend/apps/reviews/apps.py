# apps/reviews/apps.py
from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reviews'
    verbose_name = 'Đánh giá'

    def ready(self):
        """Import signals khi app khởi động"""
        import apps.reviews.signals