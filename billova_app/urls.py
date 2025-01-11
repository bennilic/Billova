from django.contrib import admin
from django.urls import path
from django.contrib.auth import views as auth_views
from .views import homepage, settings, login, signup

urlpatterns = [
    path('admin/', admin.site.urls),
    path('home', homepage.HomePageView.as_view(), name='home'),
    path('index', homepage.HomePageView.as_view(), name='index'),
    path('settings', settings.SettingsView.as_view(), name='settings'),
    path('login', login.LoginView.as_view(), name='login'),
    # Logout page
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('sigup', signup.SignupView.as_view(), name='signup'),
    path('', homepage.HomePageView.as_view(), name='index')
]
