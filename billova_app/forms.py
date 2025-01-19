import logging

from django import forms
from django.contrib.auth.models import User

from billova_app.models import UserSettings

logger = logging.getLogger(__name__)


# User Update
class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['email']


class UserSettingsForm(forms.ModelForm):
    class Meta:
        model = UserSettings
        fields = ['currency', 'language', 'timezone', 'numeric_format', 'profile_picture']


# Delete Account
class AccountDeleteForm(forms.Form):
    username_confirmation = forms.CharField(
        label="Confirm Username",
        max_length=150,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
        }),
        required=True
    )

    def __init__(self, *args, **kwargs):
        # Extract the username from the kwargs
        username = kwargs.pop('username', None)
        super().__init__(*args, **kwargs)
        # Dynamically set the placeholder
        if username:
            self.fields['username_confirmation'].widget.attrs.update({
                'placeholder': f'Enter "{username}" to confirm deletion'
            })
            logger.debug(f"Placeholder for username_confirmation set to: Enter '{username}' to confirm deletion")
        else:
            logger.warning("Username not provided for AccountDeleteForm")


class ProfilePictureForm(forms.ModelForm):
    class Meta:
        model = UserSettings  # Use UserSettings model
        fields = ['profile_picture']  # Only include the profile_picture field


class UpdateEmailForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['email']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already in use by another account.")
        return email
