# views.py
from django import forms
from django.contrib.auth import authenticate
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView


class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        try:
            # Check if the username matches either email or username
            user = User.objects.get(email=username) if '@' in username else User.objects.get(username=username)
        except User.DoesNotExist:
            return None
        else:
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        return None

class CustomLoginForm(forms.Form):
    username = forms.CharField(label="Email or Username", max_length=254)
    password = forms.CharField(label="Password", widget=forms.PasswordInput)
    user = None  # Placeholder for the authenticated user

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)  # Extract 'request' if provided
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned_data = super().clean()
        username = cleaned_data.get('username')
        password = cleaned_data.get('password')

        # Authenticate user
        self.user = authenticate(self.request, username=username, password=password)
        if not self.user:
            raise forms.ValidationError("Invalid login credentials")
        return cleaned_data

    def get_user(self):
        return self.user


class CustomLoginView(LoginView):
    template_name = 'login.html'
    authentication_form = CustomLoginForm
    redirect_authenticated_user = True
    next_page = '/'  # Redirect after successful login
