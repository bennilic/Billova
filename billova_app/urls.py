from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path

from .views import homepage, settings, signup
from .views.account import AccountOverviewView
from .views.account import AccountSettingsView
from .views.categories import CategoriesView
from .views.login import CustomLoginView
from .views.password_reset import PwResetView
from .views.expenses import ExpensesOverview

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', homepage.HomePageView.as_view(), name='index'),
    path('home', homepage.HomePageView.as_view(), name='home'),
    path('index', homepage.HomePageView.as_view(), name='index'),

    path('account/overview/', AccountOverviewView.as_view(), name='account_overview'),
    path('account/settings/', AccountSettingsView.as_view(), name='account_settings'),
    path('categories/', CategoriesView.as_view(), name='categories'),
    path('settings', settings.SettingsView.as_view(), name='settings'),
    path('login/', CustomLoginView.as_view(), name='login'),  # Logout page
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('password_reset/', PwResetView.as_view(), name='password_reset'),
    path('sigup', signup.SignupView.as_view(), name='signup'),
    path('expensesOverview', ExpensesOverview.as_view(), name='expensesOverview')
]
