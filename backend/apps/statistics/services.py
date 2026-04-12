from django.db.models import Avg, Count, DecimalField, Sum, Value, Q
from datetime import date
from django.db.models.functions import Coalesce
from apps.bookings.models import Booking
from apps.payments.models import Payment
from apps.reviews.models import Review


DECIMAL_ZERO = Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))


def get_bookings_queryset(date_from=None, date_to=None, field_id=None, user=None):
    queryset = Booking.objects.all()

    if user is not None:
        queryset = queryset.filter(user=user)
    if date_from:
        queryset = queryset.filter(booking_date__gte=date_from)
    if date_to:
        queryset = queryset.filter(booking_date__lte=date_to)
    if field_id:
        queryset = queryset.filter(field_id=field_id)

    return queryset


def scope_bookings_queryset_for_admin(queryset, admin_user):
    if admin_user is None or not admin_user.is_staff:
        return queryset.none()

    if admin_user.is_superuser:
        return queryset

    return queryset.filter(field__owner=admin_user)


def get_admin_overview(date_from=None, date_to=None, field_id=None, admin_user=None):
    bookings = get_bookings_queryset(date_from=date_from, date_to=date_to, field_id=field_id)
    bookings = scope_bookings_queryset_for_admin(bookings, admin_user)
    booking_ids = bookings.values('id')

    booking_summary = bookings.aggregate(
        total_bookings=Count('id'),
        pending_bookings=Count('id', filter=Q(status='pending_payment')),
        confirmed_bookings=Count('id', filter=Q(status='confirmed')),
        completed_bookings=Count('id', filter=Q(status='completed')),
        cancelled_bookings=Count('id', filter=Q(status='cancelled')),
        total_revenue=Coalesce(Sum('total_amount', filter=Q(status='completed')), DECIMAL_ZERO),
        average_booking_value=Coalesce(Avg('total_amount'), DECIMAL_ZERO),
    )

    payments = Payment.objects.filter(booking_id__in=booking_ids)
    payment_summary = payments.aggregate(
        completed_deposit=Coalesce(Sum('amount', filter=Q(status='completed')), DECIMAL_ZERO),
        pending_deposit=Coalesce(Sum('amount', filter=Q(status='pending')), DECIMAL_ZERO),
        failed_deposit=Coalesce(Sum('amount', filter=Q(status='failed')), DECIMAL_ZERO),
    )

    total_bookings = booking_summary['total_bookings'] or 0
    completed_bookings = booking_summary['completed_bookings'] or 0
    completion_rate_percent = round((completed_bookings / total_bookings) * 100, 2) if total_bookings else 0
    recent_bookings = list(
        bookings.select_related('field')
        .order_by('-created_at')
        .values(
            'id',
            'field_id',
            'field__name',
            'booking_date',
            'customer_name',
            'status',
            'total_amount',
            'deposit_amount',
        )[:5]
    )

    return {
        'period': {
            'date_from': date_from,
            'date_to': date_to,
            'field_id': field_id,
        },
        'booking': {
            **booking_summary,
            'completion_rate_percent': completion_rate_percent,
        },
        'payment': payment_summary,
        'total_reviews_from_bookings': Review.objects.filter(booking_id__in=booking_ids).count(),
        'recent_bookings': recent_bookings,
    }


def get_admin_revenue_series(date_from=None, date_to=None, field_id=None, group_by='day', admin_user=None):
    bookings = get_bookings_queryset(date_from=date_from, date_to=date_to, field_id=field_id)
    bookings = scope_bookings_queryset_for_admin(bookings, admin_user)
    completed = bookings.filter(status='completed')
    aggregated = {}

    for booking in completed.values('booking_date', 'total_amount'):
        booking_date = booking['booking_date']
        if not booking_date:
            continue

        if group_by == 'month':
            period_key = booking_date.replace(day=1)
        else:
            period_key = booking_date

        if period_key not in aggregated:
            aggregated[period_key] = {
                'period': period_key,
                'total_revenue': 0,
                'bookings_count': 0,
            }

        aggregated[period_key]['total_revenue'] += booking['total_amount'] or 0
        aggregated[period_key]['bookings_count'] += 1

    series = [
        {
            'period': period,
            'total_revenue': data['total_revenue'],
            'bookings_count': data['bookings_count'],
        }
        for period, data in sorted(aggregated.items(), key=lambda item: item[0])
    ]

    return {
        'period': {
            'date_from': date_from,
            'date_to': date_to,
            'field_id': field_id,
            'group_by': group_by,
        },
        'series': series,
    }


def get_admin_top_fields(date_from=None, date_to=None, field_id=None, limit=5, admin_user=None):
    bookings = get_bookings_queryset(date_from=date_from, date_to=date_to, field_id=field_id)
    bookings = scope_bookings_queryset_for_admin(bookings, admin_user)

    top_fields = list(
        bookings.values('field_id', 'field__name')
        .annotate(
            bookings_count=Count('id'),
            completed_revenue=Coalesce(Sum('total_amount', filter=Q(status='completed')), DECIMAL_ZERO),
            cancelled_count=Count('id', filter=Q(status='cancelled')),
        )
        .order_by('-bookings_count', '-completed_revenue')[:limit]
    )

    return {
        'period': {
            'date_from': date_from,
            'date_to': date_to,
            'field_id': field_id,
            'limit': limit,
        },
        'top_fields': top_fields,
    }


def get_my_overview(user, date_from=None, date_to=None):
    bookings = get_bookings_queryset(user=user, date_from=date_from, date_to=date_to)
    booking_ids = bookings.values('id')

    booking_summary = bookings.aggregate(
        total_bookings=Count('id'),
        pending_bookings=Count('id', filter=Q(status='pending_payment')),
        confirmed_bookings=Count('id', filter=Q(status='confirmed')),
        completed_bookings=Count('id', filter=Q(status='completed')),
        cancelled_bookings=Count('id', filter=Q(status='cancelled')),
        total_spent=Coalesce(Sum('total_amount', filter=Q(status='completed')), DECIMAL_ZERO),
        average_booking_value=Coalesce(Avg('total_amount'), DECIMAL_ZERO),
    )

    payment_summary = Payment.objects.filter(booking_id__in=booking_ids).aggregate(
        total_deposit_paid=Coalesce(Sum('amount', filter=Q(status='completed')), DECIMAL_ZERO),
        total_deposit_pending=Coalesce(Sum('amount', filter=Q(status='pending')), DECIMAL_ZERO),
    )

    recent_bookings = list(
        bookings.select_related('field')
        .order_by('-created_at')
        .values(
            'id',
            'field_id',
            'field__name',
            'booking_date',
            'status',
            'total_amount',
            'deposit_amount',
        )[:5]
    )

    return {
        'period': {
            'date_from': date_from,
            'date_to': date_to,
        },
        'booking': booking_summary,
        'payment': payment_summary,
        'upcoming_bookings': bookings.filter(
            booking_date__gte=date.today(),
            status__in=['pending_payment', 'confirmed']
        ).count(),
        'recent_bookings': recent_bookings,
    }
