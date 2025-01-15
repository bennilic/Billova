from django.db.models import Q
from django.views.generic import TemplateView
from django.contrib.auth.models import User

from billova_app.models import Expense, Category


class ExpensesOverview(TemplateView):
    template_name = "Billova/expenses_overview.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['expenses'] = Expense.objects.select_related('owner').all()
        global_user = User.objects.get(username='global')
        context['categories'] = Category.objects.filter(
            Q(owner=self.request.user) | Q(owner=global_user)
        )
        return context