from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from .models import UserProfile


class AccountsApiTests(APITestCase):
    def test_register_success(self):
        payload = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'first_name': 'New',
            'last_name': 'User',
            'phone': '0900000001',
            'address': 'Test address',
        }

        response = self.client.post('/api/auth/register/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertTrue(User.objects.filter(username='newuser').exists())
        self.assertTrue(UserProfile.objects.filter(phone='0900000001').exists())

    def test_login_success(self):
        user = User.objects.create_user(
            username='loginuser',
            password='StrongPass123!',
            email='loginuser@example.com'
        )
        UserProfile.objects.create(user=user, phone='0900000002', address='')

        response = self.client.post(
            '/api/auth/login/',
            {'username': 'loginuser', 'password': 'StrongPass123!'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_profile_requires_authentication(self):
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile_with_avatar_success(self):
        user = User.objects.create_user(
            username='profileuser',
            password='StrongPass123!',
            email='profile@example.com'
        )
        UserProfile.objects.create(user=user, phone='0900000003', address='Old address')
        self.client.force_authenticate(user=user)

        avatar = SimpleUploadedFile(
            'avatar.gif',
            (
                b'GIF87a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00'
                b'\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00'
                b'\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
            ),
            content_type='image/gif'
        )

        response = self.client.patch(
            '/api/auth/profile/update/',
            {
                'first_name': 'Profile',
                'last_name': 'User',
                'phone': '0900000003',
                'address': 'New address',
                'avatar': avatar,
            },
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'Profile')
        self.assertEqual(user.profile.address, 'New address')
        self.assertIsNotNone(response.data['user']['profile']['avatar_url'])

    def test_admin_can_list_users(self):
        admin = User.objects.create_user(
            username='adminuser',
            password='StrongPass123!',
            email='admin@example.com',
            is_staff=True,
            is_superuser=True,
        )
        UserProfile.objects.create(user=admin, phone='0900000004', address='')
        normal_user = User.objects.create_user(
            username='normaluser',
            password='StrongPass123!',
            email='normal@example.com'
        )
        UserProfile.objects.create(user=normal_user, phone='0900000005', address='Da Nang')
        self.client.force_authenticate(user=admin)

        response = self.client.get('/api/auth/admin/users/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [user['username'] for user in response.data['results']]
        self.assertIn('normaluser', usernames)

    def test_admin_can_disable_user(self):
        admin = User.objects.create_user(
            username='adminmanager',
            password='StrongPass123!',
            email='adminmanager@example.com',
            is_staff=True,
            is_superuser=True,
        )
        UserProfile.objects.create(user=admin, phone='0900000006', address='')
        normal_user = User.objects.create_user(
            username='deactivateuser',
            password='StrongPass123!',
            email='deactivate@example.com'
        )
        UserProfile.objects.create(user=normal_user, phone='0900000007', address='')
        self.client.force_authenticate(user=admin)

        response = self.client.patch(
            f'/api/auth/admin/users/{normal_user.id}/update/',
            {'is_active': False},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        normal_user.refresh_from_db()
        self.assertFalse(normal_user.is_active)
