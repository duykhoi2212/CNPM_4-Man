from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('bookings', '0002_alter_booking_options_alter_bookingtimeslot_options_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE bookings "
                "MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending_payment'"
            ),
            reverse_sql=(
                "ALTER TABLE bookings "
                "MODIFY COLUMN status ENUM('pending','confirmed','completed','cancelled') "
                "NOT NULL DEFAULT 'pending'"
            ),
        ),
    ]
