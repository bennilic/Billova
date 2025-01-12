from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from billova_app import api_views
from .views import homepage, settings, login, signup

router = DefaultRouter()
router.register(r'expenses', api_views.ExpenseViewSet, basename='expense')
router.register(r'categories', api_views.CategoryViewSet, basename='category')
router.register(r'usersettings', api_views.UserSettingsViewSet, basename='usersettings')

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/auth/', include('rest_framework.urls')),
]

urlpatterns += [
    path('admin/', admin.site.urls),
    path('home', homepage.HomePageView.as_view(), name='home'),
    path('index', homepage.HomePageView.as_view(), name='index'),
    path('settings', settings.SettingsView.as_view(), name='settings'),
    path('login', login.LoginView.as_view(), name='login'),
    path('sigup', signup.SignupView.as_view(), name='signup'),
    path('', homepage.HomePageView.as_view(), name='index')
]
