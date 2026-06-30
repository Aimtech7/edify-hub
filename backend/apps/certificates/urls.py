from django.urls import path, include
from rest_framework.routers import DefaultRouter
from certificates.views import CertificateViewSet, CertificateVerifyView, CertificateTemplateViewSet

router = DefaultRouter()
router.register('templates', CertificateTemplateViewSet, basename='certificate-template')
router.register('certificates', CertificateViewSet, basename='certificate')

urlpatterns = [
    path('verify/', CertificateVerifyView.as_view(), name='certificate-verify-query'),
    path('verify/<str:certificate_number>/', CertificateVerifyView.as_view(), name='certificate-verify'),
    path('', include(router.urls)),
]
