import logging

from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import get_object_or_404
from django.urls import reverse_lazy
from django.views.generic import TemplateView
from django.views.generic.edit import FormView
from pytz import all_timezones

from billova_app.forms import UserSettingsForm, UserForm
from billova_app.models import UserSettings
from billova_app.utils.settings_utils import get_currency_choices

logger = logging.getLogger(__name__)


class AccountSettingsView(LoginRequiredMixin, TemplateView):
    template_name = "account_settings.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Fetch the user's settings or set default values
        user_settings = get_object_or_404(UserSettings, owner=self.request.user)

        popular_languages = [
            ("en", "English"), ("de", "German"), ("fr", "French"),
            ("es", "Spanish"), ("it", "Italian"), ("ro", "Romanian"), ("tr", "Turkish"),
        ]
        numeric_formats = [
            ("AT", "Austrian"), ("DE", "German"), ("CH", "Swiss"),
            ("US", "American"), ("UK", "British"),
        ]

        CURRENCY_CHOICES = get_currency_choices(popular_languages)
        # Add current settings and choices to the context
        context["timezone_choices"] = [(tz, tz) for tz in all_timezones]
        context["language_choices"] = popular_languages
        context["numeric_format_choices"] = numeric_formats
        context["currency_choices"] = CURRENCY_CHOICES
        context["current_settings"] = {
            "timezone": user_settings.timezone,
            "language": user_settings.language,
            "numeric_format": user_settings.numeric_format,
            "currency": user_settings.currency,
        }

        return context


class UpdateUserSettingsView(LoginRequiredMixin, FormView):
    template_name = "account_settings.html"
    form_class = UserSettingsForm
    success_url = reverse_lazy("account_settings")

    def form_valid(self, form):
        user_settings, created = UserSettings.objects.get_or_create(owner=self.request.user)
        user_settings.currency = form.cleaned_data['currency']
        user_settings.language = form.cleaned_data['language']
        user_settings.timezone = form.cleaned_data['timezone']
        user_settings.numeric_format = form.cleaned_data['numeric_format']
        user_settings.save()

        messages.success(self.request, "Settings updated successfully!")
        return super().form_valid(form)

    def form_invalid(self, form):
        messages.error(self.request, "There was an error updating your settings.")
        return super().form_invalid(form)


class UpdatePersonalInfoView(LoginRequiredMixin, FormView):
    template_name = "account_settings.html"
    success_url = reverse_lazy("account_settings")  # Redirect URL after successful update

    def get(self, request, *args, **kwargs):
        """Handle GET request to prepopulate forms."""
        user = request.user
        user_settings, created = UserSettings.objects.get_or_create(owner=user)

        user_form = UserForm(instance=user)
        settings_form = UserSettingsForm(instance=user_settings)

        return self.render_to_response(self.get_context_data(
            user_form=user_form,
            settings_form=settings_form
        ))

    def post(self, request, *args, **kwargs):
        """Handle POST request to update data."""
        user = request.user
        user_settings, created = UserSettings.objects.get_or_create(owner=user)

        user_form = UserForm(request.POST, instance=user)
        settings_form = UserSettingsForm(request.POST, request.FILES, instance=user_settings)

        if user_form.is_valid() and settings_form.is_valid():
            user_form.save()
            settings_form.save()
            messages.success(request, "Your personal information has been updated successfully!")
            return self.form_valid(user_form)
        else:
            messages.error(request, "There was an error updating your information.")
            return self.form_invalid(user_form)

    def get_context_data(self, **kwargs):
        """Add the forms to the template context."""
        context = super().get_context_data(**kwargs)
        context.update(kwargs)  # Add user_form and settings_form
        return context
