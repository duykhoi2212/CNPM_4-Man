from django.contrib import admin
from .models import Review, ReviewImage

class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 1

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'field', 'rating', 'created_at']
    list_filter = ['rating', 'field']
    search_fields = ['user__username', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ReviewImageInline]

@admin.register(ReviewImage)
class ReviewImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'review', 'uploaded_at']