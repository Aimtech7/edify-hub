from django.urls import path, include
from rest_framework.routers import DefaultRouter
from students.views import StudentViewSet, PlacementTestViewSet, AdmissionApplicationViewSet

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('placement-tests', PlacementTestViewSet, basename='placement-test')
router.register('admissions', AdmissionApplicationViewSet, basename='admission')

urlpatterns = [
    path('', include(router.urls)),
]
