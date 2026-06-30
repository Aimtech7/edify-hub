from django.urls import path
from .views import (
    ExecutiveOverviewView, FinanceBIView, AcademicBIView,
    AdmissionsBIView, OdelBIView, CommunicationBIView,
    ExamBIView, CertificateBIView,
    AIExecutorView, ReportCenterView, GlobalSearchView
)

urlpatterns = [
    path('command-center/', ExecutiveOverviewView.as_view(), name='bi-command-center'),
    path('finance/', FinanceBIView.as_view(), name='bi-finance'),
    path('academic/', AcademicBIView.as_view(), name='bi-academic'),
    path('admissions/', AdmissionsBIView.as_view(), name='bi-admissions'),
    path('odel/', OdelBIView.as_view(), name='bi-odel'),
    path('communication/', CommunicationBIView.as_view(), name='bi-communication'),
    path('exams/', ExamBIView.as_view(), name='bi-exams'),
    path('certificates/', CertificateBIView.as_view(), name='bi-certificates'),
    path('ai-assistant/', AIExecutorView.as_view(), name='bi-ai-assistant'),
    path('reports/', ReportCenterView.as_view(), name='bi-reports'),
    path('search/', GlobalSearchView.as_view(), name='bi-search'),
]
