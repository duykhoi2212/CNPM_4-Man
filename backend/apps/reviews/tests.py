from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking
from apps.fields.models import FieldType, Field
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
