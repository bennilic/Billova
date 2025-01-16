import logging

from django.contrib import messages
from django.shortcuts import redirect
from django.shortcuts import render
from django.views import View
from django.views.generic import TemplateView
from pytz import all_timezones

from billova_app.utils.settings_utils import get_current_currencies

logger = logging.getLogger(__name__)


class AccountOverviewView(TemplateView):
    template_name = 'Billova/account_overview.html'

    def get(self, request, *args, **kwargs):
        # Log user access to the overview page
        try:
            if not request.user.is_authenticated:
                # Log unauthorized access attempt
                logger.warning("Unauthorized access attempt to Account Overview.")
                messages.error(request, "You must be logged in to view your account overview.")
                return redirect('login')

            user = request.user
            profile = getattr(user, 'profile', None)

            # Build context data with fallback values
            context = {
                'user': user,
                'email': user.email,
                'name': profile.name if profile else "N/A",
                'profile_picture': profile.profile_picture.url if profile and profile.profile_picture else None,
                # 'timezone': user.timezone if hasattr(user, 'timezone') else "UTC",
                'currency': profile.currency if profile and hasattr(profile, 'currency') else "USD",
            }

            # Log successful access
            logger.info(f"User {user.username} accessed the Account Overview page.")
            return render(request, self.template_name, context)

        except Exception as e:
            # Log unexpected exceptions
            logger.exception(
                f"An error occurred while rendering the Account Overview for user {request.user.username if request.user.is_authenticated else 'Anonymous'}: {e}")
            messages.error(request, "An error occurred while loading your account overview. Please try again later.")
            return redirect('home')  # Redirect to a safe default page


class AccountSettingsView(View):
    def get(self, request):
        # Log the user accessing the settings page
        if request.user.is_authenticated:
            logger.info(f"User {request.user.username} accessed the account settings.")
        else:
            logger.warning("Anonymous user tried to access account settings.")

        # Prepopulate the form with current user settings
        return render(request, 'account_settings.html', {
            'currencies': get_current_currencies(),
            'timezones': all_timezones,
            # 'current_timezone': request.user.timezone if request.user.is_authenticated else 'UTC',
            'current_currency': request.user.profile.currency if hasattr(request.user, 'profile') else 'USD',
        })

    def post(self, request):
        # Log the form submission attempt
        if request.user.is_authenticated:
            logger.info(f"User {request.user.username} is attempting to update account settings.")
        else:
            logger.warning("Anonymous user tried to submit account settings.")

        # Handle the form submission
        try:
            timezone = request.POST.get('timezone')
            currency = request.POST.get('currency')

            if request.user.is_authenticated:
                # Validate and save the timezone
                if timezone in all_timezones:
                    # request.user.timezone = timezone
                    logger.info(f"User {request.user.username} updated timezone to {timezone}.")
                else:
                    logger.error(f"Invalid timezone selected by {request.user.username}: {timezone}")
                    messages.error(request, "Invalid timezone selected")
                    return redirect('account_settings')

                # Validate and save the currency (assuming you have a profile model)
                if hasattr(request.user, 'profile'):
                    request.user.profile.currency = currency
                    request.user.profile.save()
                    logger.info(f"User {request.user.username} updated currency to {currency}.")
                else:
                    logger.error(f"Profile not found for user {request.user.username}.")
                    messages.error(request, "Profile not found to save currency")
                    return redirect('account_settings')

                # Save the user's settings
                request.user.save()
                messages.success(request, "Settings updated successfully!")
                logger.info(f"User {request.user.username} successfully updated settings.")
            else:
                logger.error("Anonymous user attempted to update settings.")
                messages.error(request, "You must be logged in to update settings")
        except Exception as e:
            logger.exception(f"An error occurred while updating settings for {request.user.username}: {e}")
            messages.error(request, "An error occurred while saving your settings")

        return redirect('account_settings')
