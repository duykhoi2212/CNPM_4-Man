from rest_framework import serializers


class StatsQuerySerializer(serializers.Serializer):
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    field_id = serializers.IntegerField(required=False, min_value=1)
    group_by = serializers.ChoiceField(choices=['day', 'month', 'year'], required=False, default='day')
    limit = serializers.IntegerField(required=False, min_value=1, max_value=20, default=5)

    def validate(self, attrs):
        date_from = attrs.get('date_from')
        date_to = attrs.get('date_to')
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError({'date_from': 'date_from must be <= date_to'})
        return attrs
