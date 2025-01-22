import logging

from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LogoutView
from django.http import HttpResponseRedirect
from django.urls import reverse_lazy

# Set up a logger
logger = logging.getLogger(__name__)


class CustomLogoutView(LoginRequiredMixin, LogoutView):
    """Custom logout view with logging, exception handling, and redirection."""
    next_page = reverse_lazy('home')  # Redirect to home page after logout

    def dispatch(self, request, *args, **kwargs):
        username = request.user.username
        try:
            # Log the user logout attempt
            logger.debug(f"User '{username}' is logging out.")

            # Add a success message
            messages.success(request, f"You have successfully logged out, {username}!")

            # Proceed with the standard logout process
            response = super().dispatch(request, *args, **kwargs)

            # Confirm successful logout in the logs
            logger.info(f"User '{username}' successfully logged out.")
            return response

        except Exception as e:
            # Log the exception
            logger.error(f"An error occurred during logout: {str(e)}")

            # Add an error message for the user
            messages.error(request, "An error occurred while logging you out. Please try again.")

            # Redirect the user to the home page or an error page
            return HttpResponseRedirect(reverse_lazy('home'))
