from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkflowDefinitionViewSet, WorkflowInstanceViewSet,
    ApprovalRequestViewSet, AutomationRuleViewSet, ScheduledJobViewSet,
    emit_event_view, telemetry_dashboard_view
)

router = DefaultRouter()
router.register(r'definitions', WorkflowDefinitionViewSet, basename='workflow-definition')
router.register(r'instances', WorkflowInstanceViewSet, basename='workflow-instance')
router.register(r'approvals', ApprovalRequestViewSet, basename='workflow-approval')
router.register(r'rules', AutomationRuleViewSet, basename='automation-rule')
router.register(r'scheduled-jobs', ScheduledJobViewSet, basename='scheduled-job')

urlpatterns = [
    path('', include(router.urls)),
    path('events/emit/', emit_event_view, name='workflow-emit-event'),
    path('telemetry/', telemetry_dashboard_view, name='workflow-telemetry'),
]
