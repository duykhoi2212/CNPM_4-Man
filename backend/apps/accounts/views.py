# apps/accounts/views.py
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileDetailSerializer,
    UpdateProfileSerializer
)


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
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.profile.phone,
            },
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
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.profile.phone,
            'is_staff': user.is_staff,
        },
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
    
    response_serializer = UserProfileDetailSerializer(user)
    
    return Response({
        'user': response_serializer.data,
        'message': 'Profile updated successfully'
    }, status=status.HTTP_200_OK)