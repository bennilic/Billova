import logging

from django import forms
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.views.generic.edit import FormView
from pytz import all_timezones

from billova_app.models import UserSettings
from billova_app.utils.settings_utils import get_current_currencies

logger = logging.getLogger(__name__)


class AccountOverviewView(LoginRequiredMixin, TemplateView):
    template_name = "account_overview.html"  # Step 1: Specify your template here

    def get_context_data(self, **kwargs):
        """Provide context data to the template."""
        context = super().get_context_data(**kwargs)
        try:
            user = self.request.user
            profile = getattr(user, 'profile', None)  # Fetch user profile
            context.update({
                'user': user,
                'email': user.email,
                'currency': profile.currency if profile else "USD",
            })
            logger.info(f"User {user.username} accessed the account overview page.")
        except Exception as e:
            logger.exception(f"Error while loading Account Overview for {self.request.user.username}: {e}")
            messages.error(self.request, "An error occurred while loading your account overview.")
            context.update({
                'user': None,
                'error': "Unable to load account details."
            })
        return context


class UserSettingsForm(forms.ModelForm):
    class Meta:
        model = UserSettings
        fields = ['currency', 'language']


@method_decorator(login_required, name='dispatch')
class UpdatePersonalInfoView(FormView):
    template_name = 'account_settings.html'
    success_url = '/account/settings/'  # Update to your desired redirect URL

    def post(self, request, *args, **kwargs):
        user = request.user
        profile = user.profile

        # Update email
        user.email = request.POST.get('email')

        # Update profile picture
        profile_picture = request.FILES.get('profile_picture')
        if profile_picture:
            profile.profile_picture = profile_picture

        # Save updates
        user.save()
        profile.save()

        messages.success(request, "Personal information updated successfully!")
        return redirect('account_settings')


class AccountSettingsView(LoginRequiredMixin, FormView):
    template_name = "account_settings.html"
    form_class = UserSettingsForm
    success_url = reverse_lazy("account_settings")

    def get_initial(self):
        """Populate the form with the user's current settings."""
        initial = super().get_initial()
        profile = getattr(self.request.user, 'profile', None)
        if profile:
            initial.update({
                'currency': profile.currency,
                'language': profile.language,
            })
        return initial

    def form_valid(self, form):
        """Save the updated user settings."""
        try:
            profile = getattr(self.request.user, 'profile', None)
            if profile:
                profile.currency = form.cleaned_data['currency']
                profile.language = form.cleaned_data['language']
                profile.save()
                messages.success(self.request, "Your settings have been updated successfully!")
                logger.info(f"User {self.request.user.username} updated their settings.")
            else:
                messages.error(self.request, "No profile found. Unable to update settings.")
                logger.error(f"No profile found for user {self.request.user.username}.")
        except Exception as e:
            messages.error(self.request, "An error occurred while saving your settings.")
            logger.exception(f"Error saving settings for {self.request.user.username}: {str(e)}")

        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        """Provide additional context for the settings page."""
        context = super().get_context_data(**kwargs)
        context.update({
            'currencies': get_current_currencies(),
            'timezones': all_timezones,
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


class AccountDeleteForm(forms.Form):
    username_confirmation = forms.CharField(
        label="Confirm Username",
        max_length=150,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
        }),
        required=True
    )

    def __init__(self, *args, **kwargs):
        # Extract the username from the kwargs
        username = kwargs.pop('username', None)
        super().__init__(*args, **kwargs)
        # Dynamically set the placeholder
        if username:
            self.fields['username_confirmation'].widget.attrs.update({
                'placeholder': f'Enter "{username}" to confirm deletion'
            })
            logger.debug(f"Placeholder for username_confirmation set to: Enter '{username}' to confirm deletion")
        else:
            logger.warning("Username not provided for AccountDeleteForm")


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
