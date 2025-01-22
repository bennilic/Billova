from django.contrib import admin

from .models import Category, UserSettings, Expense

# Register your models here.

admin.site.register(Category)
admin.site.register(UserSettings)
admin.site.register(Expense)
