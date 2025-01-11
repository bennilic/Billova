# views.py
from django.contrib.auth.views import LoginView

class PwResetView(LoginView):
    template_name = 'password_reset.html'