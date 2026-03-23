# apps/reviews/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count
from .models import Review


@receiver(post_save, sender=Review)
def update_field_rating_on_save(sender, instance, **kwargs):
    """
    Tự động cập nhật avg_rating và total_reviews của Field
    khi Review được tạo hoặc cập nhật
    """
    field = instance.field
    stats = Review.objects.filter(field=field).aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Count('id')
    )
    
    field.avg_rating = round(stats['avg_rating'] or 0, 2)
    field.total_reviews = stats['total_reviews']
    field.save(update_fields=['avg_rating', 'total_reviews'])


@receiver(post_delete, sender=Review)
def update_field_rating_on_delete(sender, instance, **kwargs):
    """
    Tự động cập nhật avg_rating và total_reviews của Field
    khi Review bị xóa
    """
    field = instance.field
    stats = Review.objects.filter(field=field).aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Count('id')
    )
    
    field.avg_rating = round(stats['avg_rating'] or 0, 2)
    field.total_reviews = stats['total_reviews']
    field.save(update_fields=['avg_rating', 'total_reviews'])