import logging

from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView

from billova_app.models import UserSettings

logger = logging.getLogger(__name__)


class AccountOverviewView(LoginRequiredMixin, TemplateView):
    template_name = "Billova/account_overview.html"

    def get_context_data(self, **kwargs):
        """Get context data for account overview."""
        logger.info("Loading account overview for user: %s", self.request.user.username)
        context = super().get_context_data(**kwargs)
        user = self.request.user

        try:
            user_settings = UserSettings.objects.get(owner=user)
            context['user_settings'] = user_settings
            logger.info("User settings retrieved successfully for user: %s", user.username)
        except UserSettings.DoesNotExist:
            context['user_settings'] = None
            logger.warning("User settings not found for user: %s", user.username)
            messages.warning(self.request, "No settings found for your account. Please configure them in settings.")
        except Exception as e:
            logger.error("An unexpected error occurred while loading account overview for user %s: %s", user.username,
                         e, exc_info=True)
            messages.error(self.request,
                           "An error occurred while loading your account overview. Please try again later.")

        return context
