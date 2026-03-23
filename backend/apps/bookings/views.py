# apps/bookings/views.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q

from .models import Booking
from .serializers import (
    BookingListSerializer,
    BookingDetailSerializer,
    BookingCreateSerializer,
    BookingCancelSerializer,
    BookingConfirmSerializer
)


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission:
    - Owner có thể xem booking của mình
    - Admin có thể xem tất cả bookings
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.is_staff


class BookingListView(generics.ListAPIView):
    """
    GET /api/bookings/
    
    List bookings:
    - User thường: chỉ thấy bookings của mình
    - Admin: thấy tất cả bookings
    
    Query params:
    - status: pending/confirmed/completed/cancelled
    - date: YYYY-MM-DD
    - field: field_id
    """
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin thấy tất cả, user thường chỉ thấy của mình
        if user.is_staff:
            queryset = Booking.objects.all()
        else:
            queryset = Booking.objects.filter(user=user)
        
        queryset = queryset.select_related('user', 'field', 'field__field_type').order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date
        date_filter = self.request.query_params.get('date')
        if date_filter:
            queryset = queryset.filter(booking_date=date_filter)
        
        # Filter by field
        field_filter = self.request.query_params.get('field')
        if field_filter:
            queryset = queryset.filter(field_id=field_filter)
        
        return queryset


class BookingDetailView(generics.RetrieveAPIView):
    """
    GET /api/bookings/:id/
    
    Xem chi tiết booking
    - Owner hoặc Admin
    """
    queryset = Booking.objects.select_related('user', 'field').prefetch_related('booking_timeslots__timeslot')
    serializer_class = BookingDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]


class BookingCreateView(generics.CreateAPIView):
    """
    POST /api/bookings/
    
    Tạo booking mới
    
    Body: {
        "field": 1,
        "booking_date": "2026-02-26",
        "timeslot_ids": [1, 2, 3],
        "customer_name": "Nguyễn Văn A",
        "customer_phone": "0123456789",
        "customer_email": "email@example.com",
        "notes": "Ghi chú thêm..."
    }
    
    Response: {
        "id": 1,
        "field": {...},
        "booking_date": "2026-02-26",
        "total_amount": 900000,
        "deposit_amount": 270000,
        "status": "pending",
        "booking_timeslots": [...]
    }
    """
    serializer_class = BookingCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        
        # Return detailed booking info
        detail_serializer = BookingDetailSerializer(booking, context={'request': request})
        
        return Response({
            'message': 'Booking created successfully',
            'booking': detail_serializer.data
        }, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated, IsOwnerOrAdmin])
def booking_cancel_view(request, pk):
    """
    PUT /api/bookings/:id/cancel/
    
    Hủy booking (chỉ Owner hoặc Admin)
    
    Body: {
        "reason": "Lý do hủy..." (optional)
    }
    """
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Booking not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permission
    if booking.user != request.user and not request.user.is_staff:
        return Response(
            {'error': 'You do not have permission to cancel this booking'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = BookingCancelSerializer(instance=booking, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    detail_serializer = BookingDetailSerializer(booking, context={'request': request})
    
    return Response({
        'message': 'Booking cancelled successfully',
        'booking': detail_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([permissions.IsAdminUser])
def booking_confirm_view(request, pk):
    """
    PUT /api/bookings/:id/confirm/
    
    Admin xác nhận booking
    (Hoặc tự động sau khi payment completed)
    """
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Booking not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = BookingConfirmSerializer(instance=booking, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    detail_serializer = BookingDetailSerializer(booking, context={'request': request})
    
    return Response({
        'message': 'Booking confirmed successfully',
        'booking': detail_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([permissions.IsAdminUser])
def booking_complete_view(request, pk):
    """
    PUT /api/bookings/:id/complete/
    
    Admin đánh dấu booking hoàn thành
    (Sau khi khách đã đá xong)
    """
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Booking not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if booking.status != 'confirmed':
        return Response(
            {'error': 'Only confirmed bookings can be marked as completed'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    booking.status = 'completed'
    booking.save(update_fields=['status', 'updated_at'])
    
    detail_serializer = BookingDetailSerializer(booking, context={'request': request})
    
    return Response({
        'message': 'Booking marked as completed',
        'booking': detail_serializer.data
    }, status=status.HTTP_200_OK)