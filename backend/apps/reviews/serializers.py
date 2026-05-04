from datetime import datetime

from django.utils import timezone
from rest_framework import serializers

from .models import Review, ReviewImage
from apps.bookings.models import Booking


class ReviewImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ReviewImage
        fields = ['id', 'image_url', 'uploaded_at']
        read_only_fields = ['uploaded_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image_url.url)
        return obj.image_url.url


class ReviewListSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    field_name = serializers.CharField(source='field.name', read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'field_name', 'rating', 'comment',
            'images', 'created_at', 'updated_at'
        ]


class ReviewDetailSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    field_name = serializers.CharField(source='field.name', read_only=True)
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'field_name', 'booking_id',
            'rating', 'comment', 'images',
            'created_at', 'updated_at'
        ]


class ReviewCreateSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Review
        fields = ['field', 'booking_id', 'rating', 'comment']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Đánh giá phải từ 1 đến 5 sao')
        return value

    def validate_comment(self, value):
        if not value.strip():
            raise serializers.ValidationError('Vui lòng nhập nội dung đánh giá')
        return value.strip()

    def validate(self, attrs):
        user = self.context['request'].user
        field = attrs['field']
        booking_id = attrs.get('booking_id')

        if booking_id:
            try:
                booking = Booking.objects.get(pk=booking_id, user=user)
            except Booking.DoesNotExist:
                raise serializers.ValidationError({
                    'booking_id': 'Không tìm thấy booking hoặc booking không thuộc về bạn'
                })

            if booking.field != field:
                raise serializers.ValidationError({
                    'field': 'Booking này không thuộc sân bóng đã chọn'
                })

            if booking.status != 'completed':
                raise serializers.ValidationError({
                    'booking_id': 'Chỉ có thể đánh giá booking đã hoàn thành'
                })

            booking_timeslots = booking.booking_timeslots.select_related('timeslot').all()
            if booking_timeslots.exists():
                latest_end_time = max(item.timeslot.end_time for item in booking_timeslots)
                booking_end_datetime = timezone.make_aware(
                    datetime.combine(booking.booking_date, latest_end_time),
                    timezone.get_current_timezone()
                )
            else:
                booking_end_datetime = timezone.make_aware(
                    datetime.combine(booking.booking_date, datetime.max.time().replace(microsecond=0)),
                    timezone.get_current_timezone()
                )

            if timezone.localtime() < booking_end_datetime:
                raise serializers.ValidationError({
                    'booking_id': 'Bạn chỉ có thể đánh giá sau khi kết thúc khung giờ đã đặt'
                })

            if Review.objects.filter(booking=booking).exists():
                raise serializers.ValidationError({
                    'booking_id': 'Booking này đã được đánh giá rồi'
                })

            attrs['_booking'] = booking

        return attrs

    def create(self, validated_data):
        booking = validated_data.pop('_booking', None)
        validated_data.pop('booking_id', None)

        review = Review.objects.create(
            user=self.context['request'].user,
            booking=booking,
            **validated_data
        )

        return review


class ReviewUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['rating', 'comment']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Đánh giá phải từ 1 đến 5 sao')
        return value

    def validate_comment(self, value):
        if not value.strip():
            raise serializers.ValidationError('Vui lòng nhập nội dung đánh giá')
        return value.strip()
