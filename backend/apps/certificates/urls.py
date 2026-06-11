from django.urls import path, include
from rest_framework.routers import DefaultRouter
from certificates.views import CertificateViewSet, CertificateVerifyView

router = DefaultRouter()
router.register('certificates', CertificateViewSet, basename='certificate')

urlpatterns = [
    path('verify/', CertificateVerifyView.as_view(), name='certificate-verify-query'),
    path('verify/<str:certificate_number>/', CertificateVerifyView.as_view(), name='certificate-verify'),
    path('', include(router.urls)),
]
