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
        admin_user=request.user,
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
        admin_user=request.user,
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
        field_id=data.get('field_id'),
        limit=data.get('limit', 5),
        admin_user=request.user,
    )
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_field_performance_view(request):
    serializer = StatsQuerySerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    result = services.get_admin_field_performance(
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
        field_id=data.get('field_id'),
        admin_user=request.user,
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
        admin_user=request.user,
    )
    revenue = services.get_admin_revenue_series(
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
        field_id=data.get('field_id'),
        group_by=data.get('group_by', 'day'),
        admin_user=request.user,
    )
    top_fields = services.get_admin_top_fields(
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
        field_id=data.get('field_id'),
        limit=data.get('limit', 5),
        admin_user=request.user,
    )
    field_performance = services.get_admin_field_performance(
        date_from=data.get('date_from'),
        date_to=data.get('date_to'),
        field_id=data.get('field_id'),
        admin_user=request.user,
    )

    response = HttpResponse(content_type='text/csv; charset=utf-8')
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    response['Content-Disposition'] = f'attachment; filename="bao-cao-thong-ke-{timestamp}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Báo cáo thống kê doanh thu'])
    writer.writerow(['Từ ngày', data.get('date_from') or 'Tất cả'])
    writer.writerow(['Đến ngày', data.get('date_to') or 'Tất cả'])
    writer.writerow(['Sân bóng ID', data.get('field_id') or 'Tất cả'])
    writer.writerow(['Nhóm doanh thu theo', data.get('group_by', 'day')])
    writer.writerow([])

    writer.writerow(['Tổng quan'])
    writer.writerow(['Doanh thu tiền sân', overview['booking']['completed_field_revenue']])
    writer.writerow(['Doanh thu dịch vụ kèm', overview['booking']['completed_service_revenue']])
    writer.writerow(['Doanh thu hoàn tất', overview['booking']['total_revenue']])
    writer.writerow(['Tiền cọc đã thu', overview['payment']['completed_deposit']])
    writer.writerow(['Tiền dịch vụ đã thu', overview['payment']['completed_service']])
    writer.writerow(['Tổng đã thu qua checkout', overview['payment']['completed_collected_total']])
    writer.writerow(['Tiền cọc đang chờ thanh toán', overview['payment']['pending_deposit']])
    writer.writerow(['Tiền dịch vụ đang chờ thanh toán', overview['payment']['pending_service']])
    writer.writerow(['Tiền cọc thất bại', overview['payment']['failed_deposit']])
    writer.writerow(['Tổng booking', overview['booking']['total_bookings']])
    writer.writerow(['Booking chờ cọc', overview['booking']['pending_bookings']])
    writer.writerow(['Booking đã xác nhận', overview['booking']['confirmed_bookings']])
    writer.writerow(['Booking đã hoàn thành', overview['booking']['completed_bookings']])
    writer.writerow(['Booking đã hủy', overview['booking']['cancelled_bookings']])
    writer.writerow(['Tỷ lệ hoàn thành', overview['booking']['completion_rate_percent']])
    writer.writerow(['Tổng review từ booking', overview['total_reviews_from_bookings']])
    writer.writerow([])

    writer.writerow(['Doanh thu theo thời gian'])
    writer.writerow(['Kỳ', 'Doanh thu hoàn tất', 'Số booking'])
    for item in revenue['series']:
        writer.writerow([item['period'], item['total_revenue'], item['bookings_count']])
    writer.writerow([])

    writer.writerow(['Top sân'])
    writer.writerow(['Sân', 'Lượt đặt', 'Doanh thu tiền sân', 'Doanh thu dịch vụ', 'Doanh thu hoàn tất', 'Số lượt hủy'])
    for field in top_fields['top_fields']:
        writer.writerow([
            field['field__name'],
            field['bookings_count'],
            field.get('completed_field_revenue', 0),
            field.get('completed_service_revenue', 0),
            field['completed_revenue'],
            field['cancelled_count'],
        ])
    writer.writerow([])

    writer.writerow(['Hiệu suất theo sân'])
    writer.writerow([
        'Sân',
        'Tổng booking',
        'Chờ cọc',
        'Đã xác nhận',
        'Đã hoàn thành',
        'Đã hủy',
        'Doanh thu hoàn tất',
        'Doanh thu tiền sân',
        'Doanh thu dịch vụ',
        'Tiền cọc đã thu',
        'Tỷ lệ hoàn thành',
    ])
    for field in field_performance['fields']:
        writer.writerow([
            field['field__name'],
            field['total_bookings'],
            field['pending_bookings'],
            field['confirmed_bookings'],
            field['completed_bookings'],
            field['cancelled_bookings'],
            field['completed_revenue'],
            field.get('completed_field_revenue', 0),
            field.get('completed_service_revenue', 0),
            field['completed_deposit'],
            field['completion_rate_percent'],
        ])
    writer.writerow([])

    writer.writerow(['Booking gần đây'])
    writer.writerow(['Booking ID', 'Sân', 'Khách hàng', 'Ngày đặt', 'Trạng thái', 'Tiền sân', 'Tiền dịch vụ', 'Tổng tiền', 'Tiền cọc'])
    for booking in overview['recent_bookings']:
        writer.writerow([
            booking['id'],
            booking['field__name'],
            booking['customer_name'],
            booking['booking_date'],
            booking['status'],
            booking.get('field_amount', 0),
            booking.get('service_amount', 0),
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
