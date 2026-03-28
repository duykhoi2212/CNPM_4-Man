from django.db import migrations


def convert_status_to_varchar(apps, schema_editor):
    if schema_editor.connection.vendor != 'mysql':
        return

    schema_editor.execute(
        "ALTER TABLE bookings "
        "MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending_payment'"
    )


def revert_status_to_enum(apps, schema_editor):
    if schema_editor.connection.vendor != 'mysql':
        return

    schema_editor.execute(
        "ALTER TABLE bookings "
        "MODIFY COLUMN status ENUM('pending','confirmed','completed','cancelled') "
        "NOT NULL DEFAULT 'pending'"
    )


class Migration(migrations.Migration):
    dependencies = [
        ('bookings', '0002_alter_booking_options_alter_bookingtimeslot_options_and_more'),
    ]

    operations = [
        migrations.RunPython(convert_status_to_varchar, revert_status_to_enum),
    ]
