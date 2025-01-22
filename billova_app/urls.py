from django.urls import path, include
from rest_framework.routers import DefaultRouter

from billova_app import api_views
from .views import homepage, signup
from .views.account.account_deletion import AccountDeletionView
from .views.account.account_overview import AccountOverviewView
from .views.account.account_settings import AccountSettingsView, UpdateUserSettingsView, UpdatePersonalInfoView, \
    UpdateProfilePictureView, UpdateEmailView
from .views.categories import CategoriesView
from .views.expenses import ExpensesOverview, MonthlyExpenses
from .views.login import CustomLoginView
from .views.logout import CustomLogoutView
from .views.password_reset import PwResetView

router = DefaultRouter()
router.register(r'expenses', api_views.ExpenseViewSet, basename='expense')
router.register(r'categories', api_views.CategoryViewSet, basename='category')
router.register(r'usersettings', api_views.UserSettingsViewSet, basename='usersettings')
router.register(r'monthlyExpenses', api_views.MonthlyExpensesViewSet, basename='monthlyExpenses')

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
    path("account/settings/update/", UpdateUserSettingsView.as_view(), name="update_user_settings"),

    path('account/update/profile-picture/', UpdateProfilePictureView.as_view(), name='update_profile_picture'),
    path('account/update/email/', UpdateEmailView.as_view(), name='update_email'),

    path('account/delete/', AccountDeletionView.as_view(), name='delete_account'),

    # Authentication

    path('login/', CustomLoginView.as_view(), name='login'),  # Logout page
    path('logout/', CustomLogoutView.as_view(), name='logout'),
    path('password_reset/', PwResetView.as_view(), name='password_reset'),
    path('sigup', signup.SignupView.as_view(), name='signup'),

    # other urls
    path('categories/', CategoriesView.as_view(), name='categories'),

    # Expenses
    path('expensesOverview', ExpensesOverview.as_view(), name='expensesOverview'),
    path('monthlyExpenses', MonthlyExpenses.as_view(), name='monthlyExpenses')

]
