import logging

from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.views import View

User = get_user_model()

# Set up logging
logger = logging.getLogger(__name__)


class SignupForm(forms.Form):
    username = forms.CharField(max_length=150, required=True)
    email = forms.EmailField(max_length=254, required=True)
    password1 = forms.CharField(widget=forms.PasswordInput, required=True)
    password2 = forms.CharField(widget=forms.PasswordInput, required=True)


class SignupView(View):
    def get(self, request):
        form = SignupForm()
        return render(request, 'signup.html', {'form': form})

    def post(self, request):
        form = SignupForm(request.POST)
        if form.is_valid():
            try:
                # Check if passwords match
                if form.cleaned_data['password1'] != form.cleaned_data['password2']:
                    logger.error("Passwords do not match for user: %s", form.cleaned_data['username'])
                    form.add_error('password2', "Passwords do not match.")
                    return render(request, 'signup.html', {'form': form})

                # Check if username already exists
                if User.objects.filter(username=form.cleaned_data['username']).exists():
                    logger.error("Username already exists: %s", form.cleaned_data['username'])
                    form.add_error('username', "Username already exists.")
                    return render(request, 'signup.html', {'form': form})

                # Check if email already exists
                if User.objects.filter(email=form.cleaned_data['email']).exists():
                    logger.error("Email already registered: %s", form.cleaned_data['email'])
                    form.add_error('email', "Email already registered.")
                    return render(request, 'signup.html', {'form': form})

                # Create the user
                user = User.objects.create_user(
                    username=form.cleaned_data['username'],
                    email=form.cleaned_data['email'],
                    password=form.cleaned_data['password1']
                )
                user.save()
                logger.info("New user created successfully: %s", user.username)

                # Specify the backend explicitly
                backend = 'django.contrib.auth.backends.ModelBackend'
                user.backend = backend

                # Log in the user
                login(request, user, backend=backend)
                logger.info("User logged in successfully: %s", user.username)

                return redirect('home')  # Redirect to the homepage

            except Exception as e:
                # Log unexpected errors
                logger.exception("Unexpected error during user signup: %s", str(e))
                form.add_error(None, "An unexpected error occurred. Please try again.")
                return render(request, 'signup.html', {'form': form})
        else:
            logger.warning("Signup form validation failed.")
            return render(request, 'signup.html', {'form': form})
