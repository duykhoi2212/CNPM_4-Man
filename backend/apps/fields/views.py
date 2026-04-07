# apps/fields/views.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import IntegrityError
from django.db.models import Q, Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from datetime import datetime, date
from django.utils import timezone

from .models import Field, FieldType, TimeSlot, FieldImage
from .serializers import (
    FieldListSerializer,
    FieldDetailSerializer,
    FieldCreateUpdateSerializer,
    FieldImageSerializer,
    FieldTypeSerializer,
    TimeSlotAdminSerializer,
    TimeSlotAvailabilitySerializer,
    RecommendedFieldSerializer
)


class FieldTypeListView(generics.ListAPIView):
    """
    GET /api/fields/types/
    
    Lấy danh sách loại sân
    Public API (không cần auth)
    """
    queryset = FieldType.objects.all()
    serializer_class = FieldTypeSerializer
    permission_classes = [permissions.AllowAny]


class FieldListView(generics.ListAPIView):
    """
    GET /api/fields/
    
    Lấy danh sách sân với filter & search
    Public API
    
    Query params:
    - type: field_type_id (int)
    - price_min: giá tối thiểu (decimal)
    - price_max: giá tối đa (decimal)
    - rating_min: đánh giá tối thiểu (decimal)
    - search: tìm theo tên hoặc địa chỉ
    - ordering: sắp xếp (price_per_hour, -avg_rating, name)
    
    Example: /api/fields/?type=1&price_max=500000&rating_min=4&search=sân&ordering=-avg_rating
    """
    serializer_class = FieldListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'location']
    ordering_fields = ['price_per_hour', 'avg_rating', 'name']
    ordering = ['-avg_rating']  # Default ordering
    
    def get_queryset(self):
        queryset = Field.objects.select_related('field_type')

        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        # Filter by field type
        field_type = self.request.query_params.get('type')
        if field_type:
            queryset = queryset.filter(field_type_id=field_type)
        
        # Filter by price range
        price_min = self.request.query_params.get('price_min')
        if price_min:
            queryset = queryset.filter(price_per_hour__gte=price_min)
        
        price_max = self.request.query_params.get('price_max')
        if price_max:
            queryset = queryset.filter(price_per_hour__lte=price_max)
        
        # Filter by rating
        rating_min = self.request.query_params.get('rating_min')
        if rating_min:
            queryset = queryset.filter(avg_rating__gte=rating_min)
        
        return queryset


class FieldDetailView(generics.RetrieveAPIView):
    """
    GET /api/fields/:id/
    
    Xem chi tiết sân (bao gồm ảnh, khung giờ)
    Public API
    """
    queryset = Field.objects.filter(is_active=True).select_related('field_type').prefetch_related('images', 'time_slots')
    serializer_class = FieldDetailSerializer
    permission_classes = [permissions.AllowAny]


class FieldCreateView(generics.CreateAPIView):
    """
    POST /api/fields/
    
    Tạo sân mới (Admin only)
    
    Body: {
        "field_type": 1,
        "name": "Sân A",
        "description": "Sân 5 người đẹp",
        "location": "123 Đường ABC",
        "price_per_hour": 300000,
        "peak_hour_price": 400000,
        "deposit_percent": 30,
        "is_active": true
    }
    """
    queryset = Field.objects.all()
    serializer_class = FieldCreateUpdateSerializer
    permission_classes = [permissions.IsAdminUser]


class FieldUpdateView(generics.UpdateAPIView):
    """
    PUT/PATCH /api/fields/:id/
    
    Cập nhật thông tin sân (Admin only)
    """
    queryset = Field.objects.all()
    serializer_class = FieldCreateUpdateSerializer
    permission_classes = [permissions.IsAdminUser]


class FieldDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/fields/:id/
    
    Xóa sân (Admin only)
    """
    queryset = Field.objects.all()
    permission_classes = [permissions.IsAdminUser]


class TimeSlotAdminListCreateView(generics.ListCreateAPIView):
    """
    GET /api/fields/timeslots/
    POST /api/fields/timeslots/

    Admin quản lý danh sách khung giờ
    Query params:
    - field: field_id
    """
    queryset = TimeSlot.objects.select_related('field')
    serializer_class = TimeSlotAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    ordering = ['field__name', 'start_time']

    def get_queryset(self):
        queryset = super().get_queryset()
        field_id = self.request.query_params.get('field')
        if field_id:
            queryset = queryset.filter(field_id=field_id)
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {'error': 'Khung gio nay da ton tai cho san da chon'},
                status=status.HTTP_400_BAD_REQUEST
            )


class TimeSlotAdminUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/fields/timeslots/:id/
    PUT/PATCH /api/fields/timeslots/:id/
    DELETE /api/fields/timeslots/:id/
    """
    queryset = TimeSlot.objects.select_related('field')
    serializer_class = TimeSlotAdminSerializer
    permission_classes = [permissions.IsAdminUser]

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {'error': 'Khung gio nay da ton tai cho san da chon'},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def field_image_upload_view(request, pk):
    try:
        field = Field.objects.get(pk=pk)
    except Field.DoesNotExist:
        return Response({'error': 'Field not found'}, status=status.HTTP_404_NOT_FOUND)

    image_file = request.FILES.get('image')
    if not image_file:
        return Response({'error': 'Image file is required'}, status=status.HTTP_400_BAD_REQUEST)

    is_primary = str(request.data.get('is_primary', '')).lower() in ['true', '1', 'yes', 'on']
    order = request.data.get('order', 0)

    field_image = FieldImage.objects.create(
        field=field,
        image_url=image_file,
        is_primary=is_primary,
        order=order or 0
    )

    serializer = FieldImageSerializer(field_image, context={'request': request})
    return Response(
        {
            'message': 'Field image uploaded successfully',
            'image': serializer.data,
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['PATCH'])
@permission_classes([permissions.IsAdminUser])
def field_image_set_primary_view(request, pk, image_id):
    try:
        field_image = FieldImage.objects.get(pk=image_id, field_id=pk)
    except FieldImage.DoesNotExist:
        return Response({'error': 'Field image not found'}, status=status.HTTP_404_NOT_FOUND)

    field_image.is_primary = True
    field_image.save()

    serializer = FieldImageSerializer(field_image, context={'request': request})
    return Response(
        {
            'message': 'Primary image updated successfully',
            'image': serializer.data,
        },
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
@permission_classes([permissions.IsAdminUser])
def field_image_delete_view(request, pk, image_id):
    try:
        field_image = FieldImage.objects.get(pk=image_id, field_id=pk)
    except FieldImage.DoesNotExist:
        return Response({'error': 'Field image not found'}, status=status.HTTP_404_NOT_FOUND)

    field_image.delete()
    return Response({'message': 'Field image deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def recommended_fields_view(request):
    from apps.bookings.models import Booking

    limit = request.query_params.get('limit', 4)
    try:
        limit = max(1, min(int(limit), 8))
    except (TypeError, ValueError):
        limit = 4

    queryset = Field.objects.filter(is_active=True).select_related('field_type').prefetch_related('images', 'time_slots')
    if not queryset.exists():
        return Response({'results': []}, status=status.HTTP_200_OK)

    booking_counts = {
        item['field_id']: item['count']
        for item in Booking.objects.filter(status='completed')
        .values('field_id')
        .annotate(count=Count('id'))
    }

    preferred_field_type_id = None
    if request.user.is_authenticated:
        preferred = (
            Booking.objects.filter(user=request.user)
            .values('field__field_type_id')
            .annotate(count=Count('id'))
            .order_by('-count')
            .first()
        )
        if preferred:
            preferred_field_type_id = preferred['field__field_type_id']

    scored_fields = []
    recommendation_reasons = {}
    recommendation_scores = {}

    for field in queryset:
        score = 0
        reasons = []
        active_slots = sum(1 for slot in field.time_slots.all() if slot.is_active)
        completed_bookings = booking_counts.get(field.id, 0)
        avg_rating = float(field.avg_rating or 0)
        regular_price = float(field.price_per_hour or 0)

        if preferred_field_type_id and field.field_type_id == preferred_field_type_id:
            score += 3.5
            reasons.append('Phu hop voi lich su dat san cua ban')

        if avg_rating >= 4.5:
            score += 3
            reasons.append('Danh gia rat cao tu nguoi choi')
        elif avg_rating >= 4:
            score += 2
            reasons.append('Danh gia cao va on dinh')
        elif avg_rating > 0:
            score += 1

        if completed_bookings >= 5:
            score += 2.5
            reasons.append('San duoc dat nhieu gan day')
        elif completed_bookings >= 2:
            score += 1.5

        if active_slots >= 6:
            score += 2
            reasons.append('Con nhieu khung gio de chon')
        elif active_slots >= 3:
            score += 1

        if regular_price and regular_price <= 300000:
            score += 1.5
            reasons.append('Gia hop ly de dat nhanh')
        elif regular_price and regular_price <= 500000:
            score += 0.5

        if not reasons:
            reasons.append('San phu hop de dat nhanh')

        recommendation_reasons[field.id] = reasons[0]
        recommendation_scores[field.id] = round(score, 2)
        scored_fields.append((score, field))

    scored_fields.sort(key=lambda item: (item[0], float(item[1].avg_rating or 0), booking_counts.get(item[1].id, 0)), reverse=True)
    selected_fields = [field for _, field in scored_fields[:limit]]

    serializer = RecommendedFieldSerializer(
        selected_fields,
        many=True,
        context={
            'request': request,
            'recommendation_reasons': recommendation_reasons,
            'recommendation_scores': recommendation_scores,
        }
    )
    return Response({'results': serializer.data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def field_availability_view(request, pk):
    """
    GET /api/fields/:id/availability/?date=YYYY-MM-DD
    
    Kiểm tra khung giờ trống của sân theo ngày
    
    Response: {
        "field_id": 1,
        "field_name": "Sân A",
        "date": "2026-02-26",
        "timeslots": [
            {
                "timeslot_id": 1,
                "start_time": "06:00:00",
                "end_time": "07:00:00",
                "price": 300000,
                "is_peak_hour": false,
                "is_available": true,
                "duration_hours": 1.0
            },
            ...
        ]
    }
    """
    # Get field
    try:
        field = Field.objects.get(pk=pk, is_active=True)
    except Field.DoesNotExist:
        return Response(
            {'error': 'Field not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get date from query params
    date_str = request.query_params.get('date')
    if not date_str:
        return Response(
            {'error': 'Date parameter is required (format: YYYY-MM-DD)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate date is not in the past
    if check_date < date.today():
        return Response(
            {'error': 'Cannot check availability for past dates'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get all timeslots for this field
    timeslots = field.time_slots.filter(is_active=True).order_by('start_time')
    
    # Check which timeslots are already booked
    from apps.bookings.models import Booking, BookingTimeSlot
    from apps.matches.models import MatchRequestTimeSlot
    
    booked_timeslot_ids = set(BookingTimeSlot.objects.filter(
        booking__field=field,
        booking__booking_date=check_date,
        booking__status__in=['pending_payment', 'confirmed']
    ).values_list('timeslot_id', flat=True))

    reserved_timeslot_ids = set(MatchRequestTimeSlot.objects.filter(
        match_request__field=field,
        match_request__booking_date=check_date,
        match_request__status='accepted_waiting_deposit',
        match_request__reserved_until__gt=timezone.now(),
    ).values_list('timeslot_id', flat=True))

    match_booked_timeslot_ids = set(MatchRequestTimeSlot.objects.filter(
        match_request__field=field,
        match_request__booking_date=check_date,
        match_request__status='deposit_paid',
    ).values_list('timeslot_id', flat=True))
    
    # Build response
    timeslots_data = []
    for slot in timeslots:
        is_booked = slot.id in booked_timeslot_ids or slot.id in match_booked_timeslot_ids
        is_reserved = slot.id in reserved_timeslot_ids
        timeslots_data.append({
            'timeslot_id': slot.id,
            'start_time': slot.start_time,
            'end_time': slot.end_time,
            'price': slot.price,
            'is_peak_hour': slot.is_peak_hour,
            'is_available': not (is_booked or is_reserved),
            'reservation_status': 'da_dat' if is_booked else 'dang_giu_cho' if is_reserved else 'con_trong',
            'duration_hours': slot.duration_hours
        })
    
    return Response({
        'field_id': field.id,
        'field_name': field.name,
        'date': check_date,
        'timeslots': timeslots_data
    }, status=status.HTTP_200_OK)


