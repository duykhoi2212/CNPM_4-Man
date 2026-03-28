from datetime import date, timedelta, time
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking, BookingTimeSlot
from apps.fields.models import FieldType, Field, TimeSlot
from .models import Review


class ReviewApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='reviewuser', password='StrongPass123!')
        self.client.force_authenticate(user=self.user)

        field_type = FieldType.objects.create(name='San 11')
        self.field = Field.objects.create(
            field_type=field_type,
            name='Field Review',
            location='Location C',
            price_per_hour=Decimal('300000.00'),
            peak_hour_price=Decimal('400000.00'),
            deposit_percent=Decimal('30.00'),
            is_active=True,
        )

        self.completed_booking = Booking.objects.create(
            user=self.user,
            field=self.field,
            booking_date=date.today() - timedelta(days=1),
            customer_name='Review User',
            customer_phone='0900777888',
            customer_email='review@example.com',
            total_amount=Decimal('400000.00'),
            deposit_amount=Decimal('120000.00'),
            status='completed',
        )
        self.completed_timeslot = TimeSlot.objects.create(
            field=self.field,
            start_time=time(8, 0),
            end_time=time(9, 0),
            price=Decimal('400000.00'),
            is_peak_hour=False,
            is_active=True,
        )
        BookingTimeSlot.objects.create(booking=self.completed_booking, timeslot=self.completed_timeslot)

    def test_create_review_for_completed_booking_success(self):
        payload = {
            'field': self.field.id,
            'booking_id': self.completed_booking.id,
            'rating': 5,
            'comment': 'Great field and very good service.',
        }

        response = self.client.post('/api/reviews/create/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('review', response.data)
        self.assertEqual(Review.objects.count(), 1)

    def test_cannot_review_same_booking_twice(self):
        Review.objects.create(
            user=self.user,
            field=self.field,
            booking=self.completed_booking,
            rating=5,
            comment='First review already exists.',
        )

        payload = {
            'field': self.field.id,
            'booking_id': self.completed_booking.id,
            'rating': 4,
            'comment': 'Trying to review same booking again.',
        }

        response = self.client.post('/api/reviews/create/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('booking_id', response.data)

    def test_cannot_review_before_booking_timeslot_has_ended(self):
        future_booking = Booking.objects.create(
            user=self.user,
            field=self.field,
            booking_date=date.today() + timedelta(days=1),
            customer_name='Future Review User',
            customer_phone='0900666777',
            customer_email='future-review@example.com',
            total_amount=Decimal('400000.00'),
            deposit_amount=Decimal('120000.00'),
            status='completed',
        )
        future_timeslot = TimeSlot.objects.create(
            field=self.field,
            start_time=time(17, 30),
            end_time=time(18, 30),
            price=Decimal('400000.00'),
            is_peak_hour=False,
            is_active=True,
        )
        BookingTimeSlot.objects.create(booking=future_booking, timeslot=future_timeslot)

        payload = {
            'field': self.field.id,
            'booking_id': future_booking.id,
            'rating': 5,
            'comment': 'Trying to review before the booking time has ended.',
        }

        response = self.client.post('/api/reviews/create/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('booking_id', response.data)
