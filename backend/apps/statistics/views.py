import csv
from datetime import datetime

from django.http import HttpResponse
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
@permission_classes([permissions.IsAdminUser])
def admin_export_report_view(request):
    serializer = StatsQuerySerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    overview = services.get_admin_overview(
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
        field_id=data.get('field_id'),
    )
    revenue = services.get_admin_revenue_series(
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
        field_id=data.get('field_id'),
        group_by=data.get('group_by', 'day'),
    )
    top_fields = services.get_admin_top_fields(
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
        limit=data.get('limit', 5),
    )

    response = HttpResponse(content_type='text/csv; charset=utf-8')
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    response['Content-Disposition'] = f'attachment; filename="bao-cao-thong-ke-{timestamp}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Bao cao thong ke doanh thu'])
    writer.writerow(['Tu ngay', data.get('date_from') or 'Tat ca'])
    writer.writerow(['Den ngay', data.get('date_to') or 'Tat ca'])
    writer.writerow(['San bong ID', data.get('field_id') or 'Tat ca'])
    writer.writerow(['Nhom doanh thu theo', data.get('group_by', 'day')])
    writer.writerow([])

    writer.writerow(['Tong quan'])
    writer.writerow(['Doanh thu hoan tat', overview['booking']['total_revenue']])
    writer.writerow(['Tien coc da thu', overview['payment']['completed_deposit']])
    writer.writerow(['Tien coc dang cho thanh toan', overview['payment']['pending_deposit']])
    writer.writerow(['Tien coc that bai', overview['payment']['failed_deposit']])
    writer.writerow(['Tong booking', overview['booking']['total_bookings']])
    writer.writerow(['Booking cho coc', overview['booking']['pending_bookings']])
    writer.writerow(['Booking da xac nhan', overview['booking']['confirmed_bookings']])
    writer.writerow(['Booking da hoan thanh', overview['booking']['completed_bookings']])
    writer.writerow(['Booking da huy', overview['booking']['cancelled_bookings']])
    writer.writerow(['Ty le hoan thanh', overview['booking']['completion_rate_percent']])
    writer.writerow(['Tong review tu booking', overview['total_reviews_from_bookings']])
    writer.writerow([])

    writer.writerow(['Doanh thu theo thoi gian'])
    writer.writerow(['Ky', 'Doanh thu hoan tat', 'So booking'])
    for item in revenue['series']:
        writer.writerow([item['period'], item['total_revenue'], item['bookings_count']])
    writer.writerow([])

    writer.writerow(['Top san'])
    writer.writerow(['San', 'Luot dat', 'Doanh thu hoan tat', 'So luot huy'])
    for field in top_fields['top_fields']:
        writer.writerow([
            field['field__name'],
            field['bookings_count'],
            field['completed_revenue'],
            field['cancelled_count'],
        ])
    writer.writerow([])

    writer.writerow(['Booking gan day'])
    writer.writerow(['Booking ID', 'San', 'Khach hang', 'Ngay dat', 'Trang thai', 'Tong tien', 'Tien coc'])
    for booking in overview['recent_bookings']:
        writer.writerow([
            booking['id'],
            booking['field__name'],
            booking['customer_name'],
            booking['booking_date'],
            booking['status'],
            booking['total_amount'],
            booking['deposit_amount'],
        ])

    return response


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
