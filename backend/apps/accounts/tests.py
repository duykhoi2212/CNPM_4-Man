from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from .models import UserProfile
from apps.bookings.models import Booking
from apps.contacts.models import ContactMessage
from apps.fields.models import Field, FieldType
from apps.reviews.models import Review


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
        team_image = SimpleUploadedFile(
            'team.gif',
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
                'team_name': 'Blue Storm',
                'team_image': team_image,
            },
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'Profile')
        self.assertEqual(user.profile.address, 'New address')
        self.assertEqual(user.profile.team_name, 'Blue Storm')
        self.assertIsNotNone(response.data['user']['profile']['avatar_url'])
        self.assertEqual(response.data['user']['profile']['team_name'], 'Blue Storm')
        self.assertIsNotNone(response.data['user']['profile']['team_image_url'])

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

    def test_change_password_success(self):
        user = User.objects.create_user(
            username='changepassuser',
            password='StrongPass123!',
            email='changepass@example.com'
        )
        UserProfile.objects.create(user=user, phone='0900000008', address='')
        self.client.force_authenticate(user=user)

        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'StrongPass123!',
                'new_password': 'NewStrongPass123!',
                'new_password2': 'NewStrongPass123!',
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('NewStrongPass123!'))
        self.assertIn('token', response.data)

    def test_change_password_rejects_wrong_old_password(self):
        user = User.objects.create_user(
            username='wrongoldpassuser',
            password='StrongPass123!',
            email='wrongold@example.com'
        )
        UserProfile.objects.create(user=user, phone='0900000009', address='')
        self.client.force_authenticate(user=user)

        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'WrongPass123!',
                'new_password': 'NewStrongPass123!',
                'new_password2': 'NewStrongPass123!',
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('old_password', response.data)

    def test_admin_nav_summary_returns_badge_counts(self):
        admin = User.objects.create_user(
            username='summaryadmin',
            password='StrongPass123!',
            email='summaryadmin@example.com',
            is_staff=True,
            is_superuser=True,
        )
        UserProfile.objects.create(user=admin, phone='0900000010', address='')

        user = User.objects.create_user(
            username='summaryuser',
            password='StrongPass123!',
            email='summaryuser@example.com'
        )
        UserProfile.objects.create(user=user, phone='0900000011', address='')

        field_type = FieldType.objects.create(name='San 5 nguoi')
        field = Field.objects.create(
            field_type=field_type,
            name='Summary Field',
            location='Da Nang',
            price_per_hour=300000,
            peak_hour_price=400000,
        )

        Booking.objects.create(
            user=user,
            field=field,
            booking_date='2026-04-10',
            customer_name='Summary User',
            customer_phone='0900000011',
            customer_email='summaryuser@example.com',
            total_amount=300000,
            deposit_amount=90000,
            status='confirmed',
        )

        Review.objects.create(
            user=user,
            field=field,
            booking=None,
            rating=5,
            comment='Rat tot'
        )

        ContactMessage.objects.create(
            name='Guest',
            email='guest@example.com',
            subject='Ho tro',
            message='Can ho tro dat san',
            is_resolved=False,
        )

        self.client.force_authenticate(user=admin)
        response = self.client.get('/api/auth/admin/nav-summary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bookings'], 1)
        self.assertEqual(response.data['reviews'], 1)
        self.assertEqual(response.data['contacts'], 1)

    def test_mark_nav_section_read_resets_booking_badge(self):
        admin = User.objects.create_user(
            username='badgeadmin',
            password='StrongPass123!',
            email='badgeadmin@example.com',
            is_staff=True,
            is_superuser=True,
        )
        UserProfile.objects.create(user=admin, phone='0900000012', address='')

        user = User.objects.create_user(
            username='badgeuser',
            password='StrongPass123!',
            email='badgeuser@example.com'
        )
        UserProfile.objects.create(user=user, phone='0900000013', address='')

        field_type = FieldType.objects.create(name='San 7 nguoi')
        field = Field.objects.create(
            field_type=field_type,
            name='Badge Field',
            location='Hue',
            price_per_hour=350000,
            peak_hour_price=450000,
        )

        Booking.objects.create(
            user=user,
            field=field,
            booking_date='2026-04-12',
            customer_name='Badge User',
            customer_phone='0900000013',
            customer_email='badgeuser@example.com',
            total_amount=350000,
            deposit_amount=105000,
            status='pending_payment',
        )

        self.client.force_authenticate(user=admin)
        summary_response = self.client.get('/api/auth/admin/nav-summary/')
        self.assertEqual(summary_response.data['bookings'], 1)

        mark_read_response = self.client.post(
            '/api/auth/admin/nav-summary/mark-read/',
            {'section': 'bookings'},
            format='json'
        )
        self.assertEqual(mark_read_response.status_code, status.HTTP_200_OK)

        summary_response = self.client.get('/api/auth/admin/nav-summary/')
        self.assertEqual(summary_response.data['bookings'], 0)
