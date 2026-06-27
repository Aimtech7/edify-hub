from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Horizon LMS & Finance ERP API",
        default_version="v1",
        description="Backend API documentation for the Horizon Deutsch Institute LMS & Finance ERP.",
        contact=openapi.Contact(email="admin@deutschakademie.co.ke"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # Swagger & OpenAPI Docs
    path("swagger<format>/", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),

    # Application APIs
    path("api/auth/", include("accounts.urls")),
    path("api/accounts/", include("accounts.urls")),
    path("api/", include("academics.urls")),
    path("api/", include("students.urls")),
    path("api/", include("attendance.urls")),
    path("api/", include("results.urls")),
    path("api/", include("certificates.urls")),
    path("api/", include("finance.urls")),
    path("api/", include("audits.urls")),
    path("api/", include("notifications.urls")),
    path("api/core/", include("core.urls")),
    path("api/odel/", include("odel.urls")),
    path("api/library/", include("library.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
