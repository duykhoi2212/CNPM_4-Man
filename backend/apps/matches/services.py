from django.utils import timezone

from apps.bookings.models import BookingTimeSlot

from .models import MatchRequest, MatchRequestTimeSlot


def expire_stale_match_requests():
    stale_queryset = MatchRequest.objects.filter(
        status=MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT,
        reserved_until__isnull=False,
        reserved_until__lte=timezone.now(),
    )
    stale_queryset.update(status=MatchRequest.STATUS_EXPIRED)


def cancel_match_requests_blocked_by_bookings():
    active_statuses = [
        MatchRequest.STATUS_WAITING_OPPONENT,
        MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT,
    ]

    conflicting_slots = list(
        BookingTimeSlot.objects.filter(
            booking__status__in=['pending_payment', 'confirmed'],
        ).values_list('booking__field_id', 'booking__booking_date', 'timeslot_id')
    )
    if not conflicting_slots:
        return

    blocked_request_ids = set()
    for field_id, booking_date, timeslot_id in conflicting_slots:
        request_ids = MatchRequestTimeSlot.objects.filter(
            match_request__status__in=active_statuses,
            match_request__field_id=field_id,
            match_request__booking_date=booking_date,
            timeslot_id=timeslot_id,
        ).values_list('match_request_id', flat=True)
        blocked_request_ids.update(request_ids)

    if not blocked_request_ids:
        return

    MatchRequest.objects.filter(id__in=blocked_request_ids).update(
        status=MatchRequest.STATUS_CANCELLED,
        reserved_until=None,
    )
