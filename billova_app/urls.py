from django.urls import path, include
from rest_framework.routers import DefaultRouter

from billova_app import api_views
from .views import homepage, settings, signup
from .views.account import AccountOverviewView, AccountDeletionView
from .views.account import AccountSettingsView
from .views.account import UpdateUserSettingsView, UpdatePersonalInfoView
from .views.categories import CategoriesView
from .views.expenses import ExpensesOverview
from .views.login import CustomLoginView
from .views.logout import CustomLogoutView
from .views.password_reset import PwResetView

router = DefaultRouter()
router.register(r'expenses', api_views.ExpenseViewSet, basename='expense')
router.register(r'categories', api_views.CategoryViewSet, basename='category')
router.register(r'usersettings', api_views.UserSettingsViewSet, basename='usersettings')

urlpatterns = [

    # API
    path('api/v1/', include(router.urls), ),
    path('api/auth/', include('rest_framework.urls')),

    # Home
    path('', homepage.HomePageView.as_view(), name='index'),
    path('home', homepage.HomePageView.as_view(), name='home'),
    path('index', homepage.HomePageView.as_view(), name='index'),

    # Account

    path('account/overview/', AccountOverviewView.as_view(), name='account_overview'),
    path('account/settings/', AccountSettingsView.as_view(), name='account_settings'),
    path('account/settings/update_personal_info/', UpdatePersonalInfoView.as_view(), name='update_personal_info'),
    path('account/settings/update_user_settings/', UpdateUserSettingsView.as_view(), name='update_user_settings'),
    path('account/delete', AccountDeletionView.as_view(), name='account_delete'),

    # Authentication

    path('login/', CustomLoginView.as_view(), name='login'),  # Logout page
    path('logout/', CustomLogoutView.as_view(), name='logout'),
    path('password_reset/', PwResetView.as_view(), name='password_reset'),
    path('sigup', signup.SignupView.as_view(), name='signup'),

    # other urls
    path('categories/', CategoriesView.as_view(), name='categories'),
    path('settings', settings.SettingsView.as_view(), name='settings'),

    path('expensesOverview', ExpensesOverview.as_view(), name='expensesOverview')

]
