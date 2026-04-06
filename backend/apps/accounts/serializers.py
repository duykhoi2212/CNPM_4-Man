from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    team_image_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['phone', 'address', 'avatar_url', 'team_name', 'team_image_url']

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.avatar.url)
        return obj.avatar.url

    def get_team_image_url(self, obj):
        if not obj.team_image:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.team_image.url)
        return obj.team_image.url


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class UserProfileDetailSerializer(serializers.ModelSerializer):
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
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Confirm Password',
    )
    phone = serializers.CharField(required=True, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'address',
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': "Password fields didn't match."})
        return attrs

    def validate_phone(self, value):
        if UserProfile.objects.filter(phone=value).exists():
            raise serializers.ValidationError('This phone number is already registered.')
        return value

    def create(self, validated_data):
        phone = validated_data.pop('phone')
        address = validated_data.pop('address', '')
        validated_data.pop('password2')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )

        UserProfile.objects.create(
            user=user,
            phone=phone,
            address=address,
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
    )


class UpdateProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True, write_only=True)
    team_name = serializers.CharField(required=False, allow_blank=True, max_length=120)
    team_image = serializers.ImageField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'address', 'avatar', 'team_name', 'team_image']

    def validate_phone(self, value):
        user = self.context['request'].user
        if UserProfile.objects.filter(phone=value).exclude(user=user).exists():
            raise serializers.ValidationError('This phone number is already in use.')
        return value

    def update(self, instance, validated_data):
        phone = validated_data.pop('phone', None)
        address = validated_data.pop('address', None)
        avatar = validated_data.pop('avatar', None)
        team_name = validated_data.pop('team_name', None)
        team_image = validated_data.pop('team_image', None)

        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        try:
            profile = instance.profile
        except UserProfile.DoesNotExist:
            if phone is None:
                raise serializers.ValidationError({'phone': 'Phone number is required when creating a missing profile.'})
            UserProfile.objects.create(
                user=instance,
                phone=phone,
                address=address or '',
                avatar=avatar,
                team_name=team_name or '',
                team_image=team_image,
            )
            return instance

        if phone is not None:
            profile.phone = phone
        if address is not None:
            profile.address = address
        if avatar is not None:
            profile.avatar = avatar
        if team_name is not None:
            profile.team_name = team_name
        if team_image is not None:
            profile.team_image = team_image
        profile.save()
        return instance


class AdminUserListSerializer(serializers.ModelSerializer):
    phone = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()
    team_image_url = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'address', 'avatar_url', 'team_name', 'team_image_url', 'is_active', 'is_staff',
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

    def get_team_name(self, obj):
        profile = self._get_profile(obj)
        return profile.team_name if profile else None

    def get_team_image_url(self, obj):
        profile = self._get_profile(obj)
        if not profile or not profile.team_image:
            return None

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(profile.team_image.url)
        return profile.team_image.url


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['is_active', 'is_staff']

    def validate(self, attrs):
        target_user = self.instance
        request_user = self.context['request'].user

        if target_user == request_user:
            if attrs.get('is_active') is False:
                raise serializers.ValidationError({'is_active': 'Ban khong the tu khoa tai khoan cua chinh minh'})
            if attrs.get('is_staff') is False:
                raise serializers.ValidationError({'is_staff': 'Ban khong the tu go quyen quan tri cua chinh minh'})

        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    new_password2 = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        user = self.context['request'].user

        if not user.check_password(attrs['old_password']):
            raise serializers.ValidationError({'old_password': 'Mat khau hien tai khong chinh xac'})

        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Xac nhan mat khau moi khong khop'})

        if attrs['old_password'] == attrs['new_password']:
            raise serializers.ValidationError({'new_password': 'Mat khau moi phai khac mat khau hien tai'})

        return attrs
