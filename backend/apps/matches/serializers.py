from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import UserProfile
from apps.fields.models import Field, TimeSlot
from apps.fields.serializers import FieldListSerializer, TimeSlotSerializer

from .models import MatchRequest, MatchRequestTimeSlot


class MatchRequestTimeSlotSerializer(serializers.ModelSerializer):
    timeslot = TimeSlotSerializer(read_only=True)

    class Meta:
        model = MatchRequestTimeSlot
        fields = ['id', 'timeslot']


class MatchRequestListSerializer(serializers.ModelSerializer):
    field = FieldListSerializer(read_only=True)
    timeslots = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    creator_username = serializers.CharField(source='created_by.username', read_only=True)
    can_accept = serializers.SerializerMethodField()
    can_pay_deposit = serializers.SerializerMethodField()
    reservation_status = serializers.SerializerMethodField()

    class Meta:
        model = MatchRequest
        fields = [
            'id',
            'field',
            'booking_date',
            'created_team_name',
            'created_team_image_url',
            'accepted_team_name',
            'accepted_team_image_url',
            'notes',
            'status',
            'status_display',
            'reserved_until',
            'reservation_status',
            'reserved_seconds_left',
            'total_amount',
            'deposit_amount',
            'remaining_amount',
            'creator_username',
            'timeslots',
            'can_accept',
            'can_pay_deposit',
            'created_at',
            'updated_at',
        ]

    def get_timeslots(self, obj):
        return [
            {
                'id': item.timeslot.id,
                'start_time': item.timeslot.start_time,
                'end_time': item.timeslot.end_time,
                'price': item.timeslot.price,
                'is_peak_hour': item.timeslot.is_peak_hour,
            }
            for item in obj.match_timeslots.select_related('timeslot').all()
        ]

    def get_can_accept(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if obj.created_by_id == request.user.id:
            return False
        return obj.status == MatchRequest.STATUS_WAITING_OPPONENT

    def get_can_pay_deposit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return (
            obj.created_by_id == request.user.id
            and obj.status == MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT
            and obj.reserved_until
            and obj.reserved_until > timezone.now()
        )

    def get_reservation_status(self, obj):
        if obj.status == MatchRequest.STATUS_WAITING_OPPONENT:
            return 'cho_doi'
        if obj.status == MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT:
            if obj.reserved_until and obj.reserved_until > timezone.now():
                return 'dang_giu_cho'
            return 'het_han'
        if obj.status == MatchRequest.STATUS_DEPOSIT_PAID:
            return 'da_dat'
        if obj.status == MatchRequest.STATUS_EXPIRED:
            return 'het_han'
        return 'da_huy'


class MatchRequestCreateSerializer(serializers.Serializer):
    field = serializers.PrimaryKeyRelatedField(queryset=Field.objects.select_related('field_type').all())
    booking_date = serializers.DateField()
    timeslot_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        field = attrs['field']
        booking_date = attrs['booking_date']
        timeslot_ids = attrs['timeslot_ids']

        if booking_date < timezone.localdate():
            raise serializers.ValidationError({'booking_date': 'Ngay dat san khong duoc nam trong qua khu'})

        selected_timeslots = list(
            TimeSlot.objects.filter(
                id__in=timeslot_ids,
                field=field,
                is_active=True,
            ).order_by('start_time')
        )

        if len(selected_timeslots) != len(set(timeslot_ids)):
            raise serializers.ValidationError({'timeslot_ids': 'Khung gio khong hop le'})

        booked_timeslot_ids = set(
            MatchRequestTimeSlot.objects.filter(
                timeslot_id__in=timeslot_ids,
                match_request__field=field,
                match_request__booking_date=booking_date,
                match_request__status__in=[
                    MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT,
                    MatchRequest.STATUS_DEPOSIT_PAID,
                ],
            ).values_list('timeslot_id', flat=True)
        )
        if booked_timeslot_ids:
            raise serializers.ValidationError({'timeslot_ids': 'Mot so khung gio da duoc giu hoac dat'})

        from apps.bookings.models import BookingTimeSlot

        booking_conflicts = BookingTimeSlot.objects.filter(
            timeslot_id__in=timeslot_ids,
            booking__field=field,
            booking__booking_date=booking_date,
            booking__status__in=['pending_payment', 'confirmed'],
        ).values_list('timeslot_id', flat=True)

        if booking_conflicts.exists():
            raise serializers.ValidationError({'timeslot_ids': 'Mot so khung gio da duoc dat'})

        return attrs

    def create(self, validated_data):
        request = self.context['request']
        field = validated_data['field']
        timeslot_ids = validated_data.pop('timeslot_ids')
        notes = validated_data.get('notes') or ''

        try:
            profile = request.user.profile
            team_name = (profile.team_name or '').strip()
            if not team_name or not profile.team_image:
                raise serializers.ValidationError({
                    'team': 'Ban can cap nhat ten doi bong va anh doi bong trong profile truoc khi tao yeu cau giao luu.'
                })
            team_image_url = request.build_absolute_uri(profile.team_image.url)
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError({
                'team': 'Ban can tao profile va cap nhat ten doi bong, anh doi bong truoc khi tao yeu cau giao luu.'
            })

        selected_timeslots = list(
            TimeSlot.objects.filter(
                id__in=timeslot_ids,
                field=field,
                is_active=True,
            ).order_by('start_time')
        )
        total_amount = sum((slot.price for slot in selected_timeslots), start=0)
        deposit_amount = (total_amount * field.deposit_percent) / 100

        match_request = MatchRequest.objects.create(
            created_by=request.user,
            field=field,
            booking_date=validated_data['booking_date'],
            created_team_name=team_name,
            created_team_image_url=team_image_url,
            notes=notes,
            total_amount=total_amount,
            deposit_amount=deposit_amount,
            status=MatchRequest.STATUS_WAITING_OPPONENT,
        )

        MatchRequestTimeSlot.objects.bulk_create(
            [
                MatchRequestTimeSlot(match_request=match_request, timeslot=slot)
                for slot in selected_timeslots
            ]
        )

        return match_request
