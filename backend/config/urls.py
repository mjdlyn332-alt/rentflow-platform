from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import LoginView, MeView, HealthView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", HealthView.as_view()),
    path("api/auth/login", LoginView.as_view()),
    path("api/auth/refresh", TokenRefreshView.as_view()),
    path("api/auth/me", MeView.as_view()),
    path("api/", include("core.urls")),
]
