# apps/bookings/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Q
from datetime import date

from .models import Booking, BookingTimeSlot
from apps.fields.models import Field, TimeSlot
from apps.fields.serializers import TimeSlotSerializer, FieldListSerializer


class BookingTimeSlotSerializer(serializers.ModelSerializer):
    """Serializer cho BookingTimeSlot"""
    timeslot = TimeSlotSerializer(read_only=True)
    
    class Meta:
        model = BookingTimeSlot
        fields = ['id', 'timeslot']


class BookingListSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách bookings (list view)
    """
    field = FieldListSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'field', 'booking_date',
            'customer_name', 'customer_phone', 'customer_email',
            'total_amount', 'deposit_amount', 'status', 'status_display',
            'created_at'
        ]


class BookingDetailSerializer(serializers.ModelSerializer):
    """
    Serializer chi tiết booking (detail view)
    Bao gồm timeslots đã đặt
    """
    field = FieldListSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    booking_timeslots = BookingTimeSlotSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'field', 'booking_date',
            'customer_name', 'customer_phone', 'customer_email', 'notes',
            'total_amount', 'deposit_amount', 'status', 'status_display',
            'booking_timeslots', 'created_at', 'updated_at'
        ]


class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Serializer cho tạo booking mới
    Có validation phức tạp: conflict check, calculate amounts
    """
    timeslot_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        min_length=1
    )
    
    class Meta:
        model = Booking
        fields = [
            'field', 'booking_date', 'timeslot_ids',
            'customer_name', 'customer_phone', 'customer_email', 'notes'
        ]
    
    def validate_booking_date(self, value):
        """Validate booking date >= today"""
        if value < date.today():
            raise serializers.ValidationError("Cannot book for past dates")
        return value
    
    def validate(self, attrs):
        """
        Main validation:
        1. Timeslots exist and belong to the field
        2. Timeslots are active
        3. No conflict (timeslots not already booked)
        """
        field = attrs['field']
        booking_date = attrs['booking_date']
        timeslot_ids = attrs['timeslot_ids']
        
        # 1. Check timeslots exist and belong to field
        timeslots = TimeSlot.objects.filter(
            id__in=timeslot_ids,
            field=field
        )
        
        if timeslots.count() != len(timeslot_ids):
            raise serializers.ValidationError({
                'timeslot_ids': 'One or more timeslot IDs are invalid or do not belong to this field'
            })
        
        # 2. Check all timeslots are active
        inactive_slots = timeslots.filter(is_active=False)
        if inactive_slots.exists():
            raise serializers.ValidationError({
                'timeslot_ids': f'Timeslots {list(inactive_slots.values_list("id", flat=True))} are not available'
            })
        
        # 3. CONFLICT CHECK - Kiểm tra timeslots đã bị đặt chưa
        conflicting_bookings = BookingTimeSlot.objects.filter(
            timeslot__in=timeslots,
            booking__field=field,
            booking__booking_date=booking_date,
            booking__status__in=['pending', 'confirmed']
        ).select_related('timeslot', 'booking')
        
        if conflicting_bookings.exists():
            conflict_info = []
            for bt in conflicting_bookings:
                conflict_info.append(
                    f"Timeslot {bt.timeslot.start_time}-{bt.timeslot.end_time} "
                    f"(Booking #{bt.booking.id})"
                )
            
            raise serializers.ValidationError({
                'timeslot_ids': f'The following timeslots are already booked: {", ".join(conflict_info)}'
            })
        
        # Store validated timeslots for create method
        attrs['_timeslots'] = timeslots
        
        return attrs
    
    def create(self, validated_data):
        """
        Create booking with auto-calculated amounts
        """
        timeslots = validated_data.pop('_timeslots')
        validated_data.pop('timeslot_ids')
        
        # Calculate total amount
        total_amount = sum(slot.price for slot in timeslots)
        
        # Calculate deposit amount
        field = validated_data['field']
        deposit_amount = field.calculate_deposit(total_amount)
        
        # Get user from context
        user = self.context['request'].user
        
        # Create booking
        booking = Booking.objects.create(
            user=user,
            total_amount=total_amount,
            deposit_amount=deposit_amount,
            status='pending',
            **validated_data
        )
        
        # Create BookingTimeSlot records
        for timeslot in timeslots:
            BookingTimeSlot.objects.create(
                booking=booking,
                timeslot=timeslot
            )
        
        return booking


class BookingCancelSerializer(serializers.Serializer):
    """
    Serializer cho cancel booking
    """
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate(self, attrs):
        """Validate booking can be cancelled"""
        booking = self.instance
        
        # Check status
        if booking.status not in ['pending', 'confirmed']:
            raise serializers.ValidationError(
                f"Cannot cancel booking with status '{booking.get_status_display()}'"
            )
        
        # Check date (không cancel booking đã qua ngày)
        if booking.booking_date < date.today():
            raise serializers.ValidationError(
                "Cannot cancel booking for past dates"
            )
        
        return attrs
    
    def save(self):
        """Cancel the booking"""
        booking = self.instance
        booking.status = 'cancelled'
        booking.save(update_fields=['status', 'updated_at'])
        return booking


class BookingConfirmSerializer(serializers.Serializer):
    """
    Serializer cho admin confirm booking
    """
    def validate(self, attrs):
        """Validate booking can be confirmed"""
        booking = self.instance
        
        if booking.status != 'pending':
            raise serializers.ValidationError(
                f"Cannot confirm booking with status '{booking.get_status_display()}'"
            )
        
        return attrs
    
    def save(self):
        """Confirm the booking"""
        booking = self.instance
        booking.status = 'confirmed'
        booking.save(update_fields=['status', 'updated_at'])
        return booking