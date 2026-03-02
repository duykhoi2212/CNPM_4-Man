from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .serializers import StatsQuerySerializer
from . import services


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_overview_view(request):
    serializer = StatsQuerySerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    result = services.get_admin_overview(
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
        field_id=data.get('field_id'),
    )
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_revenue_view(request):
    serializer = StatsQuerySerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    result = services.get_admin_revenue_series(
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
        field_id=data.get('field_id'),
        group_by=data.get('group_by', 'day'),
    )
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_top_fields_view(request):
    serializer = StatsQuerySerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    result = services.get_admin_top_fields(
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
        limit=data.get('limit', 5),
    )
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_overview_view(request):
    serializer = StatsQuerySerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    result = services.get_my_overview(
        user=request.user,
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
    )
    return Response(result, status=status.HTTP_200_OK)
