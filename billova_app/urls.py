from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from billova_app import views
from .views import homepage, settings, login, signup

router = DefaultRouter()
router.register(r'expenses', views.Expense, basename='expense')
router.register(r'categories', views.Category, basename='category')
router.register(r'user_settings', views.UserSettings, basename='user_settings')

urlpatterns = [
    path('api/v1/', include(router.urls)),
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
