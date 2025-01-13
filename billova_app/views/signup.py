from django import forms
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.views import View


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
            username = form.cleaned_data.get('username')
            email = form.cleaned_data.get('email')
            # Handle user creation logic here (e.g., save to the database)
            # Assuming a custom user model, adjust accordingly.
            user = User.objects.create_user(username=username, email=email, password=form.cleaned_data.get('password1'))
            login(request, user)  # Log the user in after signup
            return redirect('home')  # Redirect to the homepage
        return render(request, 'signup.html', {'form': form})
