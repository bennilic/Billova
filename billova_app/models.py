from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from billova_app.utils.settings_utils import get_currency_choices


class Expense(models.Model):
    invoice_date_time = models.DateTimeField(default=timezone.now)
    price = models.DecimalField(max_digits=14, decimal_places=2)  # 1 Billion with 2 decimal places
    note = models.TextField(blank=True)
    invoice_issuer = models.TextField(blank=True)
    invoice_as_text = models.TextField(blank=True)
    # category = models.ForeignKey('Category', related_name='expenses', on_delete=models.CASCADE)
    owner = models.ForeignKey('auth.User', related_name='expenses', on_delete=models.CASCADE)

    class Meta:
        ordering = ['invoice_date_time']


class Category(models.Model):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey('auth.User', related_name='categories', on_delete=models.CASCADE)

    class Meta:
        ordering = ['name']


class UserSettings(models.Model):
    NUMERIC_FORMAT_CHOICES = [
        ('AT', 'Austrian'),
        ('DE', 'German'),
        ('CH', 'Swiss'),
        ('US', 'American'),
        ('UK', 'British'),
    ]

    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("de", "German"),
        ("fr", "French"),
        ("es", "Spanish"),
        ("it", "Italian"),
        ("ro", "Romanian"),
        ("tr", "Turkish"),
    ]

    # Generate the tuples

    CURRENCY_CHOICES = get_currency_choices(LANGUAGE_CHOICES)

    owner = models.OneToOneField(User, on_delete=models.CASCADE)
    currency = models.JSONField(null=True, blank=True, choices=CURRENCY_CHOICES)  # Store as JSON for flexibility
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='en')
    timezone = models.CharField(max_length=50, default='ECT/Vienna')
    numeric_format = models.CharField(max_length=2, choices=NUMERIC_FORMAT_CHOICES, default='AT')
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
