from django.urls import path, include
from rest_framework.routers import DefaultRouter
from finance.views import FeeStructureViewSet, PaymentViewSet, AllocationViewSet, ReceiptViewSet, FinanceReportsView

router = DefaultRouter()
router.register('fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register('payments', PaymentViewSet, basename='payment')
router.register('allocations', AllocationViewSet, basename='allocation')
router.register('receipts', ReceiptViewSet, basename='receipt')

urlpatterns = [
    path('reports/', FinanceReportsView.as_view(), name='finance-reports'),
    path('', include(router.urls)),
]
