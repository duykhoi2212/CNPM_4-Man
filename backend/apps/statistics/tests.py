from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking
from apps.fields.models import FieldType, Field
from apps.payments.models import Payment


class StatisticsApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='adminstats', password='StrongPass123!', is_staff=True)
        self.user = User.objects.create_user(username='userstats', password='StrongPass123!')

        field_type = FieldType.objects.create(name='San Stats')
        self.field = Field.objects.create(
            field_type=field_type,
            name='Field Stats',
            location='Location Stats',
            price_per_hour=Decimal('300000.00'),
            peak_hour_price=Decimal('400000.00'),
            deposit_percent=Decimal('30.00'),
            is_active=True,
        )

        self.completed_booking = Booking.objects.create(
            user=self.user,
            field=self.field,
            booking_date=date.today() - timedelta(days=1),
            customer_name='User Stats',
            customer_phone='0900999000',
            customer_email='stats@example.com',
            total_amount=Decimal('400000.00'),
            deposit_amount=Decimal('120000.00'),
            status='completed',
        )
        Payment.objects.create(
            booking=self.completed_booking,
            payment_method='vnpay',
            amount=Decimal('120000.00'),
            status='completed',
        )

    def test_admin_overview_requires_admin(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/statistics/admin/overview/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_overview_success(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/statistics/admin/overview/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('booking', response.data)
        self.assertIn('payment', response.data)
        self.assertEqual(response.data['booking']['completed_bookings'], 1)

    def test_my_overview_success(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/statistics/me/overview/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('booking', response.data)
        self.assertIn('payment', response.data)
        self.assertEqual(response.data['booking']['total_bookings'], 1)
