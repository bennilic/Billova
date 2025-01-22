# Generated by Django 5.1.3 on 2025-01-20 17:20

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='categories', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('invoice_date_time', models.DateTimeField(default=django.utils.timezone.now)),
                ('price', models.DecimalField(decimal_places=2, max_digits=14)),
                ('note', models.TextField(blank=True)),
                ('invoice_issuer', models.TextField(blank=True)),
                ('invoice_as_text', models.TextField(blank=True)),
                ('categories', models.ManyToManyField(related_name='expenses', to='billova_app.category')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='expenses', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['invoice_date_time'],
            },
        ),
        migrations.CreateModel(
            name='UserSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('currency', models.CharField(choices=[], default='EUR', max_length=3)),
                ('language', models.CharField(choices=[('en', 'English'), ('de', 'German'), ('fr', 'French'), ('es', 'Spanish'), ('it', 'Italian'), ('ro', 'Romanian'), ('tr', 'Turkish')], default='English', max_length=2)),
                ('timezone', models.CharField(default='ECT/Vienna', max_length=50)),
                ('numeric_format', models.CharField(choices=[('AT', 'Austrian'), ('DE', 'German'), ('CH', 'Swiss'), ('US', 'American'), ('UK', 'British')], default='Austrian', max_length=2)),
                ('profile_picture', models.ImageField(blank=True, null=True, upload_to='billova_app/static/images/profile_pics/')),
                ('owner', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
