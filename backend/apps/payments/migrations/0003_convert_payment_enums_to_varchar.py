from django.db import migrations


def convert_payment_columns_to_varchar(apps, schema_editor):
    if schema_editor.connection.vendor != 'mysql':
        return

    schema_editor.execute(
        "ALTER TABLE payments "
        "MODIFY COLUMN payment_method VARCHAR(20) NOT NULL, "
        "MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'"
    )


def revert_payment_columns_to_enum(apps, schema_editor):
    if schema_editor.connection.vendor != 'mysql':
        return

    schema_editor.execute(
        "ALTER TABLE payments "
        "MODIFY COLUMN payment_method ENUM('atm','momo','zalopay','bank_transfer','cash') NOT NULL, "
        "MODIFY COLUMN status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending'"
    )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('payments', '0002_alter_payment_options_alter_payment_amount_and_more'),
    ]

    operations = [
        migrations.RunPython(convert_payment_columns_to_varchar, revert_payment_columns_to_enum),
    ]
