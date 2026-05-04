from datetime import timedelta

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import UserProfile
from apps.bookings.models import Booking, BookingTimeSlot
from apps.fields.models import Field, FieldType, TimeSlot

from .models import MatchRequest, MatchRequestTimeSlot


class MatchRequestTests(TestCase):
    @staticmethod
    def _team_image(name='team.png'):
        return SimpleUploadedFile(name, b'fake-image-bytes', content_type='image/png')

    def setUp(self):
        self.client = APIClient()
        self.field_type = FieldType.objects.create(name='San 5')
        self.field = Field.objects.create(
            field_type=self.field_type,
            name='San giao luu',
            location='Đà Nẵng',
            price_per_hour=300000,
            peak_hour_price=400000,
            deposit_percent=30,
            avg_rating=4.5,
            total_reviews=2,
            is_active=True,
        )
        self.timeslot = TimeSlot.objects.create(
            field=self.field,
            start_time='18:00',
            end_time='19:00',
            price=300000,
            is_peak_hour=False,
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

    def _create_request(self):
        self.client.force_authenticate(self.creator)
        response = self.client.post(
            reverse('matches:match-request-list-create'),
            {
                'field': self.field.id,
                'booking_date': (timezone.localdate() + timedelta(days=1)).isoformat(),
                'timeslot_ids': [self.timeslot.id],
                'notes': 'Giao luu vui',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        return response.data['match_request']

    def test_create_match_request(self):
        payload = self._create_request()
        self.assertEqual(payload['created_team_name'], 'FC Creator')
        self.assertEqual(payload['status'], MatchRequest.STATUS_WAITING_OPPONENT)
        self.assertEqual(payload['timeslots'][0]['id'], self.timeslot.id)

    def test_accept_match_request_sets_hold(self):
        match_request = self._create_request()
        self.client.force_authenticate(self.opponent)
        response = self.client.post(
            reverse('matches:match-request-accept', args=[match_request['id']]),
            {},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        match_request_obj = MatchRequest.objects.get(pk=match_request['id'])
        self.assertEqual(match_request_obj.status, MatchRequest.STATUS_ACCEPTED_WAITING_DEPOSIT)
        self.assertIsNotNone(match_request_obj.reserved_until)
        self.assertEqual(match_request_obj.accepted_team_name, 'FC Opponent')

    def test_complete_deposit_links_booking(self):
        match_request = self._create_request()
        self.client.force_authenticate(self.opponent)
        accept_response = self.client.post(
            reverse('matches:match-request-accept', args=[match_request['id']]),
            {},
            format='json',
        )
        self.assertEqual(accept_response.status_code, 200)

        self.client.force_authenticate(self.creator)
        pay_response = self.client.post(
            reverse('matches:match-request-pay', args=[match_request['id']]),
            {
                'customer_name': 'Creator',
                'customer_phone': '0900000000',
                'customer_email': 'creator@example.com',
                'notes': '',
            },
            format='json',
        )
        self.assertEqual(pay_response.status_code, 200)

        match_request_obj = MatchRequest.objects.get(pk=match_request['id'])
        self.assertEqual(match_request_obj.status, MatchRequest.STATUS_DEPOSIT_PAID)
        self.assertIsNotNone(match_request_obj.booking_id)

    def test_counterpart_team_depends_on_viewer(self):
        match_request = self._create_request()

        self.client.force_authenticate(self.opponent)
        accept_response = self.client.post(
            reverse('matches:match-request-accept', args=[match_request['id']]),
            {},
            format='json',
        )
        self.assertEqual(accept_response.status_code, 200)

        self.client.force_authenticate(self.creator)
        creator_response = self.client.get(reverse('matches:match-request-detail', args=[match_request['id']]))
        self.assertEqual(creator_response.status_code, 200)
        self.assertEqual(creator_response.data['viewer_role'], 'creator')
        self.assertEqual(creator_response.data['counterpart_team_name'], 'FC Opponent')
        self.assertTrue(creator_response.data['counterpart_team_image_url'])

        self.client.force_authenticate(self.opponent)
        accepted_response = self.client.get(reverse('matches:match-request-detail', args=[match_request['id']]))
        self.assertEqual(accepted_response.status_code, 200)
        self.assertEqual(accepted_response.data['viewer_role'], 'accepted')
        self.assertEqual(accepted_response.data['counterpart_team_name'], 'FC Creator')
        self.assertTrue(accepted_response.data['counterpart_team_image_url'])

    def test_conflicting_confirmed_booking_removes_waiting_match_request_from_active_list(self):
        match_request = self._create_request()

        booking = Booking.objects.create(
            user=self.opponent,
            field=self.field,
            booking_date=timezone.localdate() + timedelta(days=1),
            customer_name='Opponent',
            customer_phone='0900000002',
            customer_email='opponent@example.com',
            total_amount=300000,
            deposit_amount=90000,
            status='confirmed',
        )
        BookingTimeSlot.objects.create(booking=booking, timeslot=self.timeslot)

        response = self.client.get(reverse('matches:match-request-list-create'))

        self.assertEqual(response.status_code, 200)
        returned_ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(match_request['id'], returned_ids)

        match_request_obj = MatchRequest.objects.get(pk=match_request['id'])
        self.assertEqual(match_request_obj.status, MatchRequest.STATUS_CANCELLED)

    def test_cannot_accept_waiting_match_request_if_slot_was_booked(self):
        match_request = self._create_request()

        booking = Booking.objects.create(
            user=self.creator,
            field=self.field,
            booking_date=timezone.localdate() + timedelta(days=1),
            customer_name='Creator',
            customer_phone='0900000001',
            customer_email='creator@example.com',
            total_amount=300000,
            deposit_amount=90000,
            status='pending_payment',
        )
        BookingTimeSlot.objects.create(booking=booking, timeslot=self.timeslot)

        self.client.force_authenticate(self.opponent)
        response = self.client.post(
            reverse('matches:match-request-accept', args=[match_request['id']]),
            {},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Yêu cầu giao lưu này không còn hợp lệ để chấp nhận')

        match_request_obj = MatchRequest.objects.get(pk=match_request['id'])
        self.assertEqual(match_request_obj.status, MatchRequest.STATUS_CANCELLED)

    def test_past_waiting_match_request_is_expired_and_hidden_from_active_list(self):
        self.client.force_authenticate(self.creator)
        response = self.client.post(
            reverse('matches:match-request-list-create'),
            {
                'field': self.field.id,
                'booking_date': (timezone.localdate() - timedelta(days=1)).isoformat(),
                'timeslot_ids': [self.timeslot.id],
                'notes': 'Đã quá giờ thi đấu',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 400)

        past_request = MatchRequest.objects.create(
            created_by=self.creator,
            field=self.field,
            booking_date=timezone.localdate() - timedelta(days=1),
            created_team_name='FC Creator',
            created_team_image_url='http://testserver/media/creator-team.png',
            notes='Đã quá giờ thi đấu',
            total_amount=300000,
            deposit_amount=90000,
            status=MatchRequest.STATUS_WAITING_OPPONENT,
        )
        MatchRequestTimeSlot.objects.create(match_request=past_request, timeslot=self.timeslot)

        list_response = self.client.get(reverse('matches:match-request-list-create'))

        self.assertEqual(list_response.status_code, 200)
        returned_ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(past_request.id, returned_ids)

        past_request.refresh_from_db()
        self.assertEqual(past_request.status, MatchRequest.STATUS_EXPIRED)
