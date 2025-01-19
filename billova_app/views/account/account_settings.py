import logging

from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.urls import reverse_lazy
from django.views.generic import TemplateView, UpdateView
from django.views.generic.edit import FormView
from pytz import all_timezones

from billova_app.forms import UserSettingsForm, UserForm, ProfilePictureForm, EmailUpdateForm
from billova_app.models import UserSettings
from billova_app.utils.settings_utils import get_currency_choices

logger = logging.getLogger(__name__)


class AccountSettingsView(LoginRequiredMixin, TemplateView):
    template_name = "account_settings.html"

    def get_context_data(self, **kwargs):
        try:
            # Initialize context data
            context = super().get_context_data(**kwargs)
            user_settings = get_object_or_404(UserSettings, owner=self.request.user)

            # Define popular languages and numeric formats
            popular_languages = [
                ("en", "English"), ("de", "German"), ("fr", "French"),
                ("es", "Spanish"), ("it", "Italian"), ("ro", "Romanian"), ("tr", "Turkish"),
            ]
            numeric_formats = [
                ("AT", "Austrian"), ("DE", "German"), ("CH", "Swiss"),
                ("US", "American"), ("UK", "British"),
            ]

            # Generate currency choices
            CURRENCY_CHOICES = get_currency_choices(popular_languages)

            # Add current settings and choices to the context
            context.update({
                "timezone_choices": [(tz, tz) for tz in all_timezones],
                "language_choices": popular_languages,
                "numeric_format_choices": numeric_formats,
                "currency_choices": CURRENCY_CHOICES,
                "current_settings": {
                    "timezone": user_settings.timezone,
                    "language": user_settings.language,
                    "numeric_format": user_settings.numeric_format,
                    "currency": user_settings.currency,
                },
            })

            logger.info(f"Account settings loaded successfully for user {self.request.user}.")
            return context

        except UserSettings.DoesNotExist:
            logger.error(f"UserSettings not found for user {self.request.user}. Creating default settings.")
            messages.error(self.request, "Your settings could not be retrieved. Default values will be used.")
            context["current_settings"] = {
                "timezone": "UTC",
                "language": "en",
                "numeric_format": "US",
                "currency": "USD",
            }
            return context

        except Exception as e:
            logger.error(f"An error occurred while loading account settings for user {self.request.user}: {e}",
                         exc_info=True)
            messages.error(self.request, "An unexpected error occurred while loading your settings. Please try again.")
            context = super().get_context_data(**kwargs)
            return context


class UpdateUserSettingsView(LoginRequiredMixin, FormView):
    template_name = "account_settings.html"
    form_class = UserSettingsForm
    success_url = reverse_lazy("account_settings")

    def form_valid(self, form):
        try:
            user_settings, created = UserSettings.objects.get_or_create(owner=self.request.user)

            # Update the settings with the cleaned form data
            user_settings.currency = form.cleaned_data['currency']
            user_settings.language = form.cleaned_data['language']
            user_settings.timezone = form.cleaned_data['timezone']
            user_settings.numeric_format = form.cleaned_data['numeric_format']
            user_settings.save()

            # Log and inform the user of success
            if created:
                logger.info(f"New settings created for user {self.request.user}.")
                messages.success(self.request, "Your settings have been created successfully!")
            else:
                logger.info(f"Settings updated for user {self.request.user}.")
                messages.success(self.request, "Your settings have been updated successfully!")

            return super().form_valid(form)
        except Exception as e:
            # Log the error and inform the user
            logger.error(f"Error updating settings for user {self.request.user}: {e}", exc_info=True)
            messages.error(self.request, "An unexpected error occurred while updating your settings. Please try again.")
            return self.form_invalid(form)

    def form_invalid(self, form):
        # Log form validation errors
        logger.warning(f"Form validation failed for user {self.request.user}. Errors: {form.errors}")
        messages.error(self.request, "There were errors in the form. Please correct them and try again.")
        return super().form_invalid(form)


class UpdatePersonalInfoView(LoginRequiredMixin, FormView):
    template_name = "account_settings.html"
    success_url = reverse_lazy("account_settings")  # Redirect URL after a successful update

    def get(self, request, *args, **kwargs):
        """Handle GET request to prepopulate forms."""
        try:
            user = request.user
            user_settings, created = UserSettings.objects.get_or_create(owner=user)

            # Initialize forms with existing data
            user_form = UserForm(instance=user)
            settings_form = UserSettingsForm(instance=user_settings)

            if created:
                logger.info(f"New UserSettings created for user: {user}.")
                messages.info(request, "Default settings have been created for your account.")

            return self.render_to_response(self.get_context_data(
                user_form=user_form,
                settings_form=settings_form
            ))
        except Exception as e:
            logger.error(f"Error while processing GET request for {request.user}: {e}", exc_info=True)
            messages.error(request, "An unexpected error occurred while loading your information.")
            return self.render_to_response(self.get_context_data(
                user_form=None,
                settings_form=None
            ))

    def post(self, request, *args, **kwargs):
        """Handle POST request to update data."""
        try:
            user = request.user
            user_settings, created = UserSettings.objects.get_or_create(owner=user)

            # Process submitted forms
            user_form = UserForm(request.POST, instance=user)
            settings_form = UserSettingsForm(request.POST, request.FILES, instance=user_settings)

            if user_form.is_valid() and settings_form.is_valid():
                user_form.save()
                settings_form.save()

                logger.info(f"User information updated successfully for {user}.")
                messages.success(request, "Your personal information has been updated successfully!")
                return self.form_valid(user_form)
            else:
                logger.warning(f"Form validation failed for user {user}. Errors: "
                               f"UserForm: {user_form.errors}, SettingsForm: {settings_form.errors}")
                messages.error(request, "There were errors in your forms. Please correct them and try again.")
                return self.form_invalid(user_form)
        except Exception as e:
            logger.error(f"Error while processing POST request for {request.user}: {e}", exc_info=True)
            messages.error(request, "An unexpected error occurred while updating your information. Please try again.")
            return self.render_to_response(self.get_context_data(
                user_form=None,
                settings_form=None
            ))

    def get_context_data(self, **kwargs):
        """Add the forms to the template context."""
        context = super().get_context_data(**kwargs)
        context.update(kwargs)  # Add user_form and settings_form
        return context


class UpdateProfilePictureView(LoginRequiredMixin, UpdateView):
    model = UserSettings
    form_class = ProfilePictureForm
    template_name = 'account_settings.html'
    success_url = reverse_lazy('account_settings')

    def get_object(self, queryset=None):
        return get_object_or_404(UserSettings, owner=self.request.user)

    def form_valid(self, form):
        form.save()  # Ensure the form is saved
        messages.success(self.request, "Profile picture updated successfully.")
        logger.info(f"Profile picture updated successfully for user {self.request.user}.")
        return super().form_valid(form)

    def form_invalid(self, form):
        logger.warning(f"Profile picture form submission failed for user {self.request.user}. Errors: {form.errors}")
        messages.error(self.request,
                       "There was an error with your submission. Please correct the errors and try again.")
        return super().form_invalid(form)


class UpdateEmailView(LoginRequiredMixin, UpdateView):
    model = User
    form_class = EmailUpdateForm
    template_name = 'account_settings.html'
    success_url = reverse_lazy('account_settings')  # Replace with your desired redirect URL

    def form_valid(self, form):
        messages.success(self.request, "Email updated successfully.")
        return super().form_valid(form)
