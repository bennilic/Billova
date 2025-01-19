from django.views.generic import TemplateView


class ExpensesOverview(TemplateView):
    template_name = "Billova/expenses_overview.html"


class MonthlyExpenses(TemplateView):
    template_name = "Billova/monthly_expenses.html"