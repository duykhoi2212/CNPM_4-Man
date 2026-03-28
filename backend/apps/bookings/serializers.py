# apps/bookings/serializers.py
from rest_framework import serializers
from datetime import date, datetime
from django.utils import timezone

from .models import Booking, BookingTimeSlot
from apps.fields.models import TimeSlot
from apps.fields.serializers import TimeSlotSerializer, FieldListSerializer


class BookingTimeSlotSerializer(serializers.ModelSerializer):
    timeslot = TimeSlotSerializer(read_only=True)

    class Meta:
        model = BookingTimeSlot
        fields = ['id', 'timeslot']


class BookingListSerializer(serializers.ModelSerializer):
    field = FieldListSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    latest_end_time = serializers.SerializerMethodField()
    can_review_now = serializers.SerializerMethodField()
    has_review = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'field', 'booking_date',
            'customer_name', 'customer_phone', 'customer_email',
            'total_amount', 'deposit_amount', 'remaining_amount',
            'status', 'status_display', 'latest_end_time',
            'can_review_now', 'has_review', 'created_at'
        ]

    def get_latest_end_time(self, obj):
        booking_timeslots = obj.booking_timeslots.all()
        if not booking_timeslots:
            return None
        latest_end_time = max(item.timeslot.end_time for item in booking_timeslots)
        return latest_end_time.strftime('%H:%M')

    def get_has_review(self, obj):
        return hasattr(obj, 'review') and obj.review is not None

    def get_can_review_now(self, obj):
        if obj.status != 'completed' or self.get_has_review(obj):
            return False

        booking_timeslots = obj.booking_timeslots.all()
        if booking_timeslots:
            latest_end_time = max(item.timeslot.end_time for item in booking_timeslots)
            booking_end_datetime = timezone.make_aware(
                datetime.combine(obj.booking_date, latest_end_time),
                timezone.get_current_timezone()
            )
        else:
            booking_end_datetime = timezone.make_aware(
                datetime.combine(obj.booking_date, datetime.max.time().replace(microsecond=0)),
                timezone.get_current_timezone()
            )

        return timezone.localtime() >= booking_end_datetime


class BookingDetailSerializer(serializers.ModelSerializer):
    field = FieldListSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    booking_timeslots = BookingTimeSlotSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'field', 'booking_date',
            'customer_name', 'customer_phone', 'customer_email', 'notes',
            'total_amount', 'deposit_amount', 'remaining_amount',
            'status', 'status_display', 'booking_timeslots',
            'created_at', 'updated_at'
        ]


class BookingCreateSerializer(serializers.ModelSerializer):
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
        if value < date.today():
            raise serializers.ValidationError('Khong the dat san cho ngay trong qua khu')
        return value

    def validate(self, attrs):
        field = attrs['field']
        booking_date = attrs['booking_date']
        timeslot_ids = attrs['timeslot_ids']

        timeslots = TimeSlot.objects.filter(id__in=timeslot_ids, field=field)
        if timeslots.count() != len(timeslot_ids):
            raise serializers.ValidationError({
                'timeslot_ids': 'Mot hoac nhieu khung gio khong hop le cho san da chon'
            })

        inactive_slots = timeslots.filter(is_active=False)
        if inactive_slots.exists():
            raise serializers.ValidationError({
                'timeslot_ids': 'Khung gio da chon hien khong con hoat dong'
            })

        conflicting_bookings = BookingTimeSlot.objects.filter(
            timeslot__in=timeslots,
            booking__field=field,
            booking__booking_date=booking_date,
            booking__status__in=['pending_payment', 'confirmed']
        ).select_related('timeslot', 'booking')

        if conflicting_bookings.exists():
            raise serializers.ValidationError({
                'timeslot_ids': 'Khung gio nay da duoc dat, vui long chon khung gio khac'
            })

        attrs['_timeslots'] = timeslots
        return attrs

    def create(self, validated_data):
        timeslots = validated_data.pop('_timeslots')
        validated_data.pop('timeslot_ids')

        total_amount = sum(slot.price for slot in timeslots)
        field = validated_data['field']
        deposit_amount = field.calculate_deposit(total_amount)
        user = self.context['request'].user

        booking = Booking.objects.create(
            user=user,
            total_amount=total_amount,
            deposit_amount=deposit_amount,
            status='pending_payment',
            **validated_data
        )

        for timeslot in timeslots:
            BookingTimeSlot.objects.create(booking=booking, timeslot=timeslot)

        return booking


class BookingCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate(self, attrs):
        booking = self.instance

        if booking.status not in ['pending_payment', 'confirmed']:
            raise serializers.ValidationError(
                f"Khong the huy booking o trang thai '{booking.get_status_display()}'"
            )

        if booking.booking_date < date.today():
            raise serializers.ValidationError('Khong the huy booking cho ngay da qua')

        return attrs

    def save(self):
        booking = self.instance
        booking.status = 'cancelled'
        booking.save(update_fields=['status', 'updated_at'])
        return booking


class BookingConfirmSerializer(serializers.Serializer):
    def validate(self, attrs):
        raise serializers.ValidationError(
            'Booking se duoc xac nhan tu dong sau khi thanh toan coc thanh cong'
        )
