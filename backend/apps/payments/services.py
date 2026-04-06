import qrcode
import base64
from io import BytesIO
from django.conf import settings
from .models import PaymentQR


def generate_virtual_qr_code(payment_id, amount, booking=None, payment_method='all'):
    """
    Generate virtual QR code cho thanh toán ảo từ database

    Args:
        payment_id: ID của payment
        amount: Số tiền thanh toán
        booking: Booking object (optional)
        payment_method: Phương thức thanh toán ('bank_transfer', 'momo', 'vnpay', 'all')

    Returns: Data URL của QR code từ database
    """
    try:
        # Lấy QR code active từ database theo payment_method
        qr_codes = PaymentQR.objects.filter(is_active=True)

        # Ưu tiên QR code theo payment_method cụ thể
        qr_code_obj = qr_codes.filter(payment_method=payment_method).first()

        # Nếu không có QR code cụ thể, lấy QR code cho tất cả phương thức
        if not qr_code_obj:
            qr_code_obj = qr_codes.filter(payment_method='all').first()

        if qr_code_obj and qr_code_obj.qr_image:
            return qr_code_obj.qr_image

        # Fallback: Lấy từ settings nếu không có trong database
        qr_code = getattr(settings, 'PAYMENT_QR_CODE', None)
        if qr_code and qr_code.startswith('data:image/'):
            return qr_code

        # Fallback cuối: tạo QR code đơn giản
        qr_data = f"PAYMENT_{payment_id}|{int(amount)}|VIRTUAL"

        qr = qrcode.QRCode(
            version=5,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64 data URL
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        data_url = f"data:image/png;base64,{img_str}"

        return data_url

    except Exception as e:
        print(f"Error generating virtual QR: {e}")
        return None


def generate_qr_code(payment_id, amount, bank_account='', bank_name='', booking=None):
    """
    Generate QR code cho thanh toán (legacy function)

    Returns: Data URL của QR code
    """
    return generate_virtual_qr_code(payment_id, amount, booking)


def generate_momo_qr(payment_id, amount, booking=None):
    """
    Generate MoMo QR code (sử dụng virtual QR)

    Returns: Data URL của QR code
    """
    return generate_virtual_qr_code(payment_id, amount, booking)


def generate_bank_qr(payment_id, amount, booking=None):
    """
    Generate bank transfer QR code (sử dụng virtual QR)

    Returns: Data URL của QR code
    """
    return generate_virtual_qr_code(payment_id, amount, booking)
