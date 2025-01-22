from django.views.generic import TemplateView

from billova_app.models import UserSettings


class ExpensesOverview(TemplateView):
    template_name = "Billova/expenses_overview.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Retrieve user settings
        user_settings = UserSettings.objects.filter(owner=self.request.user).first()
        context['user_settings'] = user_settings

        # Add a list of currencies to the context
        context['currencies'] = [
            {"code": "EUR", "name": "Euro"},
            {"code": "USD", "name": "US Dollar"},
            {"code": "GBP", "name": "British Pound"},
            {"code": "JPY", "name": "Japanese Yen"},
            {"code": "TRY", "name": "Turkish Lira"},
            {"code": "RON", "name": "Romanian Leu"},
        ]

        return context


class MonthlyExpenses(TemplateView):
    template_name = "Billova/monthly_expenses.html"
