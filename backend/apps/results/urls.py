from django.urls import path, include
from rest_framework.routers import DefaultRouter
from results.views import ResultViewSet

router = DefaultRouter()
router.register('results', ResultViewSet, basename='result')

urlpatterns = [
    path('', include(router.urls)),
]
