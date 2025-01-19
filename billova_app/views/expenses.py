from django.views.generic import TemplateView


class ExpensesOverview(TemplateView):
    template_name = "Billova/expenses_overview.html"