from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'phone', 'skill_level', 'rating', 'total_matches', 'total_wins'
    ]
    list_filter = ['skill_level', 'created_at']
    search_fields = ['user__username', 'user__email', 'phone']
    readonly_fields = ['created_at', 'updated_at', 'win_rate']
    
    fieldsets = (
        ('Thong tin ca nhan', {
            'fields': ('user', 'phone', 'address')
        }),
        ('Tro choi', {
            'fields': (
                'skill_level', 'rating', 'bio', 'preferred_position'
            )
        }),
        ('Thong ke', {
            'fields': (
                'total_matches', 'total_wins', 'total_draws', 'win_rate'
            ),
            'classes': ('collapse',)
        }),
        ('Thoi gian', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )