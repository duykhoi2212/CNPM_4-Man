# apps/fields/views.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from datetime import datetime, date

from .models import Field, FieldType, TimeSlot
from .serializers import (
    FieldListSerializer,
    FieldDetailSerializer,
    FieldCreateUpdateSerializer,
    FieldTypeSerializer,
    TimeSlotAvailabilitySerializer
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
        queryset = Field.objects.filter(is_active=True).select_related('field_type')
        
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
    
    booked_timeslot_ids = BookingTimeSlot.objects.filter(
        booking__field=field,
        booking__booking_date=check_date,
        booking__status__in=['pending', 'confirmed']
    ).values_list('timeslot_id', flat=True)
    
    # Build response
    timeslots_data = []
    for slot in timeslots:
        timeslots_data.append({
            'timeslot_id': slot.id,
            'start_time': slot.start_time,
            'end_time': slot.end_time,
            'price': slot.price,
            'is_peak_hour': slot.is_peak_hour,
            'is_available': slot.id not in booked_timeslot_ids,
            'duration_hours': slot.duration_hours
        })
    
    return Response({
        'field_id': field.id,
        'field_name': field.name,
        'date': check_date,
        'timeslots': timeslots_data
    }, status=status.HTTP_200_OK)