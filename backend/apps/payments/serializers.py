from rest_framework import serializers
from django.utils import timezone
import uuid

from .models import Payment
from .services import generate_qr_code, generate_momo_qr, generate_virtual_qr_code
from apps.bookings.models import Booking
from apps.bookings.serializers import BookingListSerializer


class PaymentSerializer(serializers.ModelSerializer):
    booking = BookingListSerializer(read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    qr_code = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'payment_method', 'payment_method_display',
            'amount', 'status', 'status_display',
            'transaction_id', 'qr_code', 'expiry_time', 'paid_at', 'created_at'
        ]
        read_only_fields = ['transaction_id', 'paid_at', 'created_at']
    
    def get_qr_code(self, obj):
        return obj.qr_code


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
            raise serializers.ValidationError('Khong tim thay booking')

        if booking.user != user and not user.is_staff:
            raise serializers.ValidationError('Ban chi co the tao thanh toan cho booking cua minh')

        if booking.status != 'pending_payment':
            raise serializers.ValidationError(
                f"Khong the tao thanh toan cho booking o trang thai '{booking.get_status_display()}'"
            )

        if hasattr(booking, 'payment'):
            raise serializers.ValidationError('Booking nay da co thanh toan tien coc')

        return value

    def create(self, validated_data):
        booking_id = validated_data.pop('booking_id')
        booking = Booking.objects.get(pk=booking_id)
        payment_method = validated_data.get('payment_method')

        payment = Payment.objects.create(
            booking=booking,
            amount=booking.deposit_amount,
            status='pending',
            expiry_time=timezone.now() + timezone.timedelta(minutes=30),  # 30 phút để thanh toán
            **validated_data
        )

        # Generate QR code based on payment method
        if payment_method == 'bank_transfer':
            payment.qr_code = generate_virtual_qr_code(payment.id, payment.amount, booking)
        elif payment_method == 'momo':
            payment.qr_code = generate_momo_qr(payment.id, payment.amount, booking)
        else:
            # For other methods, generate basic QR with payment info
            payment.qr_code = generate_qr_code(payment.id, payment.amount, booking=booking)
        
        payment.save(update_fields=['qr_code'])
        return payment


class PaymentConfirmSerializer(serializers.Serializer):
    def validate(self, attrs):
        payment = self.instance

        if payment.status != 'user_confirmed':
            raise serializers.ValidationError(
                f"Chi admin moi co the xac nhan thanh toan. Trang thai hien tai: '{payment.get_status_display()}'"
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

        return payment
