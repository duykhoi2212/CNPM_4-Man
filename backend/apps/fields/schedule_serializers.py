from rest_framework import serializers
from .schedule_models import FieldSchedule, FieldClosure
from .incident_models import IncidentReport, FieldSwap


class FieldScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = FieldSchedule
        fields = [
            'id', 'field', 'day_of_week', 'day_name',
            'is_open', 'open_time', 'close_time', 'slot_duration'
        ]
        read_only_fields = ['id']


class FieldScheduleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldSchedule
        fields = [
            'field', 'day_of_week', 'is_open',
            'open_time', 'close_time', 'slot_duration'
        ]


class FieldClosureSerializer(serializers.ModelSerializer):
    closure_type_display = serializers.CharField(source='get_closure_type_display', read_only=True)
    
    class Meta:
        model = FieldClosure
        fields = [
            'id', 'field', 'start_date', 'end_date',
            'reason', 'closure_type', 'closure_type_display', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class IncidentReportSerializer(serializers.ModelSerializer):
    issue_type_display = serializers.CharField(source='get_issue_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    field_name = serializers.CharField(source='field.name', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.get_full_name', read_only=True)
    
    class Meta:
        model = IncidentReport
        fields = [
            'id', 'field', 'field_name', 'booking', 'reported_by',
            'reported_by_name', 'issue_type', 'issue_type_display',
            'severity', 'severity_display', 'description', 'photos',
            'status', 'status_display', 'admin_notes',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'resolved_at']


class IncidentReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentReport
        fields = [
            'field', 'booking', 'issue_type', 'severity',
            'description', 'photos'
        ]


class FieldSwapSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    original_field_name = serializers.CharField(source='original_field.name', read_only=True)
    new_field_name = serializers.CharField(source='new_field.name', read_only=True)
    
    class Meta:
        model = FieldSwap
        fields = [
            'id', 'incident', 'original_field', 'original_field_name',
            'new_field', 'new_field_name', 'original_booking', 'new_booking',
            'price_difference', 'compensation_amount', 'status', 'status_display',
            'swap_reason', 'customer_notified', 'customer_accepted',
            'admin_notes', 'created_at', 'updated_at', 'confirmed_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FieldSwapCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldSwap
        fields = [
            'incident', 'original_field', 'new_field',
            'original_booking', 'swap_reason'
        ]
