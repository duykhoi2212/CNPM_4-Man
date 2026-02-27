# apps/payments/serializers.py
from rest_framework import serializers
from django.utils import timezone
import uuid

from .models import Payment
from apps.bookings.models import Booking
from apps.bookings.serializers import BookingListSerializer


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer cơ bản cho Payment"""
    booking = BookingListSerializer(read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'payment_method', 'payment_method_display',
            'amount', 'status', 'status_display',
            'transaction_id', 'paid_at', 'created_at'
        ]
        read_only_fields = ['transaction_id', 'paid_at', 'created_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer cho tạo payment mới
    User chọn phương thức thanh toán
    """
    booking_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Payment
        fields = ['booking_id', 'payment_method']
    
    def validate_booking_id(self, value):
        """Validate booking exists và thuộc về user"""
        user = self.context['request'].user
        
        try:
            booking = Booking.objects.get(pk=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found")
        
        # Check ownership (trừ admin)
        if booking.user != user and not user.is_staff:
            raise serializers.ValidationError("You can only create payment for your own booking")
        
        # Check booking status
        if booking.status != 'pending':
            raise serializers.ValidationError(
                f"Cannot create payment for booking with status '{booking.get_status_display()}'"
            )
        
        # Check if payment already exists
        if hasattr(booking, 'payment'):
            raise serializers.ValidationError("Payment already exists for this booking")
        
        return value
    
    def create(self, validated_data):
        """Create payment với amount từ booking"""
        booking_id = validated_data.pop('booking_id')
        booking = Booking.objects.get(pk=booking_id)
        
        # Amount = deposit_amount của booking
        payment = Payment.objects.create(
            booking=booking,
            amount=booking.deposit_amount,
            status='pending',
            **validated_data
        )
        
        return payment


class PaymentConfirmSerializer(serializers.Serializer):
    """
    Serializer cho confirm payment (FAKE PAYMENT)
    Trong thực tế sẽ nhận callback từ payment gateway
    """
    
    def validate(self, attrs):
        """Validate payment có thể confirm"""
        payment = self.instance
        
        if payment.status != 'pending':
            raise serializers.ValidationError(
                f"Cannot confirm payment with status '{payment.get_status_display()}'"
            )
        
        return attrs
    
    def save(self):
        """
        Confirm payment (FAKE):
        1. Update payment: status=completed, transaction_id, paid_at
        2. Update booking: status=confirmed
        """
        payment = self.instance
        
        # Generate fake transaction ID
        payment.transaction_id = f"FAKE-{uuid.uuid4().hex[:12].upper()}"
        payment.status = 'completed'
        payment.paid_at = timezone.now()
        payment.save(update_fields=['transaction_id', 'status', 'paid_at'])
        
        # Update booking status to confirmed
        booking = payment.booking
        booking.status = 'confirmed'
        booking.save(update_fields=['status', 'updated_at'])
        
        return payment