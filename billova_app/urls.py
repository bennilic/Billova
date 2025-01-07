from django.contrib import admin
from django.urls import path
from .views import homepage, settings, login, signup

urlpatterns = [
    path('admin/', admin.site.urls),
    path('home', homepage.HomePageView.as_view(), name='home'),
    path('index', homepage.HomePageView.as_view(), name='index'),
    path('settings', settings.SettingsView.as_view(), name='settings'),
    path('login', login.LoginView.as_view(), name='login'),
    path('sigup', signup.SignupView.as_view(), name='signup'),
    path('', homepage.HomePageView.as_view(), name='index')
]
