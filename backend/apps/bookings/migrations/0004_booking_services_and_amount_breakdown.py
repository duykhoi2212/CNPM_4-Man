from decimal import Decimal

from django.db import migrations, models
import django.db.models.deletion


def backfill_booking_amounts(apps, schema_editor):
    Booking = apps.get_model('bookings', 'Booking')
    Booking.objects.filter(field_amount=Decimal('0.00')).update(field_amount=models.F('total_amount'))


def seed_default_services(apps, schema_editor):
    ServiceProduct = apps.get_model('bookings', 'ServiceProduct')

    defaults = [
        {
            'code': 'drink_water_bottle',
            'name': 'Nuoc uong',
            'unit_label': 'chai',
            'unit_price': Decimal('10000.00'),
            'sort_order': 1,
        },
    ]

    for item in defaults:
        ServiceProduct.objects.update_or_create(
            code=item['code'],
            defaults={
                'name': item['name'],
                'unit_label': item['unit_label'],
                'unit_price': item['unit_price'],
                'sort_order': item['sort_order'],
                'is_active': True,
            },
        )


def add_booking_amount_columns(apps, schema_editor):
    Booking = apps.get_model('bookings', 'Booking')
    existing_columns = {
        column.name
        for column in schema_editor.connection.introspection.get_table_description(
            schema_editor.connection.cursor(),
            Booking._meta.db_table,
        )
    }

    if 'field_amount' not in existing_columns:
        schema_editor.add_field(Booking, Booking._meta.get_field('field_amount'))

    if 'service_amount' not in existing_columns:
        schema_editor.add_field(Booking, Booking._meta.get_field('service_amount'))


def create_service_tables_if_missing(apps, schema_editor):
    ServiceProduct = apps.get_model('bookings', 'ServiceProduct')
    BookingServiceItem = apps.get_model('bookings', 'BookingServiceItem')

    existing_tables = set(schema_editor.connection.introspection.table_names())

    if ServiceProduct._meta.db_table not in existing_tables:
        schema_editor.create_model(ServiceProduct)
        existing_tables.add(ServiceProduct._meta.db_table)

    if BookingServiceItem._meta.db_table not in existing_tables:
        schema_editor.create_model(BookingServiceItem)


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0003_convert_status_enum_to_varchar'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name='booking',
                    name='id',
                    field=models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
                ),
                migrations.AddField(
                    model_name='booking',
                    name='field_amount',
                    field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Tien san'),
                ),
                migrations.AddField(
                    model_name='booking',
                    name='service_amount',
                    field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Tien dich vu'),
                ),
                migrations.CreateModel(
                    name='ServiceProduct',
                    fields=[
                        ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('name', models.CharField(max_length=120, verbose_name='Ten dich vu')),
                        ('code', models.CharField(max_length=40, unique=True, verbose_name='Ma dich vu')),
                        ('unit_label', models.CharField(default='don vi', max_length=40, verbose_name='Don vi tinh')),
                        ('unit_price', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Don gia')),
                        ('is_active', models.BooleanField(default=True, verbose_name='Dang kinh doanh')),
                        ('sort_order', models.PositiveIntegerField(default=0, verbose_name='Thu tu hien thi')),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                    ],
                    options={
                        'verbose_name': 'San pham dich vu',
                        'verbose_name_plural': 'San pham dich vu',
                        'db_table': 'service_products',
                        'ordering': ['sort_order', 'name'],
                    },
                ),
                migrations.CreateModel(
                    name='BookingServiceItem',
                    fields=[
                        ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('service_name_snapshot', models.CharField(max_length=120, verbose_name='Ten dich vu tai thoi diem dat')),
                        ('unit_price_snapshot', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Don gia tai thoi diem dat')),
                        ('unit_label_snapshot', models.CharField(default='don vi', max_length=40, verbose_name='Don vi tinh tai thoi diem dat')),
                        ('quantity', models.PositiveIntegerField(default=1, verbose_name='So luong')),
                        ('line_total', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Thanh tien')),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('booking', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='service_items', to='bookings.booking', verbose_name='Don dat')),
                        ('service_product', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='booking_items', to='bookings.serviceproduct', verbose_name='San pham dich vu')),
                    ],
                    options={
                        'verbose_name': 'Dong dich vu booking',
                        'verbose_name_plural': 'Dong dich vu booking',
                        'db_table': 'booking_service_items',
                        'ordering': ['id'],
                    },
                ),
            ],
        ),
        migrations.RunPython(add_booking_amount_columns, migrations.RunPython.noop),
        migrations.RunPython(create_service_tables_if_missing, migrations.RunPython.noop),
        migrations.RunPython(backfill_booking_amounts, migrations.RunPython.noop),
        migrations.RunPython(seed_default_services, migrations.RunPython.noop),
    ]
