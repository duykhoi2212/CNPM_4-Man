#!/usr/bin/env python
"""
Test script for Virtual Payment QR Code
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from apps.payments.services import generate_virtual_qr_code
from apps.bookings.models import Booking

def test_virtual_payment():
    print("Testing Virtual Payment QR Code...")

    # Test tạo QR code
    print("\n1. Testing generate_virtual_qr_code...")
    qr_result = generate_virtual_qr_code(999, 30000)
    if qr_result:
        print("✅ Virtual QR generated successfully")
        print(f"   QR starts with: {qr_result[:50]}...")
        print(f"   Is data URL: {qr_result.startswith('data:image/')}")
    else:
        print("❌ Virtual QR generation failed")

    # Test với booking thực
    print("\n2. Testing with real booking...")
    try:
        booking = Booking.objects.filter(status='pending_payment').first()
        if booking:
            print(f"Found booking: {booking.field.name} on {booking.booking_date}")
            qr_result = generate_virtual_qr_code(999, 30000, booking)
            if qr_result:
                print("✅ QR generated for booking")
                print(f"   QR length: {len(qr_result)}")
            else:
                print("❌ QR generation failed")
        else:
            print("No pending payment booking found")
    except Exception as e:
        print(f"❌ Error testing with booking: {e}")

    print("\nTest completed!")

if __name__ == "__main__":
    test_virtual_payment()