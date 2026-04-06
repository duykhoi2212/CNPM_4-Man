# Generated migration for Payment model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0003_convert_payment_enums_to_varchar'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='qr_code',
            field=models.TextField(blank=True, null=True, verbose_name='Ma QR (data URL)'),
        ),
        migrations.AlterField(
            model_name='payment',
            name='payment_method',
            field=models.CharField(
                choices=[
                    ('bank_transfer', 'Chuyen khoan ngan hang'),
                    ('momo', 'MoMo'),
                    ('vnpay', 'VNPay'),
                    ('cash', 'Tien mat'),
                ],
                max_length=20,
                verbose_name='Phuong thuc thanh toan'
            ),
        ),
    ]
