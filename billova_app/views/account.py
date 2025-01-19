import logging

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.views.generic.edit import FormView
from pytz import all_timezones

from billova_app.forms import AccountDeleteForm, UserSettingsForm, UserForm
from billova_app.models import UserSettings

logger = logging.getLogger(__name__)


class AccountOverviewView(LoginRequiredMixin, TemplateView):
    template_name = "account_overview.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        try:
            user_settings = UserSettings.objects.get(owner=user)
            context['user_settings'] = user_settings
        except UserSettings.DoesNotExist:
            context['user_settings'] = None

        # Optionally also fetch the profile
        profile = getattr(user, 'profile', None)
        context.update({
            'user': user,
            'email': user.email,
            'currency': profile.currency if profile else "USD",
        })
        return context


class AccountSettingsView(LoginRequiredMixin, FormView):
    template_name = "account_settings.html"
    form_class = UserSettingsForm
    success_url = reverse_lazy("account_settings")

    def get_initial(self):
        """Populate the form with the user's current settings."""
        initial = super().get_initial()
        user_settings, created = UserSettings.objects.get_or_create(owner=self.request.user)
        initial.update({
            'currency': user_settings.currency,
            'language': user_settings.language,
            'timezone': user_settings.timezone,
            'numeric_format': user_settings.numeric_format,
        })
        return initial

    def form_valid(self, form):
        """Save the updated user settings."""
        user_settings, created = UserSettings.objects.get_or_create(owner=self.request.user)
        for field in form.cleaned_data:
            setattr(user_settings, field, form.cleaned_data[field])
        user_settings.save()
        messages.success(self.request, "Your settings have been updated successfully!")
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        """Provide additional context for the settings page."""
        context = super().get_context_data(**kwargs)
        context.update({
            'currencies': UserSettings.objects.values_list('currency', flat=True).distinct(),
            'timezones': all_timezones,
            'languages': UserSettings.LANGUAGE_CHOICES,
            'numeric_formats': UserSettings.NUMERIC_FORMAT_CHOICES,
        })
        return context


@method_decorator(login_required, name='dispatch')
class UpdateUserSettingsView(FormView):
    template_name = 'account_settings.html'

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


class AccountDeletionView(LoginRequiredMixin, FormView):
    template_name = 'components/delete_user_modal.html'
    form_class = AccountDeleteForm
    success_url = reverse_lazy('home')

    def get_form_kwargs(self):
        """Pass additional arguments to the form."""
        kwargs = super().get_form_kwargs()
        try:
            username = self.request.user.username
            kwargs['username'] = username  # Pass the username to the form
            logger.info(f"Passing username {username} to AccountDeleteForm.")
        except AttributeError as e:
            logger.error(f"Error fetching username for user: {str(e)}")
        return kwargs

    def form_valid(self, form):
        """Handle valid form submission."""
        user = self.request.user
        username_confirmation = form.cleaned_data['username_confirmation']

        try:
            if user.username == username_confirmation:
                logger.info(f"User {user.username} confirmed deletion.")
                user.delete()
                messages.success(self.request, f"Goodbye {user.username}, your account has been deleted.")
                logger.info(f"User {user.username} account successfully deleted.")
                return super().form_valid(form)
            else:
                logger.warning(f"User {user.username} provided incorrect username for confirmation.")
                messages.error(self.request, "The username does not match.")
                return self.form_invalid(form)
        except Exception as e:
            logger.exception(f"An error occurred while attempting to delete account for user {user.username}: {e}")
            messages.error(self.request, "An unexpected error occurred. Please try again.")
            return self.form_invalid(form)

    def form_invalid(self, form):
        """Handle invalid form submission."""
        logger.warning(f"Form validation failed for user {self.request.user.username}. Errors: {form.errors}")
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
