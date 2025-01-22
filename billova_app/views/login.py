import logging

from django import forms
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.views import LoginView

# Set up logging
logger = logging.getLogger(__name__)
User = get_user_model()


class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        try:
            user = User.objects.get(email=username) if '@' in username else User.objects.get(username=username)
            logger.info(f"Found user: {user}")
        except User.DoesNotExist:
            logger.warning(f"User not found: {username}")
            return None
        else:
            if user.check_password(password) and self.user_can_authenticate(user):
                logger.info(f"User authenticated: {user}")
                return user
            logger.warning(f"Authentication failed for user: {username}")
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

        logger.info("Attempting login for username/email: %s", username)

        # Authenticate user
        self.user = authenticate(self.request, username=username, password=password)
        if not self.user:
            logger.error("Invalid login credentials for username/email: %s", username)
            raise forms.ValidationError("Invalid login credentials")
        if not self.user.is_active:
            logger.error("Inactive account for username/email: %s", username)
            raise forms.ValidationError("This account is inactive")

        logger.info("Successful login for username/email: %s", username)
        return cleaned_data

    def get_user(self):
        return self.user


from django.contrib import messages


class CustomLoginView(LoginView):
    template_name = 'login.html'
    authentication_form = CustomLoginForm
    redirect_authenticated_user = True
    next_page = '/expensesOverview'  # Redirect after successful login

    def form_invalid(self, form):
        """Log errors when login fails."""
        logger.warning("Login failed for username/email: %s", form.cleaned_data.get('username', 'Unknown'))
        return super().form_invalid(form)

    def form_valid(self, form):
        """Log successful login attempts."""
        logger.info("Login successful for user: %s", form.get_user())

        # Add a success message
        messages.success(self.request, f"You have successfully logged in, {form.get_user()}")
        return super().form_valid(form)
