from django.views.generic import TemplateView

from billova_app.models import Expense


class ExpensesOverview(TemplateView):
    template_name = "Billova/expenses_overview.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['expenses'] = Expense.objects.select_related('owner').all()
        return context