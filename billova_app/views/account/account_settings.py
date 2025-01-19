import logging

from babel import Locale
from babel.dates import get_timezone_location
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

        # Get user locale, default to 'en'
        user_locale = Locale.parse("en")  # Replace with user-preferred locale dynamically

        # Use Babel to get human-readable timezone locations
        timezone_names = {tz: get_timezone_location(tz, locale=user_locale) for tz in popular_timezones}

        # Add the choices to context
        context["timezone_choices"] = timezone_names.items()

        return context


@method_decorator(login_required, name='dispatch')
class UpdateUserSettingsView(FormView):
    template_name = 'Billova/account_settings.html'

    def post(self, request, *args, **kwargs):
        profile = request.user.profile

        # Update settings
        profile.language = request.POST.get('language')
        profile.currency = request.POST.get('currency')
        profile.timezone = request.POST.get('timezone')
        profile.numeric_format = request.POST.get('numeric_format')

        # Save changes
        profile.save()

        messages.success(request, "User settings updated successfully!")
        return redirect('account_settings')


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
