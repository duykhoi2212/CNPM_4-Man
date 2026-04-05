from rest_framework import serializers
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
            'field': {'error_messages': {'required': 'Vui long chon san bong'}},
            'start_time': {'error_messages': {'required': 'Vui long nhap gio bat dau'}},
            'end_time': {'error_messages': {'required': 'Vui long nhap gio ket thuc'}},
            'price': {'error_messages': {'required': 'Vui long nhap gia khung gio'}},
        }

    def validate(self, attrs):
        start_time = attrs.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = attrs.get('end_time', getattr(self.instance, 'end_time', None))
        field = attrs.get('field', getattr(self.instance, 'field', None))

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'Gio ket thuc phai lon hon gio bat dau'
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
                    'start_time': 'Khung gio nay da ton tai cho san da chon'
                })

        return attrs


class FieldListSerializer(serializers.ModelSerializer):
    field_type = FieldTypeSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Field
        fields = [
            'id', 'name', 'field_type', 'location',
            'price_per_hour', 'peak_hour_price', 'deposit_percent',
            'avg_rating', 'total_reviews', 'is_active',
            'primary_image'
        ]

    def get_primary_image(self, obj):
        if obj.primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.primary_image.url)
        return None


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
        return reasons.get(obj.id, 'San phu hop de dat nhanh')

    def get_recommendation_score(self, obj):
        scores = self.context.get('recommendation_scores', {})
        return scores.get(obj.id, 0)


class FieldDetailSerializer(serializers.ModelSerializer):
    field_type = FieldTypeSerializer(read_only=True)
    images = FieldImageSerializer(many=True, read_only=True)
    time_slots = TimeSlotSerializer(many=True, read_only=True)

    class Meta:
        model = Field
        fields = [
            'id', 'name', 'field_type', 'description', 'location',
            'price_per_hour', 'peak_hour_price', 'deposit_percent',
            'avg_rating', 'total_reviews', 'is_active',
            'images', 'time_slots', 'created_at', 'updated_at'
        ]


class FieldCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Field
        fields = [
            'field_type', 'name', 'description', 'location',
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


class TimeSlotAvailabilitySerializer(serializers.Serializer):
    timeslot_id = serializers.IntegerField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_peak_hour = serializers.BooleanField()
    is_available = serializers.BooleanField()
    duration_hours = serializers.FloatField()
