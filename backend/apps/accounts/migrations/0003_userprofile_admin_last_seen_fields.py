from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_userprofile_avatar'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='last_seen_bookings_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Lần cuối xem booking'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='last_seen_contacts_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Lần cuối xem liên hệ'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='last_seen_reviews_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Lần cuối xem review'),
        ),
    ]
