# apps/fields/serializers.py
from rest_framework import serializers
from .models import FieldType, Field, FieldImage, TimeSlot


class FieldTypeSerializer(serializers.ModelSerializer):
    """Serializer cho loại sân"""
    
    class Meta:
        model = FieldType
        fields = ['id', 'name', 'description']


class FieldImageSerializer(serializers.ModelSerializer):
    """Serializer cho ảnh sân"""
    
    class Meta:
        model = FieldImage
        fields = ['id', 'image_url', 'is_primary', 'order']


class TimeSlotSerializer(serializers.ModelSerializer):
    """Serializer cho khung giờ"""
    duration_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = TimeSlot
        fields = [
            'id', 'start_time', 'end_time', 'price',
            'is_peak_hour', 'is_active', 'duration_hours'
        ]


class FieldListSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách sân (list view)
    Không include images/timeslots để response nhẹ hơn
    """
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
        """Lấy URL ảnh chính"""
        if obj.primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.primary_image.url)
        return None


class FieldDetailSerializer(serializers.ModelSerializer):
    """
    Serializer chi tiết sân (detail view)
    Include full images và timeslots
    """
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
    """
    Serializer cho tạo/cập nhật sân (Admin only)
    """
    
    class Meta:
        model = Field
        fields = [
            'field_type', 'name', 'description', 'location',
            'price_per_hour', 'peak_hour_price', 'deposit_percent',
            'is_active'
        ]
    
    def validate(self, attrs):
        """Validate giá cao điểm >= giá thường"""
        if attrs.get('peak_hour_price') and attrs.get('price_per_hour'):
            if attrs['peak_hour_price'] < attrs['price_per_hour']:
                raise serializers.ValidationError({
                    'peak_hour_price': 'Peak hour price must be greater than or equal to regular price'
                })
        return attrs


class TimeSlotAvailabilitySerializer(serializers.Serializer):
    """
    Serializer cho check availability của timeslot
    """
    timeslot_id = serializers.IntegerField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_peak_hour = serializers.BooleanField()
    is_available = serializers.BooleanField()
    duration_hours = serializers.FloatField()