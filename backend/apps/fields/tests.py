from decimal import Decimal
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking
from apps.accounts.models import UserProfile
from apps.fields.models import FieldType, Field, TimeSlot
from apps.matches.models import MatchRequest, MatchRequestTimeSlot
from django.utils import timezone


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


class FieldAvailabilityMatchFlowTests(APITestCase):
    @staticmethod
    def _team_image(name='team.png'):
        return SimpleUploadedFile(name, b'fake-image-bytes', content_type='image/png')

    def setUp(self):
        self.field_type = FieldType.objects.create(name='San 5')
        self.field = Field.objects.create(
            field_type=self.field_type,
            name='San giao luu',
            location='Da Nang',
            price_per_hour=Decimal('300000.00'),
            peak_hour_price=Decimal('400000.00'),
            deposit_percent=Decimal('30.00'),
            avg_rating=Decimal('4.50'),
            total_reviews=2,
            is_active=True,
        )
        self.timeslot = TimeSlot.objects.create(
            field=self.field,
            start_time='18:00',
            end_time='19:00',
            price=Decimal('300000.00'),
            is_active=True,
        )
        self.creator = User.objects.create_user(username='creator', password='StrongPass123!')
        UserProfile.objects.create(
            user=self.creator,
            phone='0900000001',
            team_name='FC Creator',
            team_image=self._team_image('creator-team.png'),
        )
        self.opponent = User.objects.create_user(username='opponent', password='StrongPass123!')
        UserProfile.objects.create(
            user=self.opponent,
            phone='0900000002',
            team_name='FC Opponent',
            team_image=self._team_image('opponent-team.png'),
        )
        self.booking_date = timezone.localdate() + timedelta(days=1)

    def _create_match_request(self, status_value=MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT):
        match_request = MatchRequest.objects.create(
            created_by=self.creator,
            accepted_by=self.opponent if status_value != MatchRequest.STATUS_WAITING_OPPONENT else None,
            field=self.field,
            booking_date=self.booking_date,
            created_team_name='FC Creator',
            created_team_image_url='http://testserver/media/creator-team.png',
            accepted_team_name='FC Opponent' if status_value != MatchRequest.STATUS_WAITING_OPPONENT else '',
            accepted_team_image_url='http://testserver/media/opponent-team.png' if status_value != MatchRequest.STATUS_WAITING_OPPONENT else '',
            total_amount=Decimal('300000.00'),
            deposit_amount=Decimal('90000.00'),
            status=status_value,
            reserved_until=timezone.now() + timedelta(minutes=1) if status_value == MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT else None,
        )
        MatchRequestTimeSlot.objects.create(match_request=match_request, timeslot=self.timeslot)
        return match_request

    def test_availability_marks_held_match_slot_as_unavailable(self):
        self._create_match_request(MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT)

        response = self.client.get(f'/api/fields/{self.field.id}/availability/', {'date': self.booking_date.isoformat()})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['timeslots'][0]['is_available'], False)
        self.assertEqual(response.data['timeslots'][0]['reservation_status'], 'dang_giu_cho')

    def test_availability_marks_paid_match_slot_as_booked(self):
        self._create_match_request(MatchRequest.STATUS_DEPOSIT_PAID)

        response = self.client.get(f'/api/fields/{self.field.id}/availability/', {'date': self.booking_date.isoformat()})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['timeslots'][0]['is_available'], False)
        self.assertEqual(response.data['timeslots'][0]['reservation_status'], 'da_dat')
