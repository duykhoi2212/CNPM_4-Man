from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
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
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        field_id = self.request.query_params.get('field')
        if field_id:
            queryset = FieldSchedule.objects.filter(field_id=field_id)
            if not (self.request.user.is_authenticated and self.request.user.is_staff):
                queryset = queryset.filter(field__is_active=True)
            return queryset.order_by('day_of_week')

        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            return FieldSchedule.objects.filter(field__is_active=True).order_by('field', 'day_of_week')
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
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        field_id = self.request.query_params.get('field')
        queryset = FieldClosure.objects.all()
        if field_id:
            queryset = queryset.filter(field_id=field_id)

        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            return queryset.filter(field__is_active=True).order_by('-start_date')
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

    def perform_create(self, serializer):
        # Trong luồng admin: khi tạo swap từ danh sách đề xuất,
        # hệ thống mặc định đưa swap vào trạng thái "proposed"
        # để admin có thể xác nhận ngay.
        swap = serializer.save()
        if getattr(swap, 'status', None) == 'pending':
            swap.status = 'proposed'
            swap.save(update_fields=['status'])


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
def find_alternative_fields(request, incident_id=None):
    """
    POST /api/field-swaps/find-alternative/
    Tìm sân thay thế khi có sự cố
    """
    if incident_id is None:
        incident_id = request.data.get('incident_id') or request.query_params.get('incident_id')

    if not incident_id:
        return Response({'error': 'incident_id is required'}, status=status.HTTP_400_BAD_REQUEST)

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
    
    # Chỉ lấy sân cùng vị trí để việc đổi sân sát thực tế vận hành hơn.
    same_location_fields = Field.objects.filter(
        location=original_field.location,
        is_active=True
    ).exclude(id=original_field.id)
    
    for field in same_location_fields:
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

        # Kiểm tra xem các khung giờ có trống không (bao gồm cả booking + giao lưu match giữ chỗ)
        #
        # Lưu ý: TimeSlot không gắn theo ngày cụ thể, nên để ổn định, ta:
        # 1) tạo/đồng bộ TimeSlot theo đúng start/end của time_ranges nếu cần
        # 2) kiểm tra các timeslot đó có bị "booked" hoặc "reserved" bởi booking/match trong booking_date hay không
        from apps.matches.models import MatchRequestTimeSlot

        # slot_duration của schedule phải khớp với booking cũ để đảm bảo timeslot trùng nhau
        required_duration_minutes = int(
            (datetime.combine(booking_date, time_ranges[0][1]) - datetime.combine(booking_date, time_ranges[0][0])).total_seconds() / 60
        )
        if schedule.slot_duration != required_duration_minutes:
            continue

        open_time = schedule.open_time
        close_time = schedule.close_time

        # Bắt buộc toàn bộ time_ranges đều nằm trong khoảng mở cửa của schedule
        if any(start_time < open_time or end_time > close_time for start_time, end_time in time_ranges):
            continue

        required_slots = []
        for start_time, end_time in time_ranges:
            is_peak = start_time.hour >= 18 and start_time.hour < 21
            price = field.peak_hour_price if is_peak else field.price_per_hour

            slot, _ = TimeSlot.objects.get_or_create(
                field=field,
                start_time=start_time,
                end_time=end_time,
                defaults={
                    'price': price,
                    'is_peak_hour': is_peak,
                    'is_active': True,
                }
            )

            # Đồng bộ price/is_peak/is_active nếu có thay đổi
            updated_fields = []
            if slot.price != price:
                slot.price = price
                updated_fields.append('price')
            if slot.is_peak_hour != is_peak:
                slot.is_peak_hour = is_peak
                updated_fields.append('is_peak_hour')
            if not slot.is_active:
                slot.is_active = True
                updated_fields.append('is_active')
            if updated_fields:
                slot.save(update_fields=updated_fields)

            required_slots.append(slot)

        required_slot_ids = [s.id for s in required_slots]
        now = timezone.now()

        booked_slot_ids = set(
            BookingTimeSlot.objects.filter(
                booking__booking_date=booking_date,
                booking__status__in=['pending_payment', 'confirmed'],
                timeslot__in=required_slots
            ).values_list('timeslot_id', flat=True)
        )

        match_reserved_slot_ids = set(
            MatchRequestTimeSlot.objects.filter(
                match_request__field=field,
                match_request__booking_date=booking_date,
                match_request__status='accepted_waiting_deposit',
                match_request__reserved_until__gt=now,
                timeslot__in=required_slots
            ).values_list('timeslot_id', flat=True)
        )

        match_booked_slot_ids = set(
            MatchRequestTimeSlot.objects.filter(
                match_request__field=field,
                match_request__booking_date=booking_date,
                match_request__status='deposit_paid',
                timeslot__in=required_slots
            ).values_list('timeslot_id', flat=True)
        )

        available_slots = [
            slot for slot in required_slots
            if slot.id not in booked_slot_ids
            and slot.id not in match_reserved_slot_ids
            and slot.id not in match_booked_slot_ids
        ]

        conflicting_booking_ids = list(
            BookingTimeSlot.objects.filter(
                booking__booking_date=booking_date,
                booking__status__in=['pending_payment', 'confirmed'],
                timeslot__in=required_slots
            )
            .exclude(booking=booking)
            .values_list('booking_id', flat=True)
            .distinct()
        )

        # Tính giá
        total_price = sum(slot.price for slot in required_slots)
        original_price = booking.total_amount
        price_diff = total_price - original_price

        alternative_fields.append({
            'field_id': field.id,
            'field_name': field.name,
            'field_type': field.field_type.name,
            'location': field.location,
            'same_location': True,
            'total_price': float(total_price),
            'price_difference': float(price_diff),
            'available_slots': len(available_slots),
            'required_slots': len(time_ranges),
            'can_swap_directly': len(available_slots) >= len(time_ranges),
            'requires_cancelling_bookings': bool(conflicting_booking_ids) and len(available_slots) < len(time_ranges),
            'conflicting_booking_ids': conflicting_booking_ids,
        })
    
    # Ưu tiên sân đổi được ngay trước, rồi đến sân cần hủy booking xung đột.
    alternative_fields.sort(
        key=lambda x: (
            0 if x['can_swap_directly'] else 1,
            0 if not x['requires_cancelling_bookings'] else 1,
            x['price_difference']
        )
    )
    
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
    
    force_cancel_conflicts = bool(request.data.get('force_cancel_conflicts'))

    # Cập nhật trực tiếp trên booking cũ thay vì tạo booking mới.
    original_booking = swap.original_booking
    new_field = swap.new_field
    
    if not new_field:
        return Response({'error': 'Swap does not have a target field'}, status=status.HTTP_400_BAD_REQUEST)

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

    if len(new_timeslots) != original_timeslots.count():
        return Response({'error': 'San moi khong co day du khung gio tuong ung'}, status=status.HTTP_400_BAD_REQUEST)

    conflicting_bookings = Booking.objects.filter(
        booking_date=original_booking.booking_date,
        status__in=['pending_payment', 'confirmed'],
        booking_timeslots__timeslot__in=new_timeslots
    ).exclude(id=original_booking.id).distinct()

    from apps.matches.models import MatchRequest, MatchRequestTimeSlot
    conflicting_match_request_ids = list(
        MatchRequestTimeSlot.objects.filter(
            match_request__field=new_field,
            match_request__booking_date=original_booking.booking_date,
            match_request__status__in=['accepted_waiting_deposit', 'deposit_paid'],
            timeslot__in=new_timeslots
        ).values_list('match_request_id', flat=True).distinct()
    )

    if (conflicting_bookings.exists() or conflicting_match_request_ids) and not force_cancel_conflicts:
        return Response(
            {
                'error': 'San moi dang co booking trung khung gio',
                'conflicting_booking_ids': list(conflicting_bookings.values_list('id', flat=True)),
                'conflicting_match_request_ids': conflicting_match_request_ids,
            },
            status=status.HTTP_409_CONFLICT
        )

    with transaction.atomic():
        if conflicting_bookings.exists() and force_cancel_conflicts:
            conflicting_bookings.update(status='cancelled')
        if conflicting_match_request_ids and force_cancel_conflicts:
            MatchRequest.objects.filter(
                id__in=conflicting_match_request_ids
            ).update(status='cancelled', reserved_until=None)

        BookingTimeSlot.objects.filter(booking=original_booking).delete()
        for ts in new_timeslots:
            BookingTimeSlot.objects.create(
                booking=original_booking,
                timeslot=ts
            )

        original_booking.field = new_field
        original_booking.total_amount = original_booking.total_amount + swap.price_difference
        original_booking.deposit_amount = new_field.calculate_deposit(original_booking.total_amount)
        original_booking.save(update_fields=['field', 'total_amount', 'deposit_amount', 'updated_at'])

        # Cập nhật swap như một log lịch sử đổi sân
        swap.new_booking = None
        swap.status = 'confirmed'
        swap.confirmed_at = timezone.now()
        swap.customer_notified = False
        swap.customer_accepted = None
        swap.admin_notes = (
            f"Da doi truc tiep booking #{original_booking.id} sang {new_field.name}."
            + (" Da huy booking xung dot." if conflicting_bookings.exists() and force_cancel_conflicts else "")
        )
        swap.save()

        # Cập nhật incident
        swap.incident.field = new_field
        swap.incident.status = 'resolved'
        swap.incident.resolved_at = timezone.now()
        swap.incident.save(update_fields=['field', 'status', 'resolved_at', 'updated_at'])
    
    return Response({
        'message': 'Da doi san thanh cong va cap nhat booking hien tai',
        'updated_booking_id': original_booking.id,
        'cancelled_booking_ids': list(conflicting_bookings.values_list('id', flat=True)) if conflicting_bookings.exists() and force_cancel_conflicts else [],
        'conflicting_match_request_ids': conflicting_match_request_ids,
        'swap': FieldSwapSerializer(swap).data
    }, status=status.HTTP_200_OK)
