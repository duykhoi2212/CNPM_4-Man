from rest_framework import serializers
from django.contrib.auth.models import User
from .models import OpponentRequest, MatchmakingMatch
from apps.fields.models import Field


class UserBasicSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    win_rate = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile', 'win_rate']
        read_only_fields = fields

    def get_profile(self, obj):
        """Get user's profile info"""
        if hasattr(obj, 'profile'):
            return {
                'phone': obj.profile.phone,
                'team_name': obj.profile.team_name,
                'skill_level': obj.profile.skill_level,
                'skill_level_display': obj.profile.get_skill_level_display(),
                'rating': obj.profile.rating,
                'total_matches': obj.profile.total_matches,
                'total_wins': obj.profile.total_wins,
                'bio': obj.profile.bio,
            }
        return None

    def get_win_rate(self, obj):
        """Get user's win rate"""
        if hasattr(obj, 'profile'):
            return obj.profile.win_rate
        return 0


class FieldBasicSerializer(serializers.ModelSerializer):
    """Simple field serializer"""
    class Meta:
        model = Field
        fields = ['id', 'name', 'location', 'price_per_hour']
        read_only_fields = fields


class OpponentRequestSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    preferred_skill_level_display = serializers.CharField(
        source='get_preferred_skill_level_display',
        read_only=True
    )
    field = FieldBasicSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = OpponentRequest
        fields = [
            'id', 'user', 'field', 'preferred_skill_level', 'preferred_skill_level_display',
            'min_rating', 'preferred_date', 'preferred_time_start', 'preferred_time_end',
            'notes', 'status', 'status_display', 'is_open_to_team',
            'created_at', 'expires_at', 'updated_at', 'is_expired'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_is_expired(self, obj):
        return obj.is_expired


class OpponentRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpponentRequest
        fields = [
            'field', 'preferred_skill_level', 'min_rating',
            'preferred_date', 'preferred_time_start', 'preferred_time_end',
            'notes', 'is_open_to_team'
        ]

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class MatchmakingMatchSerializer(serializers.ModelSerializer):
    requester = UserBasicSerializer(read_only=True)
    opponent = UserBasicSerializer(read_only=True)
    field = FieldBasicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    match_result_display = serializers.CharField(source='get_match_result_display', read_only=True)
    both_confirmed = serializers.SerializerMethodField()

    class Meta:
        model = MatchmakingMatch
        fields = [
            'id', 'requester', 'opponent', 'field',
            'scheduled_date', 'scheduled_time_start', 'scheduled_time_end',
            'requester_confirmed', 'opponent_confirmed', 'both_confirmed',
            'status', 'status_display', 'match_result', 'match_result_display',
            'notes', 'created_at', 'confirmed_at', 'completed_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'confirmed_at', 'completed_at', 'updated_at']

    def get_both_confirmed(self, obj):
        return obj.both_confirmed


class MatchmakingMatchCreateSerializer(serializers.ModelSerializer):
    opponent_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = MatchmakingMatch
        fields = [
            'opponent_id', 'field', 'scheduled_date', 'scheduled_time_start',
            'scheduled_time_end', 'notes'
        ]

    def validate_opponent_id(self, value):
        try:
            opponent = User.objects.get(pk=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('Khong tim thay doi thu')
        return value

    def create(self, validated_data):
        opponent_id = validated_data.pop('opponent_id')
        opponent = User.objects.get(pk=opponent_id)
        validated_data['requester'] = self.context['request'].user
        validated_data['opponent'] = opponent
        return super().create(validated_data)


class MatchmakingMatchConfirmSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchmakingMatch
        fields = []

    def update(self, instance, validated_data):
        user = self.context['request'].user
        
        if user == instance.requester:
            instance.requester_confirmed = True
        elif user == instance.opponent:
            instance.opponent_confirmed = True
        else:
            raise serializers.ValidationError('Ban khong co quyen xac nhan match nay')

        if instance.both_confirmed:
            from django.utils import timezone
            instance.status = 'confirmed'
            instance.confirmed_at = timezone.now()

        instance.save()
        return instance
