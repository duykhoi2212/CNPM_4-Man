from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking
from apps.fields.models import FieldType, Field, TimeSlot


class FieldRecommendationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='fieldrec', password='StrongPass123!')
        san5 = FieldType.objects.create(name='San 5')
        san7 = FieldType.objects.create(name='San 7')

        self.field_a = Field.objects.create(
            field_type=san5,
            name='Fulsan-A',
            location='Da Nang',
            price_per_hour=Decimal('280000.00'),
            peak_hour_price=Decimal('350000.00'),
            avg_rating=Decimal('4.80'),
            total_reviews=12,
            is_active=True,
        )
        self.field_b = Field.objects.create(
            field_type=san7,
            name='Pic-A',
            location='Da Nang',
            price_per_hour=Decimal('450000.00'),
            peak_hour_price=Decimal('550000.00'),
            avg_rating=Decimal('4.10'),
            total_reviews=6,
            is_active=True,
        )

        for hour in range(6, 10):
            TimeSlot.objects.create(
                field=self.field_a,
                start_time=f'{hour:02d}:00',
                end_time=f'{hour + 1:02d}:00',
                price=Decimal('280000.00'),
                is_active=True,
            )

        Booking.objects.create(
            user=self.user,
            field=self.field_a,
            booking_date='2026-04-01',
            customer_name='Field Rec',
            customer_phone='0900111222',
            customer_email='fieldrec@example.com',
            total_amount=Decimal('280000.00'),
            deposit_amount=Decimal('84000.00'),
            status='completed',
        )

    def test_recommended_fields_returns_results(self):
        response = self.client.get('/api/fields/recommendations/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(len(response.data['results']), 1)
        self.assertIn('recommendation_reason', response.data['results'][0])

    def test_recommended_fields_personalizes_for_authenticated_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/fields/recommendations/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first_field = response.data['results'][0]
        self.assertEqual(first_field['id'], self.field_a.id)
