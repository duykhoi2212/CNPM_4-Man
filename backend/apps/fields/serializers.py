from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth.models import User
from .models import FieldType, Field, FieldImage, TimeSlot


class FieldTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldType
        fields = ['id', 'name', 'description']


class FieldImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldImage
        fields = ['id', 'image_url', 'is_primary', 'order']


class TimeSlotSerializer(serializers.ModelSerializer):
    duration_hours = serializers.ReadOnlyField()

    class Meta:
        model = TimeSlot
        fields = [
            'id', 'start_time', 'end_time', 'price',
            'is_peak_hour', 'is_active', 'duration_hours'
        ]


class TimeSlotAdminSerializer(serializers.ModelSerializer):
    field_name = serializers.CharField(source='field.name', read_only=True)
    duration_hours = serializers.ReadOnlyField()

    class Meta:
        model = TimeSlot
        fields = [
            'id', 'field', 'field_name', 'start_time', 'end_time', 'price',
            'is_peak_hour', 'is_active', 'duration_hours'
        ]
        validators = []
        extra_kwargs = {
            'field': {'error_messages': {'required': 'Vui lòng chọn sân bóng'}},
            'start_time': {'error_messages': {'required': 'Vui lòng nhập giờ bắt đầu'}},
            'end_time': {'error_messages': {'required': 'Vui lòng nhập giờ kết thúc'}},
            'price': {'error_messages': {'required': 'Vui lòng nhập giá khung giờ'}},
        }

    def validate(self, attrs):
        start_time = attrs.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = attrs.get('end_time', getattr(self.instance, 'end_time', None))
        field = attrs.get('field', getattr(self.instance, 'field', None))

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'Giờ kết thúc phải lớn hơn giờ bắt đầu'
            })

        if field and start_time and end_time:
            queryset = TimeSlot.objects.filter(
                field=field,
                start_time=start_time,
                end_time=end_time,
            )
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)

            if queryset.exists():
                raise serializers.ValidationError({
                    'start_time': 'Khung giờ này đã tồn tại cho sân đã chọn'
                })

        return attrs


class FieldListSerializer(serializers.ModelSerializer):
    field_type = FieldTypeSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    is_open_today = serializers.SerializerMethodField()
    today_open_time = serializers.SerializerMethodField()
    today_close_time = serializers.SerializerMethodField()

    class Meta:
        model = Field
        fields = [
            'id', 'name', 'field_type', 'location',
            'latitude', 'longitude',
            'price_per_hour', 'peak_hour_price', 'deposit_percent',
            'avg_rating', 'total_reviews', 'is_active',
            'primary_image', 'owner_id', 'owner_username',
            'is_open_today', 'today_open_time', 'today_close_time'
        ]

    def get_primary_image(self, obj):
        if obj.primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.primary_image.url)
        return None

    def _get_today_schedule(self, obj):
        local_today = timezone.localdate()
        day_of_week = local_today.weekday()
        closure_exists = obj.closures.filter(
            start_date__lte=local_today,
            end_date__gte=local_today
        ).exists()
        if closure_exists:
            return None
        return obj.schedules.filter(day_of_week=day_of_week).first()

    def get_is_open_today(self, obj):
        schedule = self._get_today_schedule(obj)
        return bool(schedule and schedule.is_open)

    def get_today_open_time(self, obj):
        schedule = self._get_today_schedule(obj)
        return schedule.open_time if schedule and schedule.is_open else None

    def get_today_close_time(self, obj):
        schedule = self._get_today_schedule(obj)
        return schedule.close_time if schedule and schedule.is_open else None


class RecommendedFieldSerializer(FieldListSerializer):
    recommendation_reason = serializers.SerializerMethodField()
    recommendation_score = serializers.SerializerMethodField()

    class Meta(FieldListSerializer.Meta):
        fields = FieldListSerializer.Meta.fields + [
            'recommendation_reason',
            'recommendation_score',
        ]

    def get_recommendation_reason(self, obj):
        reasons = self.context.get('recommendation_reasons', {})
        return reasons.get(obj.id, 'Sân phù hợp để đặt nhanh')

    def get_recommendation_score(self, obj):
        scores = self.context.get('recommendation_scores', {})
        return scores.get(obj.id, 0)


class FieldDetailSerializer(serializers.ModelSerializer):
    field_type = FieldTypeSerializer(read_only=True)
    images = FieldImageSerializer(many=True, read_only=True)
    time_slots = TimeSlotSerializer(many=True, read_only=True)
    schedules = serializers.SerializerMethodField()
    active_closures = serializers.SerializerMethodField()
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Field
        fields = [
            'id', 'name', 'field_type', 'description', 'location', 'latitude', 'longitude',
            'price_per_hour', 'peak_hour_price', 'deposit_percent',
            'avg_rating', 'total_reviews', 'is_active',
            'images', 'time_slots', 'created_at', 'updated_at',
            'owner_id', 'owner_username', 'schedules', 'active_closures'
        ]

    def get_schedules(self, obj):
        return [
            {
                'day_of_week': schedule.day_of_week,
                'day_name': schedule.get_day_of_week_display(),
                'is_open': schedule.is_open,
                'open_time': schedule.open_time,
                'close_time': schedule.close_time,
                'slot_duration': schedule.slot_duration,
            }
            for schedule in obj.schedules.all().order_by('day_of_week')
        ]

    def get_active_closures(self, obj):
        local_today = timezone.localdate()
        closures = obj.closures.filter(end_date__gte=local_today).order_by('start_date')[:5]
        return [
            {
                'id': closure.id,
                'start_date': closure.start_date,
                'end_date': closure.end_date,
                'reason': closure.reason,
                'closure_type': closure.closure_type,
            }
            for closure in closures
        ]


class FieldCreateUpdateSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_staff=True),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Field
        fields = [
            'field_type', 'owner', 'name', 'description', 'location', 'latitude', 'longitude',
            'price_per_hour', 'peak_hour_price', 'deposit_percent',
            'is_active'
        ]

    def validate(self, attrs):
        if attrs.get('peak_hour_price') and attrs.get('price_per_hour'):
            if attrs['peak_hour_price'] < attrs['price_per_hour']:
                raise serializers.ValidationError({
                    'peak_hour_price': 'Peak hour price must be greater than or equal to regular price'
                })
        return attrs

    def validate_owner(self, value):
        if value and not value.is_staff:
            raise serializers.ValidationError('Chu san phai la tai khoan admin')
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_staff and not request.user.is_superuser:
            validated_data['owner'] = request.user
        elif request and request.user.is_superuser and 'owner' not in validated_data:
            validated_data['owner'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and request.user.is_staff and not request.user.is_superuser:
            validated_data.pop('owner', None)
        return super().update(instance, validated_data)


class TimeSlotAvailabilitySerializer(serializers.Serializer):
    timeslot_id = serializers.IntegerField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_peak_hour = serializers.BooleanField()
    is_available = serializers.BooleanField()
    reservation_status = serializers.CharField(required=False)
    duration_hours = serializers.FloatField()
