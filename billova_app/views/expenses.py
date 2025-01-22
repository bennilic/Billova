import logging

from django.contrib import messages
from django.views.generic import TemplateView

from billova_app.models import UserSettings

logger = logging.getLogger(__name__)


class ExpensesOverview(TemplateView):
    template_name = "Billova/expenses_overview.html"

    def perform_create(self, serializer):
        try:
            logger.info("Starting expense creation.")

            # Retrieve submitted currency from the form data
            submitted_currency = self.request.data.get('expenseCurrency')
            valid_currencies = ["EUR", "USD", "GBP", "JPY", "TRY", "RON"]  # Define valid currencies

            # Validate the submitted currency
            if submitted_currency and submitted_currency in valid_currencies:
                currency = submitted_currency
                logger.info(f"Using submitted currency: {currency}")
            else:
                # Fallback to user settings if no valid currency is submitted
                user_settings = UserSettings.objects.filter(owner=self.request.user).first()
                currency = user_settings.currency if user_settings else "EUR"  # Default to EUR
                logger.warning(f"Invalid or missing currency submitted. Falling back to: {currency}")

            # Save the expense with the correct currency
            serializer.save(owner=self.request.user, currency=currency)
            logger.info("Expense created successfully.")
            logger.info(f"Currency set to {currency} for user {self.request.user.username}")

        except Exception as e:
            logger.error(f"Error while creating expense: {str(e)}", exc_info=True)
            messages.error(self.request, "An error occurred while creating the expense. Please try again.")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        try:
            # Retrieve user settings
            user_settings = UserSettings.objects.filter(owner=self.request.user).first()
            context['user_settings'] = user_settings
            if user_settings:
                logger.info("User settings retrieved successfully.")
            else:
                logger.warning("No user settings found for the user.")

            # Add a list of currencies to the context
            context['currencies'] = [
                {"code": "EUR", "name": "Euro"},
                {"code": "USD", "name": "US Dollar"},
                {"code": "GBP", "name": "British Pound"},
                {"code": "JPY", "name": "Japanese Yen"},
                {"code": "TRY", "name": "Turkish Lira"},
                {"code": "RON", "name": "Romanian Leu"},
            ]
            logger.info("Currencies list added to context.")

        except Exception as e:
            logger.error(f"Error while retrieving context data: {str(e)}", exc_info=True)
            messages.error(self.request, "An error occurred while loading the page. Please try again later.")

        return context

class MonthlyExpenses(TemplateView):
    template_name = "Billova/monthly_expenses.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        try:
            # Example of adding context with logging
            logger.info("Retrieving monthly expenses data.")
            # (Add actual logic here as needed for your use case.)
        except Exception as e:
            logger.error(f"Error while retrieving monthly expenses: {str(e)}", exc_info=True)
            messages.error(self.request, "An error occurred while retrieving monthly expenses. Please try again.")

        return context
