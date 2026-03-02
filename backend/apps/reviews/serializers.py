# apps/reviews/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User

from .models import Review, ReviewImage
from apps.fields.models import Field
from apps.bookings.models import Booking


class ReviewImageSerializer(serializers.ModelSerializer):
    """Serializer cho ảnh review"""
    
    class Meta:
        model = ReviewImage
        fields = ['id', 'image_url', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class ReviewListSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách reviews (public view)
    """
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
    """
    Serializer chi tiết review
    """
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
    """
    Serializer cho tạo review mới
    - Chỉ được review sau khi booking completed
    - 1 booking chỉ được review 1 lần
    """
    booking_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Review
        fields = ['field', 'booking_id', 'rating', 'comment']
    
    def validate_rating(self, value):
        """Validate rating 1-5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate_comment(self, value):
        """Validate comment minimum length"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Comment must be at least 10 characters long")
        return value
    
    def validate(self, attrs):
        """
        Validate:
        1. User đã từng đặt sân này (nếu có booking_id)
        2. Booking phải là completed (nếu có booking_id)
        3. Booking chưa được review (nếu có booking_id)
        """
        user = self.context['request'].user
        field = attrs['field']
        booking_id = attrs.get('booking_id')
        
        if booking_id:
            # Validate booking exists và thuộc user
            try:
                booking = Booking.objects.get(pk=booking_id, user=user)
            except Booking.DoesNotExist:
                raise serializers.ValidationError({
                    'booking_id': 'Booking not found or does not belong to you'
                })
            
            # Validate booking thuộc field này
            if booking.field != field:
                raise serializers.ValidationError({
                    'field': 'Booking does not belong to this field'
                })
            
            # Validate booking status = completed
            if booking.status != 'completed':
                raise serializers.ValidationError({
                    'booking_id': 'Can only review completed bookings'
                })
            
            # Validate booking chưa được review
            if Review.objects.filter(booking=booking).exists():
                raise serializers.ValidationError({
                    'booking_id': 'This booking has already been reviewed'
    })
            
            attrs['_booking'] = booking
        
        return attrs
    
    def create(self, validated_data):
        """Create review"""
        booking = validated_data.pop('_booking', None)
        validated_data.pop('booking_id', None)
        
        review = Review.objects.create(
            user=self.context['request'].user,
            booking=booking,
            **validated_data
        )
        
        return review


class ReviewUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer cho update review
    Chỉ owner có thể update
    """
    
    class Meta:
        model = Review
        fields = ['rating', 'comment']
    
    def validate_rating(self, value):
        """Validate rating 1-5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate_comment(self, value):
        """Validate comment minimum length"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Comment must be at least 10 characters long")
        return value