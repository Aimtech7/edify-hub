from django.urls import path, include
from rest_framework.routers import DefaultRouter
from students.views import StudentViewSet, PlacementTestViewSet

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('placement-tests', PlacementTestViewSet, basename='placement-test')

urlpatterns = [
    path('', include(router.urls)),
]
