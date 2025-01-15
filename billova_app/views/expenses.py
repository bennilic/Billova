from django.views.generic import TemplateView

from billova_app.models import Expense


class ExpensesOverview(TemplateView):
    template_name = "Billova/expenses_overview.html"