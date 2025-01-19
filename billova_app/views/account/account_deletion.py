import logging

from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.views.generic.edit import FormView

from billova_app.forms import AccountDeleteForm

logger = logging.getLogger(__name__)


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
