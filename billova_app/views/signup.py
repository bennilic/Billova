from django.views.generic import TemplateView
from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login

class SignupView(TemplateView):
    template_name = "signup.html"
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()  # Save the new user
            login(request, user)  # Log the user in after signup
            return redirect('home')  # Redirect to a page (e.g., home)
    else:
        form = UserCreationForm()
    return render(request, 'signup.html', {'form': form})