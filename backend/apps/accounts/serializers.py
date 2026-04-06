# apps/accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer cho UserProfile (phone, address)"""
    
    class Meta:
        model = UserProfile
        fields = ['phone', 'address']


class UserSerializer(serializers.ModelSerializer):
    """Serializer cơ bản cho User"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class UserProfileDetailSerializer(serializers.ModelSerializer):
    """Serializer đầy đủ: User + Profile"""
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['id', 'username']

    def get_profile(self, obj):
        try:
            profile = obj.profile
        except UserProfile.DoesNotExist:
            return None
        return UserProfileSerializer(profile).data


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer cho đăng ký user mới"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Confirm Password'
    )
    phone = serializers.CharField(required=True, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'address'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs
    
    def validate_phone(self, value):
        """Validate phone uniqueness"""
        if UserProfile.objects.filter(phone=value).exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return value
    
    def create(self, validated_data):
        """Create User + UserProfile"""
        # Extract profile data
        phone = validated_data.pop('phone')
        address = validated_data.pop('address', '')
        validated_data.pop('password2')
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Create profile
        UserProfile.objects.create(
            user=user,
            phone=phone,
            address=address
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer cho đăng nhập"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer cho cập nhật profile"""
    phone = serializers.CharField(required=False, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True)
    team_name = serializers.CharField(required=False, allow_blank=True)
    skill_level = serializers.ChoiceField(
        required=False,
        choices=[
            ('beginner', 'Yếu - Người mới bắt đầu'),
            ('intermediate', 'Trung bình - Có kinh nghiệm'),
            ('advanced', 'Khá - Kỹ thuật tốt'),
            ('professional', 'Tốt - Chuyên nghiệp'),
        ]
    )
    rating = serializers.FloatField(required=False, min_value=0, max_value=5)
    bio = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone', 'address',
            'team_name', 'skill_level', 'rating', 'bio'
        ]
    
    def validate_phone(self, value):
        """Validate phone uniqueness (except current user)"""
        user = self.context['request'].user
        if UserProfile.objects.filter(phone=value).exclude(user=user).exists():
            raise serializers.ValidationError("This phone number is already in use.")
        return value
    
    def update(self, instance, validated_data):
        """Update User + UserProfile"""
        # Extract profile data
        phone = validated_data.pop('phone', None)
        address = validated_data.pop('address', None)
        skill_level = validated_data.pop('skill_level', None)
        rating = validated_data.pop('rating', None)
        bio = validated_data.pop('bio', None)
        preferred_position = validated_data.pop('preferred_position', None)
        
        # Update user
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        
        # Update profile
        try:
            profile = instance.profile
        except UserProfile.DoesNotExist:
            if phone is None:
                raise serializers.ValidationError({
                    'phone': 'Phone number is required when creating a missing profile.'
                })
            UserProfile.objects.create(
                user=instance,
                phone=phone,
                address=address or '',
                skill_level=skill_level or 'beginner',
                rating=rating or 0,
                bio=bio or '',
                preferred_position=preferred_position or ''
            )
            return instance
        
        # Update existing profile
        if phone is not None:
            profile.phone = phone
        if address is not None:
            profile.address = address
        if skill_level is not None:
            profile.skill_level = skill_level
        if rating is not None:
            profile.rating = rating
        if bio is not None:
            profile.bio = bio
        if preferred_position is not None:
            profile.preferred_position = preferred_position
        
        profile.save()
        return instance

