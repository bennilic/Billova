# Generated by Django 5.1.3 on 2025-01-12 21:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('billova_app', '0002_alter_expense_options_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='category',
            name='user_setting',
        ),
    ]
