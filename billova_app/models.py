from django.db import models
from django.utils import timezone


class Expense(models.Model):
    invoice_date_time = models.DateTimeField(default=timezone.now)
    price = models.DecimalField(max_digits=14, decimal_places=2) # 1 Billion with 2 decimal places
    note = models.TextField(blank=True)
    invoice_issuer = models.TextField(blank=True)
    invoice_as_text = models.TextField(blank=True)
    categories = models.ManyToManyField('Category', related_name='expenses')
    owner = models.ForeignKey('auth.User', related_name='expenses', on_delete=models.CASCADE)

    class Meta:
        ordering = ['invoice_date_time']


class Category(models.Model):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey('auth.User', related_name='categories', on_delete=models.CASCADE)

    class Meta:
        ordering = ['name']
        # TODO make primary key (name, owner)

class UserSettings(models.Model):
    # https://en.wikipedia.org/wiki/ISO_4217 - 3 letter currency code
    currency = models.CharField(max_length=3)
    # https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes - 2 letter language code
    language = models.CharField(max_length=2)
    owner = models.OneToOneField('auth.User', related_name='user_settings', on_delete=models.CASCADE)