# apps/accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer cho UserProfile (phone, address)"""
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['phone', 'address', 'avatar_url']

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.avatar.url)
        return obj.avatar.url


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
        return UserProfileSerializer(profile, context=self.context).data


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
    avatar = serializers.ImageField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'address', 'avatar']
    
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
        avatar = validated_data.pop('avatar', None)
        
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
                avatar=avatar
            )
            return instance
        if phone is not None:
            profile.phone = phone
        if address is not None:
            profile.address = address
        if avatar is not None:
            profile.avatar = avatar
        profile.save()
        
        return instance


class AdminUserListSerializer(serializers.ModelSerializer):
    phone = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'address', 'avatar_url', 'is_active', 'is_staff',
            'is_superuser', 'role', 'date_joined',
        ]
        read_only_fields = fields

    def _get_profile(self, obj):
        try:
            return obj.profile
        except UserProfile.DoesNotExist:
            return None

    def get_phone(self, obj):
        profile = self._get_profile(obj)
        return profile.phone if profile else None

    def get_address(self, obj):
        profile = self._get_profile(obj)
        return profile.address if profile else None

    def get_avatar_url(self, obj):
        profile = self._get_profile(obj)
        if not profile or not profile.avatar:
            return None

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(profile.avatar.url)
        return profile.avatar.url

    def get_role(self, obj):
        return 'admin' if obj.is_staff else 'user'


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['is_active', 'is_staff']

    def validate(self, attrs):
        target_user = self.instance
        request_user = self.context['request'].user

        if target_user == request_user:
            if attrs.get('is_active') is False:
                raise serializers.ValidationError({
                    'is_active': 'Ban khong the tu khoa tai khoan cua chinh minh'
                })
            if attrs.get('is_staff') is False:
                raise serializers.ValidationError({
                    'is_staff': 'Ban khong the tu go quyen quan tri cua chinh minh'
                })

        return attrs
