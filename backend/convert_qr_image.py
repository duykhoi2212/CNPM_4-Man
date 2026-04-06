#!/usr/bin/env python
"""
Helper script to convert QR image to base64 for .env configuration
"""
import base64
import sys
import os

def convert_image_to_base64(image_path):
    """
    Convert image file to base64 data URL
    """
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' not found")
        return None

    # Get file extension for MIME type
    _, ext = os.path.splitext(image_path)
    ext = ext.lower()

    mime_types = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }

    mime_type = mime_types.get(ext, 'image/png')

    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()

        base64_data = base64.b64encode(image_data).decode()
        data_url = f"data:{mime_type};base64,{base64_data}"

        return data_url

    except Exception as e:
        print(f"Error converting image: {e}")
        return None

def main():
    if len(sys.argv) != 2:
        print("Usage: python convert_qr_image.py <image_path>")
        print("Example: python convert_qr_image.py my_qr_code.png")
        sys.exit(1)

    image_path = sys.argv[1]
    result = convert_image_to_base64(image_path)

    if result:
        print("\n✅ Image converted successfully!")
        print("\n📋 Copy this to your .env file:")
        print("PAYMENT_QR_CODE=" + result)
        print(f"\n📊 Image size: {len(result)} characters")
    else:
        print("❌ Failed to convert image")
        sys.exit(1)

if __name__ == "__main__":
    main()