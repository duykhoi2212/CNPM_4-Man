from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.accounts.models import UserProfile
from apps.bookings.models import Booking, BookingTimeSlot
from apps.payments.models import Payment
from apps.payments.serializers import PaymentConfirmSerializer

from .models import MatchRequest
from .serializers import MatchRequestCreateSerializer, MatchRequestListSerializer
from .services import cancel_match_requests_blocked_by_bookings, expire_stale_match_requests


def _team_snapshot_for_user(user):
    try:
        profile = user.profile
        team_name = (profile.team_name or '').strip()
        if not team_name or not profile.team_image:
            return None, None
        team_image_url = profile.team_image.url
    except UserProfile.DoesNotExist:
        return None, None

    return team_name, team_image_url


class MatchRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = MatchRequestListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        expire_stale_match_requests()
        cancel_match_requests_blocked_by_bookings()
        queryset = (
            MatchRequest.objects.select_related('created_by', 'field')
            .prefetch_related('match_timeslots__timeslot')
            .filter(status__in=[
                MatchRequest.STATUS_WAITING_OPPONENT,
                MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT,
                MatchRequest.STATUS_DEPOSIT_PAID,
            ])
        )

        scope = self.request.query_params.get('scope', 'active')
        if scope == 'mine' and self.request.user.is_authenticated:
            queryset = queryset.filter(created_by=self.request.user)

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = MatchRequestCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        match_request = serializer.save()
        response_serializer = MatchRequestListSerializer(match_request, context={'request': request})
        return Response(
            {
                    'message': 'Tạo yêu cầu giao lưu thành công',
                    'match_request': response_serializer.data,
                },
            status=status.HTTP_201_CREATED,
        )


class MatchRequestDetailView(generics.RetrieveAPIView):
    serializer_class = MatchRequestListSerializer
    permission_classes = [permissions.AllowAny]
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        expire_stale_match_requests()
        cancel_match_requests_blocked_by_bookings()
        return MatchRequest.objects.select_related('created_by', 'field').prefetch_related('match_timeslots__timeslot')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def match_request_accept_view(request, pk):
    expire_stale_match_requests()
    cancel_match_requests_blocked_by_bookings()

    try:
        match_request = MatchRequest.objects.select_related('created_by', 'field').get(pk=pk)
    except MatchRequest.DoesNotExist:
        return Response({'error': 'Không tìm thấy yêu cầu giao lưu'}, status=status.HTTP_404_NOT_FOUND)

    if match_request.created_by_id == request.user.id:
        return Response({'error': 'Bạn không thể tự chấp nhận yêu cầu của chính mình'}, status=status.HTTP_400_BAD_REQUEST)

    if match_request.status != MatchRequest.STATUS_WAITING_OPPONENT:
        return Response({'error': 'Yêu cầu giao lưu này không còn hợp lệ để chấp nhận'}, status=status.HTTP_400_BAD_REQUEST)

    team_name, team_image_url = _team_snapshot_for_user(request.user)
    if not team_name or not team_image_url:
        return Response(
            {'error': 'Bạn cần cập nhật tên đội bóng và ảnh đội bóng trong profile trước khi chấp nhận giao lưu'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if team_image_url:
        team_image_url = request.build_absolute_uri(team_image_url)
    match_request.accepted_team_name = team_name
    match_request.accepted_team_image_url = team_image_url
    match_request.accepted_by = request.user
    match_request.status = MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT
    match_request.reserved_until = timezone.now() + timedelta(minutes=1)
    match_request.save(update_fields=[
        'accepted_team_name',
        'accepted_team_image_url',
        'accepted_by',
        'status',
        'reserved_until',
        'updated_at',
    ])

    serializer = MatchRequestListSerializer(match_request, context={'request': request})
    return Response(
        {
            'message': 'Đã chấp nhận giao lưu và giữ chỗ 1 phút',
            'match_request': serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def match_request_complete_deposit_view(request, pk):
    expire_stale_match_requests()
    cancel_match_requests_blocked_by_bookings()

    try:
        match_request = MatchRequest.objects.select_related('created_by', 'field').prefetch_related('match_timeslots__timeslot').get(pk=pk)
    except MatchRequest.DoesNotExist:
        return Response({'error': 'Không tìm thấy yêu cầu giao lưu'}, status=status.HTTP_404_NOT_FOUND)

    if match_request.created_by_id != request.user.id and not request.user.is_staff:
        return Response({'error': 'Bạn không có quyền thao tác yêu cầu này'}, status=status.HTTP_403_FORBIDDEN)

    if match_request.status != MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT:
        return Response({'error': 'Yêu cầu giao lưu không ở trạng thái chờ thanh toán'}, status=status.HTTP_400_BAD_REQUEST)

    if not match_request.reserved_until or match_request.reserved_until <= timezone.now():
        match_request.status = MatchRequest.STATUS_EXPIRED
        match_request.save(update_fields=['status', 'updated_at'])
        return Response({'error': 'Thời gian giữ chỗ đã hết hạn'}, status=status.HTTP_400_BAD_REQUEST)

    booking_id = request.data.get('booking_id')
    if not booking_id:
        return Response({'error': 'booking_id la bat buoc'}, status=status.HTTP_400_BAD_REQUEST)

    from apps.bookings.models import Booking

    try:
        booking = Booking.objects.select_related('field').get(pk=booking_id)
    except Booking.DoesNotExist:
        return Response({'error': 'Không tìm thấy booking'}, status=status.HTTP_404_NOT_FOUND)

    if booking.user_id != request.user.id:
        return Response({'error': 'Booking không thuộc về tài khoản của bạn'}, status=status.HTTP_403_FORBIDDEN)

    if booking.field_id != match_request.field_id or booking.booking_date != match_request.booking_date:
        return Response({'error': 'Booking không khớp với yêu cầu giao lưu'}, status=status.HTTP_400_BAD_REQUEST)

    match_timeslot_ids = list(match_request.match_timeslots.values_list('timeslot_id', flat=True))
    booking_timeslot_ids = list(booking.booking_timeslots.values_list('timeslot_id', flat=True))
    if sorted(match_timeslot_ids) != sorted(booking_timeslot_ids):
        return Response({'error': 'Booking không khớp khung giờ giao lưu'}, status=status.HTTP_400_BAD_REQUEST)

    if booking.status != 'confirmed':
        return Response({'error': 'Booking chưa ở trạng thái đã xác nhận'}, status=status.HTTP_400_BAD_REQUEST)

    match_request.booking = booking
    match_request.status = MatchRequest.STATUS_DEPOSIT_PAID
    match_request.save(update_fields=['booking', 'status', 'updated_at'])

    serializer = MatchRequestListSerializer(match_request, context={'request': request})
    return Response(
        {
            'message': 'Đã ghi nhận thanh toán cọc cho giao lưu',
            'match_request': serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def match_request_pay_deposit_view(request, pk):
    expire_stale_match_requests()
    cancel_match_requests_blocked_by_bookings()

    try:
        match_request = MatchRequest.objects.select_related('created_by', 'field').prefetch_related('match_timeslots__timeslot').get(pk=pk)
    except MatchRequest.DoesNotExist:
        return Response({'error': 'Không tìm thấy yêu cầu giao lưu'}, status=status.HTTP_404_NOT_FOUND)

    if match_request.created_by_id != request.user.id:
        return Response({'error': 'Bạn không có quyền thanh toán yêu cầu này'}, status=status.HTTP_403_FORBIDDEN)

    if match_request.status != MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT:
        return Response({'error': 'Yêu cầu giao lưu không ở trạng thái chờ thanh toán'}, status=status.HTTP_400_BAD_REQUEST)

    if not match_request.reserved_until or match_request.reserved_until <= timezone.now():
        match_request.status = MatchRequest.STATUS_EXPIRED
        match_request.save(update_fields=['status', 'updated_at'])
        return Response({'error': 'Thời gian giữ chỗ đã hết hạn'}, status=status.HTTP_400_BAD_REQUEST)

    if match_request.booking_id:
        return Response({'error': 'Yêu cầu giao lưu này đã được thanh toán'}, status=status.HTTP_400_BAD_REQUEST)

    customer_name = (request.data.get('customer_name') or '').strip()
    customer_phone = (request.data.get('customer_phone') or '').strip()
    customer_email = (request.data.get('customer_email') or '').strip()
    notes = request.data.get('notes') or ''

    if not customer_name:
        customer_name = request.user.get_full_name().strip() or request.user.username
    if not customer_phone:
        try:
            customer_phone = request.user.profile.phone or ''
        except UserProfile.DoesNotExist:
            customer_phone = ''
    if not customer_email:
        customer_email = request.user.email or ''

    total_amount = match_request.total_amount
    deposit_amount = match_request.deposit_amount
    selected_timeslots = [item.timeslot for item in match_request.match_timeslots.select_related('timeslot').all()]

    with transaction.atomic():
        booking = Booking.objects.create(
            user=request.user,
            field=match_request.field,
            booking_date=match_request.booking_date,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            notes=notes,
            total_amount=total_amount,
            deposit_amount=deposit_amount,
            status='pending_payment',
        )

        BookingTimeSlot.objects.bulk_create(
            [BookingTimeSlot(booking=booking, timeslot=timeslot) for timeslot in selected_timeslots]
        )

        payment = Payment.objects.create(
            booking=booking,
            payment_method='vnpay',
            amount=deposit_amount,
            status='pending',
        )

        confirm_serializer = PaymentConfirmSerializer(instance=payment, data={})
        confirm_serializer.is_valid(raise_exception=True)
        payment = confirm_serializer.save()

        match_request.booking = booking
        match_request.status = MatchRequest.STATUS_DEPOSIT_PAID
        match_request.save(update_fields=['booking', 'status', 'updated_at'])

    from apps.bookings.serializers import BookingDetailSerializer
    from apps.payments.serializers import PaymentSerializer

    return Response(
        {
            'message': 'Đã tạo booking và thanh toán cọc thành công, yêu cầu giao lưu đã được xác nhận',
            'booking': BookingDetailSerializer(booking, context={'request': request}).data,
            'payment': PaymentSerializer(payment, context={'request': request}).data,
            'match_request': MatchRequestListSerializer(match_request, context={'request': request}).data,
        },
        status=status.HTTP_200_OK,
    )
