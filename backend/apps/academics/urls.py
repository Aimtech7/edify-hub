from django.urls import path, include
from rest_framework.routers import DefaultRouter
from academics.views import LevelViewSet, CohortViewSet, PromotionHistoryViewSet

router = DefaultRouter()
router.register('levels', LevelViewSet, basename='level')
router.register('cohorts', CohortViewSet, basename='cohort')
router.register('promotions', PromotionHistoryViewSet, basename='promotion')

urlpatterns = [
    path('', include(router.urls)),
]
