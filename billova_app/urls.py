from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path

from .views import homepage, settings, signup
from .views.account import AccountOverviewView
from .views.account import AccountSettingsView
from .views.login import CustomLoginView
from .views.categories import CategoriesView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', homepage.HomePageView.as_view(), name='index'),
    path('home', homepage.HomePageView.as_view(), name='home'),
    path('index', homepage.HomePageView.as_view(), name='index'),

    path('account/overview/', AccountOverviewView.as_view(), name='account_overview'),
    path('account/settings/', AccountSettingsView.as_view(), name='account_settings'),
    path('categories/', CategoriesView.as_view(), name='catergories'),

    path('settings', settings.SettingsView.as_view(), name='settings'),
    path('login/', CustomLoginView.as_view(), name='login'),  # Logout page
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('sigup', signup.SignupView.as_view(), name='signup'),

]
