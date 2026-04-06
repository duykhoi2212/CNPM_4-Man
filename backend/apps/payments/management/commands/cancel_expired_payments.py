from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.payments.models import Payment


class Command(BaseCommand):
    help = 'Cancel expired pending payments'

    def handle(self, *args, **options):
        expired_payments = Payment.objects.filter(
            status='pending',  # Chỉ cancel pending, không cancel user_confirmed
            expiry_time__lt=timezone.now()
        )

        count = expired_payments.update(status='failed')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully cancelled {count} expired payments')
        )