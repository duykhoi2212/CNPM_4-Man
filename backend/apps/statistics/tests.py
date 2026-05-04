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
        self.admin = User.objects.create_user(
            username='adminstats',
            password='StrongPass123!',
            is_staff=True,
            is_superuser=True,
        )
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

    def test_admin_export_report_success(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/statistics/admin/export/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('text/csv', response['Content-Type'])
        self.assertIn('attachment;', response['Content-Disposition'])
        content = response.content.decode('utf-8')
        self.assertIn('Bao cao thong ke doanh thu', content)
        self.assertIn('Doanh thu theo thoi gian', content)
        self.assertIn('Top san', content)

    def test_my_overview_success(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/statistics/me/overview/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('booking', response.data)
        self.assertIn('payment', response.data)
        self.assertEqual(response.data['booking']['total_bookings'], 1)

    def test_admin_revenue_supports_year_grouping(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get('/api/statistics/admin/revenue/', {'group_by': 'year'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['series']), 1)
        self.assertEqual(str(response.data['series'][0]['period'])[:4], str(date.today().year))

    def test_admin_field_performance_returns_expected_metrics(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get('/api/statistics/admin/field-performance/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['fields']), 1)
        row = response.data['fields'][0]
        self.assertEqual(row['field_id'], self.field.id)
        self.assertEqual(row['completed_bookings'], 1)
        self.assertEqual(Decimal(str(row['completed_revenue'])), Decimal('400000.00'))
        self.assertEqual(Decimal(str(row['completed_deposit'])), Decimal('120000.00'))


class StatisticsOwnerScopeTests(APITestCase):
    def setUp(self):
        self.owner_admin = User.objects.create_user(username='ownerstats', password='StrongPass123!', is_staff=True)
        self.other_admin = User.objects.create_user(username='otherstats', password='StrongPass123!', is_staff=True)
        self.user = User.objects.create_user(username='customerstats', password='StrongPass123!')

        field_type = FieldType.objects.create(name='San owner stats')
        self.owner_field = Field.objects.create(
            field_type=field_type,
            owner=self.owner_admin,
            name='Owner Stats Field',
            location='Đà Nẵng',
            price_per_hour=Decimal('300000.00'),
            peak_hour_price=Decimal('400000.00'),
            deposit_percent=Decimal('30.00'),
            is_active=True,
        )
        self.other_field = Field.objects.create(
            field_type=field_type,
            owner=self.other_admin,
            name='Other Stats Field',
            location='Hue',
            price_per_hour=Decimal('350000.00'),
            peak_hour_price=Decimal('450000.00'),
            deposit_percent=Decimal('30.00'),
            is_active=True,
        )

        self.owner_booking = Booking.objects.create(
            user=self.user,
            field=self.owner_field,
            booking_date=date.today() - timedelta(days=1),
            customer_name='Stats Owner',
            customer_phone='0900888000',
            customer_email='ownerstats@example.com',
            total_amount=Decimal('400000.00'),
            deposit_amount=Decimal('120000.00'),
            status='completed',
        )
        Payment.objects.create(
            booking=self.owner_booking,
            payment_method='vnpay',
            amount=Decimal('120000.00'),
            status='completed',
        )

        other_booking = Booking.objects.create(
            user=self.user,
            field=self.other_field,
            booking_date=date.today() - timedelta(days=1),
            customer_name='Stats Other',
            customer_phone='0900999001',
            customer_email='otherstats@example.com',
            total_amount=Decimal('500000.00'),
            deposit_amount=Decimal('150000.00'),
            status='completed',
        )
        Payment.objects.create(
            booking=other_booking,
            payment_method='vnpay',
            amount=Decimal('150000.00'),
            status='completed',
        )

    def test_owner_admin_overview_is_scoped_to_owned_fields(self):
        self.client.force_authenticate(user=self.owner_admin)

        response = self.client.get('/api/statistics/admin/overview/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['booking']['completed_bookings'], 1)
        self.assertEqual(Decimal(str(response.data['booking']['total_revenue'])), Decimal('400000.00'))

    def test_owner_admin_field_performance_is_scoped_to_owned_fields(self):
        self.client.force_authenticate(user=self.owner_admin)

        response = self.client.get('/api/statistics/admin/field-performance/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['fields']), 1)
        self.assertEqual(response.data['fields'][0]['field_id'], self.owner_field.id)
