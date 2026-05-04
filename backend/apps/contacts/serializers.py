from rest_framework import serializers

from .models import ContactMessage


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'phone', 'subject', 'message']

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('Vui lòng nhập họ tên')
        return value.strip()

    def validate_subject(self, value):
        if not value.strip():
            raise serializers.ValidationError('Vui lòng nhập chủ đề')
        return value.strip()

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError('Vui lòng nhập nội dung liên hệ')
        return value.strip()


class ContactMessageListSerializer(serializers.ModelSerializer):
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = ContactMessage
        fields = [
            'id', 'name', 'email', 'phone', 'subject', 'message',
            'is_resolved', 'status_label', 'created_at', 'updated_at'
        ]

    def get_status_label(self, obj):
        return 'Đã xử lý' if obj.is_resolved else 'Chưa xử lý'


class ContactMessageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['is_resolved']
