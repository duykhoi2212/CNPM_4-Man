from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('payments', '0002_alter_payment_options_alter_payment_amount_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE payments "
                "MODIFY COLUMN payment_method VARCHAR(20) NOT NULL, "
                "MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'"
            ),
            reverse_sql=(
                "ALTER TABLE payments "
                "MODIFY COLUMN payment_method ENUM('atm','momo','zalopay','bank_transfer','cash') NOT NULL, "
                "MODIFY COLUMN status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending'"
            ),
        ),
    ]
