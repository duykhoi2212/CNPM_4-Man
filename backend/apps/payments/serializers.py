# apps/payments/serializers.py
from rest_framework import serializers
from django.utils import timezone
import uuid

from .models import Payment
from apps.bookings.models import Booking
from apps.bookings.serializers import BookingListSerializer
from apps.matches.services import cancel_match_requests_blocked_by_bookings


class PaymentSerializer(serializers.ModelSerializer):
    booking = BookingListSerializer(read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    deposit_component = serializers.DecimalField(source='booking.deposit_amount', max_digits=10, decimal_places=2, read_only=True)
    service_component = serializers.DecimalField(source='booking.service_amount', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'payment_method', 'payment_method_display',
            'amount', 'status', 'status_display',
            'transaction_id', 'paid_at', 'created_at',
            'deposit_component', 'service_component',
        ]
        read_only_fields = ['transaction_id', 'paid_at', 'created_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Payment
        fields = ['booking_id', 'payment_method']

    def validate_booking_id(self, value):
        user = self.context['request'].user

        try:
            booking = Booking.objects.get(pk=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError('Không tìm thấy booking')

        if booking.user != user and not user.is_staff:
            raise serializers.ValidationError('Bạn chỉ có thể tạo thanh toán cho booking của mình')

        if booking.status != 'pending_payment':
            raise serializers.ValidationError(
                f"Không thể tạo thanh toán cho booking ở trạng thái '{booking.get_status_display()}'"
            )

        if hasattr(booking, 'payment'):
            raise serializers.ValidationError('Booking này đã có thanh toán tiền cọc')

        return value

    def create(self, validated_data):
        booking_id = validated_data.pop('booking_id')
        booking = Booking.objects.get(pk=booking_id)

        payment = Payment.objects.create(
            booking=booking,
            amount=booking.payable_now_amount,
            status='pending',
            **validated_data
        )

        return payment


class PaymentConfirmSerializer(serializers.Serializer):
    def validate(self, attrs):
        payment = self.instance

        if payment.status != 'pending':
            raise serializers.ValidationError(
                f"Không thể xác nhận thanh toán ở trạng thái '{payment.get_status_display()}'"
            )

        return attrs

    def save(self):
        payment = self.instance

        payment.transaction_id = f"FAKE-{uuid.uuid4().hex[:12].upper()}"
        payment.status = 'completed'
        payment.paid_at = timezone.now()
        payment.save(update_fields=['transaction_id', 'status', 'paid_at'])

        booking = payment.booking
        booking.status = 'confirmed'
        booking.save(update_fields=['status', 'updated_at'])
        cancel_match_requests_blocked_by_bookings()

        return payment
