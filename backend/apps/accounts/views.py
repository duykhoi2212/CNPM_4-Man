from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import UserProfile
from .serializers import (
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
    ChangePasswordSerializer,
    FeaturedTeamSerializer,
    LoginSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserProfileDetailSerializer,
)
from apps.fields.access import get_managed_fields_queryset


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


def _get_user_team_name(user):
    try:
        return user.profile.team_name
    except UserProfile.DoesNotExist:
        return None


def _get_user_team_image_url(user, request=None):
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return None

    if not profile.team_image:
        return None

    if request:
        return request.build_absolute_uri(profile.team_image.url)
    return profile.team_image.url


def _serialize_auth_user(user, request=None):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone': _get_user_phone(user),
        'avatar_url': _get_user_avatar_url(user, request),
        'team_name': _get_user_team_name(user),
        'team_image_url': _get_user_team_image_url(user, request),
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    }


def _build_team_image_url(profile, request=None):
    if not profile or not profile.team_image:
        return None
    if request:
        return request.build_absolute_uri(profile.team_image.url)
    return profile.team_image.url


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                'user': _serialize_auth_user(user, request),
                'token': token.key,
                'message': 'User created successfully',
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    user = authenticate(username=username, password=password)

    if user is None:
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({'error': 'Account is disabled'}, status=status.HTTP_403_FORBIDDEN)

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            'user': _serialize_auth_user(user, request),
            'token': token.key,
            'message': 'Login successful',
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    serializer = UserProfileDetailSerializer(request.user, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([JSONParser, FormParser, MultiPartParser])
def update_profile_view(request):
    serializer = UpdateProfileSerializer(
        request.user,
        data=request.data,
        partial=(request.method == 'PATCH'),
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    response_serializer = UserProfileDetailSerializer(user, context={'request': request})

    return Response(
        {
            'user': response_serializer.data,
            'message': 'Profile updated successfully',
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)

    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save()

    Token.objects.filter(user=request.user).delete()
    token = Token.objects.create(user=request.user)

    return Response(
        {
            'message': 'Doi mat khau thanh cong',
            'token': token.key,
            'user': _serialize_auth_user(request.user, request),
        },
        status=status.HTTP_200_OK,
    )


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
                Q(username__icontains=keyword)
                | Q(email__icontains=keyword)
                | Q(first_name__icontains=keyword)
                | Q(last_name__icontains=keyword)
                | Q(profile__phone__icontains=keyword)
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
        return Response(
            {
                'message': 'Da cap nhat tai khoan thanh cong',
                'user': detail_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_nav_summary_view(request):
    from apps.bookings.models import Booking
    from apps.contacts.models import ContactMessage
    from apps.reviews.models import Review

    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'phone': f'admin-{request.user.id}', 'address': ''},
    )

    managed_fields = get_managed_fields_queryset(request.user)

    bookings_queryset = Booking.objects.filter(status__in=['pending_payment', 'confirmed'])
    reviews_queryset = Review.objects.all()
    if not request.user.is_superuser:
        bookings_queryset = bookings_queryset.filter(field__in=managed_fields)
        reviews_queryset = reviews_queryset.filter(field__in=managed_fields)

    bookings_count = bookings_queryset.filter(
        created_at__gt=profile.last_seen_bookings_at,
    ).count() if profile.last_seen_bookings_at else bookings_queryset.count()

    reviews_count = reviews_queryset.filter(
        created_at__gt=profile.last_seen_reviews_at,
    ).count() if profile.last_seen_reviews_at else reviews_queryset.count()

    contacts_count = ContactMessage.objects.filter(
        is_resolved=False,
        created_at__gt=profile.last_seen_contacts_at,
    ).count() if profile.last_seen_contacts_at else ContactMessage.objects.filter(is_resolved=False).count()

    return Response(
        {
            'bookings': bookings_count,
            'reviews': reviews_count,
            'contacts': contacts_count,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_mark_nav_section_read_view(request):
    section = request.data.get('section')
    allowed_sections = {
        'bookings': 'last_seen_bookings_at',
        'reviews': 'last_seen_reviews_at',
        'contacts': 'last_seen_contacts_at',
    }

    if section not in allowed_sections:
        return Response({'error': 'Muc thong bao khong hop le'}, status=status.HTTP_400_BAD_REQUEST)

    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'phone': f'admin-{request.user.id}', 'address': ''},
    )
    field_name = allowed_sections[section]
    setattr(profile, field_name, timezone.now())
    profile.save(update_fields=[field_name, 'updated_at'])

    return Response({'message': 'Da danh dau da xem thong bao'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def featured_teams_view(request):
    from apps.bookings.models import Booking

    profiles = (
        UserProfile.objects.select_related('user')
        .exclude(team_name__isnull=True)
        .exclude(team_name__exact='')
        .order_by('team_name', '-updated_at')
    )

    booking_counts = {
        item['user_id']: item['count']
        for item in Booking.objects.values('user_id').annotate(count=Count('id'))
    }

    teams_map = {}
    for profile in profiles:
        team_name = (profile.team_name or '').strip()
        if not team_name:
            continue

        team_key = team_name.lower()
        team = teams_map.setdefault(
            team_key,
            {
                'team_name': team_name,
                'team_image_url': None,
                'booking_count': 0,
            },
        )
        team['booking_count'] += booking_counts.get(profile.user_id, 0)
        if not team['team_image_url']:
            team['team_image_url'] = _build_team_image_url(profile, request)

    ranked_teams = sorted(
        teams_map.values(),
        key=lambda item: (-item['booking_count'], item['team_name'].lower()),
    )

    payload = [
        {
            'rank': index + 1,
            'team_name': item['team_name'],
            'team_image_url': item['team_image_url'],
            'booking_count': item['booking_count'],
        }
        for index, item in enumerate(ranked_teams)
    ]

    serializer = FeaturedTeamSerializer(payload, many=True)
    return Response({'results': serializer.data}, status=status.HTTP_200_OK)
