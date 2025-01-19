import logging

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.views.generic.edit import FormView

from billova_app.forms import UserSettingsForm, UserForm
from billova_app.models import UserSettings

logger = logging.getLogger(__name__)


class AccountSettingsView(LoginRequiredMixin, TemplateView):
    template_name = "account_settings.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Define popular timezones
        popular_timezones = [
            "UTC", "Etc/GMT", "Europe/London", "Europe/Berlin", "Europe/Vienna",
            "America/New_York", "Asia/Tokyo", "Asia/Dubai"
        ]

        # Define popular languages
        popular_languages = [
            ("en", "English"),
            ("de", "German"),
            ("fr", "French"),
            ("es", "Spanish"),
            ("it", "Italian"),
            ("ro", "Romanian"),
            ("tr", "Turkish"),
        ]

        # Define numeric formats
        numeric_formats = [
            ('AT', 'Austrian'),
            ('DE', 'German'),
            ('CH', 'Swiss'),
            ('US', 'American'),
            ('UK', 'British'),
        ]

        # Add the choices to context
        context["timezone_choices"] = popular_timezones
        context["language_choices"] = popular_languages
        context["numeric_format_choices"] = numeric_formats
        context["currency_choices"] = ["EUR", "GBP", "USD", "CHF", "JPY", "RON", "TRY"]

        return context


@method_decorator(login_required, name='dispatch')
class UpdateUserSettingsView(FormView):
    template_name = "account_settings.html"
    success_url = reverse_lazy("account_settings")

    def post(self, request, *args, **kwargs):
        user_settings, created = UserSettings.objects.get_or_create(owner=request.user)

        # Update fields
        user_settings.timezone = request.POST.get("timezone")
        user_settings.language = request.POST.get("language")
        user_settings.numeric_format = request.POST.get("numeric_format")

        # Save changes
        user_settings.save()

        messages.success(request, "Settings updated successfully!")
        return redirect(self.success_url)


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
