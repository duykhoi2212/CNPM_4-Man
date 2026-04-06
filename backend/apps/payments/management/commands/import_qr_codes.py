from django.core.management.base import BaseCommand
from django.conf import settings
from apps.payments.models import PaymentQR


class Command(BaseCommand):
    help = 'Import QR codes from settings to database'

    def handle(self, *args, **options):
        # Lấy QR code từ settings
        qr_code = getattr(settings, 'PAYMENT_QR_CODE', None)

        if not qr_code:
            self.stdout.write(
                self.style.WARNING('No PAYMENT_QR_CODE found in settings')
            )
            return

        if not qr_code.startswith('data:image/'):
            self.stdout.write(
                self.style.ERROR('PAYMENT_QR_CODE is not a valid data URL')
            )
            return

        # Kiểm tra xem đã có QR code mặc định chưa
        existing_qr = PaymentQR.objects.filter(name='Default QR Code').first()

        if existing_qr:
            self.stdout.write(
                self.style.WARNING('Default QR code already exists in database')
            )
            return

        # Tạo QR code mới
        payment_qr = PaymentQR.objects.create(
            name='Default QR Code',
            payment_method='all',
            qr_image=qr_code,
            is_active=True,
            description='QR code imported from settings'
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully imported QR code: {payment_qr.name}')
        )