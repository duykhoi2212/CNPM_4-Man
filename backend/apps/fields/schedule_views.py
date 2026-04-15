from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta

from .schedule_models import FieldSchedule, FieldClosure
from .incident_models import IncidentReport, FieldSwap
from .schedule_serializers import (
    FieldScheduleSerializer,
    FieldScheduleCreateSerializer,
    FieldClosureSerializer,
    IncidentReportSerializer,
    IncidentReportCreateSerializer,
    FieldSwapSerializer,
    FieldSwapCreateSerializer
)
from .models import Field, TimeSlot
from .access import can_manage_field, get_managed_fields_queryset
from apps.bookings.models import Booking, BookingTimeSlot


# ==================== FIELD SCHEDULE APIs ====================

class FieldScheduleListCreateView(generics.ListCreateAPIView):
    """
    GET /api/fields/schedules/ - Lấy danh sách lịch theo field_id
    POST /api/fields/schedules/ - Tạo lịch mới
    """
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        field_id = self.request.query_params.get('field')
        if field_id:
            return FieldSchedule.objects.filter(field_id=field_id).order_by('day_of_week')
        return FieldSchedule.objects.filter(
            field__in=get_managed_fields_queryset(self.request.user)
        ).order_by('field', 'day_of_week')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FieldScheduleCreateSerializer
        return FieldScheduleSerializer
    
    def perform_create(self, serializer):
        field = serializer.validated_data['field']
        if not can_manage_field(self.request.user, field):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Bạn không có quyền quản lý sân này')
        serializer.save()


class FieldScheduleUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/DELETE /api/fields/schedules/:id/
    """
    serializer_class = FieldScheduleSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        return FieldSchedule.objects.filter(
            field__in=get_managed_fields_queryset(self.request.user)
        )


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def generate_time_slots_from_schedule(request, field_id):
    """
    POST /api/fields/:id/schedules/generate-slots/
    Tự động sinh TimeSlot từ FieldSchedule
    """
    try:
        field = Field.objects.get(pk=field_id)
    except Field.DoesNotExist:
        return Response({'error': 'Field not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not can_manage_field(request.user, field):
        return Response({'error': 'Bạn không có quyền quản lý sân này'}, status=status.HTTP_403_FORBIDDEN)
    
    # Xóa tất cả timeslot cũ
    TimeSlot.objects.filter(field=field).delete()
    
    # Sinh timeslot mới từ schedule
    schedules = FieldSchedule.objects.filter(field=field)
    total_slots = 0
    
    for schedule in schedules:
        slots = schedule.generate_time_slots()
        total_slots += len(slots)
    
    return Response({
        'message': f'Đã tạo thành công {total_slots} khung giờ cho {field.name}',
        'total_slots': total_slots
    }, status=status.HTTP_201_CREATED)


# ==================== FIELD CLOSURE APIs ====================

class FieldClosureListCreateView(generics.ListCreateAPIView):
    """
    GET /api/fields/closures/ - Lấy danh sách ngày đóng cửa
    POST /api/fields/closures/ - Tạo ngày đóng cửa mới
    """
    serializer_class = FieldClosureSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        field_id = self.request.query_params.get('field')
        queryset = FieldClosure.objects.all()
        if field_id:
            queryset = queryset.filter(field_id=field_id)
        return queryset.filter(
            field__in=get_managed_fields_queryset(self.request.user)
        ).order_by('-start_date')


class FieldClosureUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/DELETE /api/fields/closures/:id/
    """
    serializer_class = FieldClosureSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        return FieldClosure.objects.filter(
            field__in=get_managed_fields_queryset(self.request.user)
        )


# ==================== INCIDENT REPORT APIs ====================

class IncidentReportListCreateView(generics.ListCreateAPIView):
    """
    GET /api/incidents/ - Danh sách báo cáo sự cố
    POST /api/incidents/ - Tạo báo cáo mới
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = IncidentReport.objects.all()
        
        # Admin xem tất cả, user chỉ xem của mình
        if not user.is_staff:
            queryset = queryset.filter(reported_by=user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by field
        field_id = self.request.query_params.get('field')
        if field_id:
            queryset = queryset.filter(field_id=field_id)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return IncidentReportCreateSerializer
        return IncidentReportSerializer
    
    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user, status='pending')


class IncidentReportDetailView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT /api/incidents/:id/
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = IncidentReportSerializer
    
    def get_queryset(self):
        return IncidentReport.objects.all()


# ==================== FIELD SWAP APIs ====================

class FieldSwapListCreateView(generics.ListCreateAPIView):
    """
    GET /api/field-swaps/ - Danh sách đổi sân
    POST /api/field-swaps/ - Tạo yêu cầu đổi sân
    """
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = FieldSwap.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FieldSwapCreateSerializer
        return FieldSwapSerializer


class FieldSwapDetailView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT /api/field-swaps/:id/
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = FieldSwapSerializer
    
    def get_queryset(self):
        return FieldSwap.objects.all()


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def find_alternative_fields(request, incident_id):
    """
    POST /api/field-swaps/find-alternative/
    Tìm sân thay thế khi có sự cố
    """
    try:
        incident = IncidentReport.objects.get(pk=incident_id)
    except IncidentReport.DoesNotExist:
        return Response({'error': 'Incident not found'}, status=status.HTTP_404_NOT_FOUND)
    
    booking = incident.booking
    original_field = incident.field
    
    # Lấy thông tin từ booking
    booking_date = booking.booking_date
    booked_timeslots = BookingTimeSlot.objects.filter(booking=booking).values_list('timeslot_id', flat=True)
    timeslots = TimeSlot.objects.filter(id__in=booked_timeslots)
    
    if not timeslots.exists():
        return Response({'error': 'No timeslots found for this booking'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Lấy khung giờ cần tìm
    time_ranges = [(ts.start_time, ts.end_time) for ts in timeslots]
    
    # Tìm sân thay thế
    alternative_fields = []
    
    # Lấy tất cả sân cùng loại
    same_type_fields = Field.objects.filter(
        field_type=original_field.field_type,
        is_active=True
    ).exclude(id=original_field.id)
    
    for field in same_type_fields:
        # Kiểm tra xem sân có đóng cửa ngày đó không
        is_closed = FieldClosure.objects.filter(
            field=field,
            start_date__lte=booking_date,
            end_date__gte=booking_date
        ).exists()
        
        if is_closed:
            continue
        
        # Kiểm tra xem có schedule mở cửa không
        day_of_week = booking_date.weekday()  # 0=Monday
        schedule = FieldSchedule.objects.filter(
            field=field,
            day_of_week=day_of_week,
            is_open=True
        ).first()
        
        if not schedule:
            continue
        
        # Kiểm tra xem các khung giờ có trống không
        available_slots = []
        for start_time, end_time in time_ranges:
            # Tìm timeslot tương ứng ở sân mới
            matching_slot = TimeSlot.objects.filter(
                field=field,
                start_time=start_time,
                end_time=end_time,
                is_active=True
            ).first()
            
            if matching_slot:
                # Kiểm tra xem slot đã được booking chưa
                is_booked = BookingTimeSlot.objects.filter(
                    timeslot=matching_slot,
                    booking__booking_date=booking_date,
                    booking__status__in=['pending_payment', 'confirmed']
                ).exists()
                
                if not is_booked:
                    available_slots.append(matching_slot)
        
        # Nếu có đủ slot trống
        if len(available_slots) >= len(time_ranges):
            # Tính khoảng cách
            from math import asin, cos, radians, sin, sqrt
            
            distance_km = None
            if original_field.latitude and original_field.longitude and field.latitude and field.longitude:
                earth_radius_km = 6371
                lat1, lon1, lat2, lon2 = map(radians, [
                    float(original_field.latitude),
                    float(original_field.longitude),
                    float(field.latitude),
                    float(field.longitude)
                ])
                delta_lat = lat2 - lat1
                delta_lon = lon2 - lon1
                a = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lon / 2) ** 2
                c = 2 * asin(sqrt(a))
                distance_km = round(earth_radius_km * c, 2)
            
            # Tính giá
            total_price = sum(slot.price for slot in available_slots)
            original_price = booking.total_amount
            price_diff = total_price - original_price
            
            alternative_fields.append({
                'field_id': field.id,
                'field_name': field.name,
                'field_type': field.field_type.name,
                'location': field.location,
                'distance_km': distance_km,
                'total_price': float(total_price),
                'price_difference': float(price_diff),
                'available_slots': len(available_slots),
                'required_slots': len(time_ranges),
            })
    
    # Sắp xếp theo khoảng cách và giá
    alternative_fields.sort(key=lambda x: (x['distance_km'] or 999, x['price_difference']))
    
    return Response({
        'incident_id': incident_id,
        'original_field': {
            'id': original_field.id,
            'name': original_field.name,
        },
        'booking_date': booking_date,
        'alternatives': alternative_fields[:5],  # Top 5
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def confirm_field_swap(request, swap_id):
    """
    POST /api/field-swaps/:id/confirm/
    Xác nhận đổi sân và tạo booking mới
    """
    try:
        swap = FieldSwap.objects.get(pk=swap_id)
    except FieldSwap.DoesNotExist:
        return Response({'error': 'FieldSwap not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if swap.status != 'proposed':
        return Response({'error': 'Swap must be in proposed status'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Tạo booking mới
    original_booking = swap.original_booking
    new_field = swap.new_field
    
    # Lấy timeslots từ sân mới
    booked_timeslots = BookingTimeSlot.objects.filter(booking=original_booking).values_list('timeslot_id', flat=True)
    original_timeslots = TimeSlot.objects.filter(id__in=booked_timeslots)
    
    # Tìm timeslots tương ứng ở sân mới
    new_timeslots = []
    for ts in original_timeslots:
        new_ts = TimeSlot.objects.filter(
            field=new_field,
            start_time=ts.start_time,
            end_time=ts.end_time
        ).first()
        if new_ts:
            new_timeslots.append(new_ts)
    
    # Tạo booking mới
    new_booking = Booking.objects.create(
        user=original_booking.user,
        field=new_field,
        booking_date=original_booking.booking_date,
        customer_name=original_booking.customer_name,
        customer_phone=original_booking.customer_phone,
        customer_email=original_booking.customer_email,
        total_amount=original_booking.total_amount + swap.price_difference,
        deposit_amount=original_booking.deposit_amount + (swap.price_difference * original_booking.deposit_percent / 100),
        status='confirmed'
    )
    
    # Link timeslots với booking mới
    for ts in new_timeslots:
        BookingTimeSlot.objects.create(
            booking=new_booking,
            timeslot=ts
        )
    
    # Cập nhật swap
    swap.new_booking = new_booking
    swap.status = 'confirmed'
    swap.confirmed_at = timezone.now()
    swap.save()
    
    # Hủy booking cũ
    original_booking.status = 'cancelled'
    original_booking.save()
    
    # Cập nhật incident
    swap.incident.status = 'resolved'
    swap.incident.resolved_at = timezone.now()
    swap.incident.save()
    
    return Response({
        'message': 'Field swap confirmed successfully',
        'new_booking_id': new_booking.id,
        'swap': FieldSwapSerializer(swap).data
    }, status=status.HTTP_200_OK)
