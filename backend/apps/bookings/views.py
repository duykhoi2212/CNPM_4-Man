# apps/bookings/views.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Booking
from .serializers import (
    BookingListSerializer,
    BookingDetailSerializer,
    BookingCreateSerializer,
    BookingCancelSerializer,
    BookingConfirmSerializer
)


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.is_staff


class BookingListView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_staff:
            queryset = Booking.objects.all()
        else:
            queryset = Booking.objects.filter(user=user)

        queryset = queryset.select_related('user', 'field', 'field__field_type').order_by('-created_at')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        date_filter = self.request.query_params.get('date')
        if date_filter:
            queryset = queryset.filter(booking_date=date_filter)

        field_filter = self.request.query_params.get('field')
        if field_filter:
            queryset = queryset.filter(field_id=field_filter)

        return queryset


class BookingDetailView(generics.RetrieveAPIView):
    queryset = Booking.objects.select_related('user', 'field').prefetch_related('booking_timeslots__timeslot')
    serializer_class = BookingDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]


class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()

        detail_serializer = BookingDetailSerializer(booking, context={'request': request})

        return Response({
            'message': 'Tao booking thanh cong, vui long thanh toan tien coc',
            'booking': detail_serializer.data
        }, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def booking_cancel_view(request, pk):
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Khong tim thay booking'}, status=status.HTTP_404_NOT_FOUND)

    if booking.user != request.user and not request.user.is_staff:
        return Response({'error': 'Ban khong co quyen huy booking nay'}, status=status.HTTP_403_FORBIDDEN)

    serializer = BookingCancelSerializer(instance=booking, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    detail_serializer = BookingDetailSerializer(booking, context={'request': request})

    return Response({
        'message': 'Da huy booking thanh cong',
        'booking': detail_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([permissions.IsAdminUser])
def booking_confirm_view(request, pk):
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Khong tim thay booking'}, status=status.HTTP_404_NOT_FOUND)

    serializer = BookingConfirmSerializer(instance=booking, data=request.data)
    serializer.is_valid(raise_exception=True)
    return Response({'booking_id': booking.id}, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([permissions.IsAdminUser])
def booking_complete_view(request, pk):
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Khong tim thay booking'}, status=status.HTTP_404_NOT_FOUND)

    if booking.status != 'confirmed':
        return Response({'error': 'Chi booking da xac nhan moi co the hoan thanh'}, status=status.HTTP_400_BAD_REQUEST)

    booking.status = 'completed'
    booking.save(update_fields=['status', 'updated_at'])

    detail_serializer = BookingDetailSerializer(booking, context={'request': request})

    return Response({
        'message': 'Da cap nhat booking hoan thanh',
        'booking': detail_serializer.data
    }, status=status.HTTP_200_OK)
