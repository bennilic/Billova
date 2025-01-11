from django.views.generic import TemplateView
from django.contrib.auth.views import LoginView
# Custom template for login
class LoginView(TemplateView):
    template_name = "login.html"