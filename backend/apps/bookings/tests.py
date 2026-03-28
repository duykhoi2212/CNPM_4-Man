from datetime import date, time, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.fields.models import FieldType, Field, TimeSlot
from .models import Booking, BookingTimeSlot


class BookingApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='bookinguser', password='StrongPass123!')
        self.client.force_authenticate(user=self.user)

        self.field_type = FieldType.objects.create(name='San 5')
        self.field = Field.objects.create(
            field_type=self.field_type,
            name='Field A',
            location='Location A',
            price_per_hour=Decimal('300000.00'),
            peak_hour_price=Decimal('400000.00'),
            deposit_percent=Decimal('30.00'),
            is_active=True,
        )
        self.timeslot = TimeSlot.objects.create(
            field=self.field,
            start_time=time(12, 0),
            end_time=time(13, 0),
            price=Decimal('400000.00'),
            is_peak_hour=False,
            is_active=True,
        )

    def test_create_booking_success(self):
        payload = {
            'field': self.field.id,
            'booking_date': (date.today() + timedelta(days=1)).isoformat(),
            'timeslot_ids': [self.timeslot.id],
            'customer_name': 'Booking User',
            'customer_phone': '0900111222',
            'customer_email': 'booking@example.com',
            'notes': '',
        }

        response = self.client.post('/api/bookings/create/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('booking', response.data)
        booking = Booking.objects.get(id=response.data['booking']['id'])
        self.assertEqual(booking.status, 'pending_payment')
        self.assertEqual(booking.total_amount, Decimal('400000.00'))
        self.assertEqual(booking.deposit_amount, Decimal('120000.00'))

    def test_create_booking_conflict_timeslot(self):
        booking_date = date.today() + timedelta(days=1)

        existing = Booking.objects.create(
            user=self.user,
            field=self.field,
            booking_date=booking_date,
            customer_name='Existing',
            customer_phone='0900333444',
            customer_email='existing@example.com',
            total_amount=Decimal('400000.00'),
            deposit_amount=Decimal('120000.00'),
            status='pending_payment',
        )
        BookingTimeSlot.objects.create(booking=existing, timeslot=self.timeslot)

        payload = {
            'field': self.field.id,
            'booking_date': booking_date.isoformat(),
            'timeslot_ids': [self.timeslot.id],
            'customer_name': 'Booking User',
            'customer_phone': '0900111222',
            'customer_email': 'booking@example.com',
            'notes': '',
        }

        response = self.client.post('/api/bookings/create/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('timeslot_ids', response.data)
