# apps/bookings/serializers.py
from rest_framework import serializers
from datetime import date, datetime
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from decimal import Decimal

from .models import Booking, BookingTimeSlot, ServiceProduct, BookingServiceItem
from apps.fields.models import TimeSlot
from apps.fields.serializers import TimeSlotSerializer, FieldListSerializer


class BookingTimeSlotSerializer(serializers.ModelSerializer):
    timeslot = TimeSlotSerializer(read_only=True)

    class Meta:
        model = BookingTimeSlot
        fields = ['id', 'timeslot']


class BookingServiceItemSerializer(serializers.ModelSerializer):
    service_product_id = serializers.IntegerField(source='service_product_id', read_only=True)

    class Meta:
        model = BookingServiceItem
        fields = [
            'id',
            'service_product_id',
            'service_name_snapshot',
            'unit_label_snapshot',
            'unit_price_snapshot',
            'quantity',
            'line_total',
        ]


class ServiceProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceProduct
        fields = ['id', 'name', 'code', 'unit_label', 'unit_price', 'is_active', 'sort_order']


class BookingListSerializer(serializers.ModelSerializer):
    field = FieldListSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    latest_end_time = serializers.SerializerMethodField()
    can_review_now = serializers.SerializerMethodField()
    has_review = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()
    payment = serializers.SerializerMethodField()
    service_items = BookingServiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'field', 'booking_date',
            'customer_name', 'customer_phone', 'customer_email',
            'field_amount', 'service_amount', 'total_amount', 'deposit_amount', 'remaining_amount',
            'status', 'status_display', 'latest_end_time',
            'can_review_now', 'has_review', 'review', 'payment', 'service_items', 'created_at'
        ]

    def get_payment(self, obj):
        payment = getattr(obj, 'payment', None)
        if not payment:
            return None

        return {
            'id': payment.id,
            'payment_method': payment.payment_method,
            'payment_method_display': payment.get_payment_method_display(),
            'status': payment.status,
            'status_display': payment.get_status_display(),
            'transaction_id': payment.transaction_id,
            'paid_at': payment.paid_at,
            'amount': payment.amount,
            'deposit_component': obj.deposit_amount,
            'service_component': obj.service_amount,
        }

    def get_latest_end_time(self, obj):
        booking_timeslots = obj.booking_timeslots.all()
        if not booking_timeslots:
            return None
        latest_end_time = max(item.timeslot.end_time for item in booking_timeslots)
        return latest_end_time.strftime('%H:%M')

    def get_has_review(self, obj):
        return hasattr(obj, 'review') and obj.review is not None

    def get_review(self, obj):
        if not self.get_has_review(obj):
            return None

        return {
            'id': obj.review.id,
            'rating': obj.review.rating,
            'comment': obj.review.comment,
            'created_at': obj.review.created_at,
            'updated_at': obj.review.updated_at,
        }

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
    payment = serializers.SerializerMethodField()
    service_items = BookingServiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'field', 'booking_date',
            'customer_name', 'customer_phone', 'customer_email', 'notes',
            'field_amount', 'service_amount', 'total_amount', 'deposit_amount', 'remaining_amount',
            'status', 'status_display', 'booking_timeslots', 'service_items', 'payment',
            'created_at', 'updated_at'
        ]

    def get_payment(self, obj):
        payment = getattr(obj, 'payment', None)
        if not payment:
            return None

        return {
            'id': payment.id,
            'payment_method': payment.payment_method,
            'payment_method_display': payment.get_payment_method_display(),
            'status': payment.status,
            'status_display': payment.get_status_display(),
            'transaction_id': payment.transaction_id,
            'paid_at': payment.paid_at,
            'amount': payment.amount,
            'deposit_component': obj.deposit_amount,
            'service_component': obj.service_amount,
        }


class BookingServiceItemInputSerializer(serializers.Serializer):
    service_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class BookingCreateSerializer(serializers.ModelSerializer):
    timeslot_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        min_length=1
    )
    service_items = BookingServiceItemInputSerializer(many=True, required=False, default=list)

    class Meta:
        model = Booking
        fields = [
            'field', 'booking_date', 'timeslot_ids',
            'customer_name', 'customer_phone', 'customer_email', 'notes',
            'service_items',
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

        from apps.matches.models import MatchRequestTimeSlot

        reserved_timeslots = MatchRequestTimeSlot.objects.filter(
            timeslot_id__in=timeslot_ids,
            match_request__field=field,
            match_request__booking_date=booking_date,
            match_request__status__in=['accepted_waiting_deposit', 'deposit_paid'],
        )
        reserved_timeslots = reserved_timeslots.filter(
            Q(match_request__status='deposit_paid') | Q(match_request__reserved_until__gt=timezone.now())
        )
        if reserved_timeslots.exists():
            raise serializers.ValidationError({
                'timeslot_ids': 'Khung gio nay dang duoc giu cho giao luu, vui long chon khung gio khac'
            })

        service_items = attrs.get('service_items') or []
        if service_items:
            service_ids = [item['service_id'] for item in service_items]
            if len(service_ids) != len(set(service_ids)):
                raise serializers.ValidationError({'service_items': 'Khong duoc chon trung mot dich vu nhieu lan'})

            products = ServiceProduct.objects.filter(id__in=service_ids, is_active=True)
            if products.count() != len(service_ids):
                raise serializers.ValidationError({'service_items': 'Mot hoac nhieu dich vu khong hop le hoac da ngung ban'})

            attrs['_service_products'] = {product.id: product for product in products}
        else:
            attrs['_service_products'] = {}

        attrs['_timeslots'] = timeslots
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        timeslots = validated_data.pop('_timeslots')
        validated_data.pop('timeslot_ids')
        service_items = validated_data.pop('service_items', [])
        service_products = validated_data.pop('_service_products', {})

        field_amount = sum(slot.price for slot in timeslots)
        service_amount = Decimal('0.00')
        field = validated_data['field']
        deposit_amount = field.calculate_deposit(field_amount)
        user = self.context['request'].user

        booking_service_rows = []
        for item in service_items:
            service_product = service_products[item['service_id']]
            quantity = item['quantity']
            line_total = (service_product.unit_price or Decimal('0.00')) * quantity
            service_amount += line_total
            booking_service_rows.append(
                BookingServiceItem(
                    service_product=service_product,
                    service_name_snapshot=service_product.name,
                    unit_label_snapshot=service_product.unit_label,
                    unit_price_snapshot=service_product.unit_price,
                    quantity=quantity,
                    line_total=line_total,
                )
            )

        total_amount = field_amount + service_amount

        booking = Booking.objects.create(
            user=user,
            field_amount=field_amount,
            service_amount=service_amount,
            total_amount=total_amount,
            deposit_amount=deposit_amount,
            status='pending_payment',
            **validated_data
        )

        for timeslot in timeslots:
            BookingTimeSlot.objects.create(booking=booking, timeslot=timeslot)

        if booking_service_rows:
            for row in booking_service_rows:
                row.booking = booking
            BookingServiceItem.objects.bulk_create(booking_service_rows)

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
