from datetime import date, time, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.fields.models import FieldType, Field, TimeSlot
from .models import Booking, BookingTimeSlot, ServiceProduct, BookingServiceItem


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
        self.drink, _ = ServiceProduct.objects.get_or_create(
            code='drink_water_bottle',
            defaults={
                'name': 'Nuoc uong',
                'unit_label': 'chai',
                'unit_price': Decimal('10000.00'),
                'is_active': True,
                'sort_order': 1,
            },
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

    def test_create_booking_with_services_success(self):
        payload = {
            'field': self.field.id,
            'booking_date': (date.today() + timedelta(days=1)).isoformat(),
            'timeslot_ids': [self.timeslot.id],
            'customer_name': 'Booking User',
            'customer_phone': '0900111222',
            'customer_email': 'booking@example.com',
            'notes': '',
            'service_items': [
                {
                    'service_id': self.drink.id,
                    'quantity': 4,
                }
            ],
        }

        response = self.client.post('/api/bookings/create/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking = Booking.objects.get(id=response.data['booking']['id'])
        self.assertEqual(booking.field_amount, Decimal('400000.00'))
        self.assertEqual(booking.service_amount, Decimal('40000.00'))
        self.assertEqual(booking.total_amount, Decimal('440000.00'))
        self.assertEqual(booking.deposit_amount, Decimal('120000.00'))

        service_rows = BookingServiceItem.objects.filter(booking=booking)
        self.assertEqual(service_rows.count(), 1)
        self.assertEqual(service_rows.first().line_total, Decimal('40000.00'))


class BookingAdminOwnershipTests(APITestCase):
    def setUp(self):
        self.owner_admin = User.objects.create_user(username='ownerbookingadmin', password='StrongPass123!', is_staff=True)
        self.other_admin = User.objects.create_user(username='otherbookingadmin', password='StrongPass123!', is_staff=True)
        self.customer = User.objects.create_user(username='bookingcustomer', password='StrongPass123!')

        self.field_type = FieldType.objects.create(name='San booking owner')
        self.owner_field = Field.objects.create(
            field_type=self.field_type,
            owner=self.owner_admin,
            name='Owner Booking Field',
            location='Location A',
            price_per_hour=Decimal('300000.00'),
            peak_hour_price=Decimal('400000.00'),
            deposit_percent=Decimal('30.00'),
            is_active=True,
        )
        self.other_field = Field.objects.create(
            field_type=self.field_type,
            owner=self.other_admin,
            name='Other Booking Field',
            location='Location B',
            price_per_hour=Decimal('300000.00'),
            peak_hour_price=Decimal('400000.00'),
            deposit_percent=Decimal('30.00'),
            is_active=True,
        )

        self.owner_booking = Booking.objects.create(
            user=self.customer,
            field=self.owner_field,
            booking_date=date.today() + timedelta(days=1),
            customer_name='Owner Customer',
            customer_phone='0900111000',
            customer_email='owner@example.com',
            total_amount=Decimal('300000.00'),
            deposit_amount=Decimal('90000.00'),
            status='confirmed',
        )
        self.other_booking = Booking.objects.create(
            user=self.customer,
            field=self.other_field,
            booking_date=date.today() + timedelta(days=2),
            customer_name='Other Customer',
            customer_phone='0900222000',
            customer_email='other@example.com',
            total_amount=Decimal('300000.00'),
            deposit_amount=Decimal('90000.00'),
            status='confirmed',
        )

    def test_owner_admin_only_lists_bookings_for_managed_fields(self):
        self.client.force_authenticate(user=self.owner_admin)

        response = self.client.get('/api/bookings/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking_ids = {item['id'] for item in response.data['results']}
        self.assertEqual(booking_ids, {self.owner_booking.id})


class ServiceProductAdminApiTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(username='serviceadmin', password='StrongPass123!', is_staff=True)
        self.normal_user = User.objects.create_user(username='serviceuser', password='StrongPass123!')
        self.product = ServiceProduct.objects.create(
            name='Nuoc uong',
            code='drink_water_bottle_test_admin',
            unit_label='chai',
            unit_price=Decimal('10000.00'),
            is_active=True,
            sort_order=1,
        )

    def test_admin_can_create_service_product(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'name': 'Bóng đá',
            'code': 'ball_rent',
            'unit_label': 'qua',
            'unit_price': '15000.00',
            'is_active': True,
            'sort_order': 2,
        }

        response = self.client.post('/api/bookings/services/products/admin/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ServiceProduct.objects.filter(code='ball_rent').exists())

    def test_admin_can_update_service_product(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            f'/api/bookings/services/products/admin/{self.product.id}/',
            {'unit_price': '12000.00', 'is_active': False},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.unit_price, Decimal('12000.00'))
        self.assertFalse(self.product.is_active)

    def test_non_admin_cannot_create_service_product(self):
        self.client.force_authenticate(user=self.normal_user)
        payload = {
            'name': 'Do an',
            'code': 'snack',
            'unit_label': 'phan',
            'unit_price': '25000.00',
            'is_active': True,
            'sort_order': 3,
        }

        response = self.client.post('/api/bookings/services/products/admin/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
