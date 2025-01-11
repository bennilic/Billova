from django.views.generic import TemplateView

class AccountOverviewView(TemplateView):
    template_name = 'Billova/account_overview.html'

class AccountSettingsView(TemplateView):
        template_name = 'Billova/account_settings.html'