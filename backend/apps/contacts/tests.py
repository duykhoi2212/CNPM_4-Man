from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import ContactMessage


class ContactApiTests(APITestCase):
    def test_public_can_send_contact_message(self):
        payload = {
            'name': 'Duy Khoi',
            'email': 'khoi@example.com',
            'phone': '0909999999',
            'subject': 'Cần hỗ trợ đặt sân',
            'message': 'Tôi muốn hỏi thêm về lịch đặt sân cuối tuần.',
        }

        response = self.client.post('/api/contacts/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_admin_can_list_contact_messages(self):
        admin = User.objects.create_user(username='contactadmin', password='StrongPass123!', is_staff=True)
        ContactMessage.objects.create(
            name='Khach A',
            email='khacha@example.com',
            phone='0901111111',
            subject='Sân trống',
            message='Cho mình hỏi sân ngày mai còn trống không?',
        )
        self.client.force_authenticate(user=admin)

        response = self.client.get('/api/contacts/admin/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_admin_can_mark_contact_message_resolved(self):
        admin = User.objects.create_user(username='contactmanager', password='StrongPass123!', is_staff=True)
        contact = ContactMessage.objects.create(
            name='Khach B',
            email='khachb@example.com',
            phone='0902222222',
            subject='Cần liên hệ gấp',
            message='Vui lòng gọi lại cho tôi sớm.',
        )
        self.client.force_authenticate(user=admin)

        response = self.client.patch(
            f'/api/contacts/admin/{contact.id}/update/',
            {'is_resolved': True},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        contact.refresh_from_db()
        self.assertTrue(contact.is_resolved)
