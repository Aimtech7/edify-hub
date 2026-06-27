from django.urls import path
from .views import (
    DocumentListView, DocumentDetailView, DocumentDownloadView,
    DocumentActionView, StorageDashboardView
)

urlpatterns = [
    path("documents/", DocumentListView.as_view(), name="dms_document_list"),
    path("documents/<int:pk>/", DocumentDetailView.as_view(), name="dms_document_detail"),
    path("documents/<int:pk>/download/", DocumentDownloadView.as_view(), name="dms_document_download"),
    path("documents/<int:pk>/action/", DocumentActionView.as_view(), name="dms_document_action"),
    path("dashboard/", StorageDashboardView.as_view(), name="dms_storage_dashboard"),
]
