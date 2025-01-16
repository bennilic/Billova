import os

from django.contrib import messages
from django.shortcuts import redirect
from django.shortcuts import render
from django.views import View
from django.views.generic import TemplateView
from pytz import all_timezones

from billova_app.utils.settings_utils import get_current_currencies


class AccountOverviewView(TemplateView):
    template_name = 'Billova/account_overview.html'

    def post(self, request, *args, **kwargs):
        # Retrieve user profile fields from the POST request
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        profile_picture = request.FILES.get('profile_picture')

        user = request.user  # Get the current user

        # Update fields
        user.email = email
        user.profile.name = name

        if password:
            user.set_password(password)  # Update password securely

        if profile_picture:
            # Save the uploaded profile picture
            if user.profile.profile_picture:
                # Delete the old profile picture
                old_path = user.profile.profile_picture.path
                if os.path.exists(old_path):
                    os.remove(old_path)

            user.profile.profile_picture = profile_picture

        # Save user and profile
        user.save()
        user.profile.save()

        messages.success(request, "Account details updated successfully!")
        return redirect('account_overview')


class AccountSettingsView(View):
    def get(self, request):
        current_currencies = get_current_currencies()
        return render(request, 'account_settings.html', {
            'currencies': current_currencies,
            'timezones': all_timezones
        })
