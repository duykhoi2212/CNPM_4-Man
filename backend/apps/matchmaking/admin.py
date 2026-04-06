from django.contrib import admin
from .models import OpponentRequest, MatchmakingMatch


@admin.register(OpponentRequest)
class OpponentRequestAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'preferred_skill_level', 'status', 'is_open_to_team',
        'created_at', 'expires_at'
    ]
    list_filter = ['status', 'preferred_skill_level', 'is_open_to_team', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Nguoi dung', {
            'fields': ('user', 'status')
        }),
        ('Tieu chi tim kiem', {
            'fields': (
                'preferred_skill_level', 'min_rating',
                'preferred_date', 'preferred_time_start', 'preferred_time_end'
            )
        }),
        ('Thong tin them', {
            'fields': ('field', 'notes', 'is_open_to_team'),
            'classes': ('collapse',)
        }),
        ('Thoi gian', {
            'fields': ('created_at', 'updated_at', 'expires_at'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        # Chi admin co the tao manually
        return request.user.is_staff


@admin.register(MatchmakingMatch)
class MatchmakingMatchAdmin(admin.ModelAdmin):
    list_display = [
        'requester', 'opponent', 'scheduled_date', 'scheduled_time_start',
        'status', 'match_result', 'both_confirmed'
    ]
    list_filter = ['status', 'match_result', 'scheduled_date', 'created_at']
    search_fields = [
        'requester__username', 'requester__first_name', 'requester__last_name',
        'opponent__username', 'opponent__first_name', 'opponent__last_name'
    ]
    readonly_fields = ['created_at', 'confirmed_at', 'completed_at', 'updated_at']
    
    fieldsets = (
        ('Nguoi choi', {
            'fields': ('requester', 'opponent', 'opponent_request')
        }),
        ('Chi tiet match', {
            'fields': (
                'field', 'scheduled_date', 'scheduled_time_start', 'scheduled_time_end'
            )
        }),
        ('Xac nhan', {
            'fields': ('requester_confirmed', 'opponent_confirmed', 'status')
        }),
        ('Ket qua', {
            'fields': ('match_result', 'notes'),
            'classes': ('collapse',)
        }),
        ('Thoi gian', {
            'fields': (
                'created_at', 'confirmed_at', 'completed_at', 'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        # Chi admin co the tao manually
        return request.user.is_staff
