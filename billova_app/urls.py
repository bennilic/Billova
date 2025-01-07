from django.contrib import admin
from django.urls import path
from .views import homepage

urlpatterns = [
    path('admin/', admin.site.urls),
    path('home', homepage.Home_page_view.as_view(), name='home'),
    path('index', homepage.Home_page_view.as_view(), name='index'),
    path('', homepage.Home_page_view.as_view(), name='index')
]
