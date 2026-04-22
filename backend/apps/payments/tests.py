from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking
from apps.fields.models import FieldType, Field
from .models import Payment


class PaymentApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='payuser', password='StrongPass123!')
        self.client.force_authenticate(user=self.user)

        field_type = FieldType.objects.create(name='San 7')
        field = Field.objects.create(
            field_type=field_type,
            name='Field Pay',
            location='Location B',
            price_per_hour=Decimal('300000.00'),
            peak_hour_price=Decimal('400000.00'),
            deposit_percent=Decimal('30.00'),
            is_active=True,
        )

        self.booking = Booking.objects.create(
            user=self.user,
            field=field,
            booking_date=date.today() + timedelta(days=1),
            customer_name='Pay User',
            customer_phone='0900555666',
            customer_email='pay@example.com',
            total_amount=Decimal('400000.00'),
            deposit_amount=Decimal('120000.00'),
            status='pending_payment',
        )

    def test_create_payment_success(self):
        response = self.client.post(
            '/api/payments/',
            {'booking_id': self.booking.id, 'payment_method': 'vnpay'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('payment', response.data)
        payment = Payment.objects.get(id=response.data['payment']['id'])
        self.assertEqual(payment.amount, Decimal('120000.00'))
        self.assertEqual(payment.status, 'pending')

    def test_confirm_payment_updates_booking_status(self):
        payment = Payment.objects.create(
            booking=self.booking,
            payment_method='vnpay',
            amount=Decimal('120000.00'),
            status='pending',
        )

        response = self.client.post(f'/api/payments/{payment.id}/confirm/', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payment.refresh_from_db()
        self.booking.refresh_from_db()
        self.assertEqual(payment.status, 'completed')
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertTrue(payment.transaction_id)
