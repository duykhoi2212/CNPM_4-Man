# apps/accounts/views.py
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from .models import UserProfile
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileDetailSerializer,
    UpdateProfileSerializer,
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
    ChangePasswordSerializer,
)


def _get_user_phone(user):
    try:
        return user.profile.phone
    except UserProfile.DoesNotExist:
        return None


def _get_user_avatar_url(user, request=None):
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return None

    if not profile.avatar:
        return None

    if request:
        return request.build_absolute_uri(profile.avatar.url)
    return profile.avatar.url


def _serialize_auth_user(user, request=None):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone': _get_user_phone(user),
        'avatar_url': _get_user_avatar_url(user, request),
        'is_staff': user.is_staff,
    }


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    
    Đăng ký user mới
    Body: {
        "username": "khoi123",
        "email": "khoi@example.com",
        "password": "SecurePass123!",
        "password2": "SecurePass123!",
        "first_name": "Khôi",
        "last_name": "Nguyễn",
        "phone": "0123456789",
        "address": "123 Đường ABC" (optional)
    }
    
    Response: {
        "user": {...},
        "token": "abc123...",
        "message": "User created successfully"
    }
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': _serialize_auth_user(user, request),
            'token': token.key,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    POST /api/auth/login/
    
    Đăng nhập
    Body: {
        "username": "khoi123",
        "password": "SecurePass123!"
    }
    
    Response: {
        "user": {...},
        "token": "abc123...",
        "message": "Login successful"
    }
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'Account is disabled'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get or create token
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'user': _serialize_auth_user(user, request),
        'token': token.key,
        'message': 'Login successful'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    POST /api/auth/logout/
    
    Đăng xuất (xóa token)
    Headers: Authorization: Token <token>
    
    Response: {
        "message": "Logout successful"
    }
    """
    # Delete user's token
    request.user.auth_token.delete()
    
    return Response(
        {'message': 'Logout successful'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """
    GET /api/auth/profile/
    
    Xem thông tin profile
    Headers: Authorization: Token <token>
    
    Response: {
        "id": 1,
        "username": "khoi123",
        "email": "khoi@example.com",
        "first_name": "Khôi",
        "last_name": "Nguyễn",
        "profile": {
            "phone": "0123456789",
            "address": "123 Đường ABC"
        }
    }
    """
    serializer = UserProfileDetailSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([JSONParser, FormParser, MultiPartParser])
def update_profile_view(request):
    """
    PUT/PATCH /api/auth/profile/update/
    
    Cập nhật profile
    Headers: Authorization: Token <token>
    Body: {
        "email": "newemail@example.com",
        "first_name": "Khôi Mới",
        "last_name": "Nguyễn Văn",
        "phone": "0987654321",
        "address": "456 Đường XYZ"
    }
    
    Response: {
        "user": {...},
        "message": "Profile updated successfully"
    }
    """
    serializer = UpdateProfileSerializer(
        request.user,
        data=request.data,
        partial=(request.method == 'PATCH'),
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    
    response_serializer = UserProfileDetailSerializer(user, context={'request': request})
    
    return Response({
        'user': response_serializer.data,
        'message': 'Profile updated successfully'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)

    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save()

    Token.objects.filter(user=request.user).delete()
    token = Token.objects.create(user=request.user)

    return Response({
        'message': 'Doi mat khau thanh cong',
        'token': token.key,
        'user': _serialize_auth_user(request.user, request),
    }, status=status.HTTP_200_OK)


class AdminUserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        queryset = User.objects.select_related('profile').order_by('-date_joined')

        keyword = self.request.query_params.get('q')
        role = self.request.query_params.get('role')
        status_filter = self.request.query_params.get('status')

        if keyword:
            queryset = queryset.filter(
                Q(username__icontains=keyword) |
                Q(email__icontains=keyword) |
                Q(first_name__icontains=keyword) |
                Q(last_name__icontains=keyword) |
                Q(profile__phone__icontains=keyword)
            )

        if role == 'admin':
            queryset = queryset.filter(is_staff=True)
        elif role == 'user':
            queryset = queryset.filter(is_staff=False)

        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False)

        return queryset.distinct()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminUserUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserUpdateSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        detail_serializer = AdminUserListSerializer(user, context={'request': request})
        return Response({
            'message': 'Da cap nhat tai khoan thanh cong',
            'user': detail_serializer.data,
        }, status=status.HTTP_200_OK)
