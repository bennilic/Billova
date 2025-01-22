from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView


class CategoriesView(LoginRequiredMixin, TemplateView):
    template_name = 'Billova/categories.html'
