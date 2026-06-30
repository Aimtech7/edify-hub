from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Q

from .models import (
    WorkflowDefinition, WorkflowInstance, WorkflowActionLog,
    ApprovalRequest, AutomationRule, ScheduledJob
)
from .serializers import (
    WorkflowDefinitionSerializer, WorkflowInstanceSerializer,
    WorkflowActionLogSerializer, ApprovalRequestSerializer,
    AutomationRuleSerializer, ScheduledJobSerializer
)
from .engine.event_bus import EventBus
from .engine.executor import WorkflowExecutor
from .engine.scheduler import AutomationScheduler


class WorkflowDefinitionViewSet(viewsets.ModelViewSet):
    queryset = WorkflowDefinition.objects.all()
    serializer_class = WorkflowDefinitionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def spawn(self, request, pk=None):
        """Manually trigger a workflow definition execution."""
        wf = self.get_object()
        payload = request.data.get("payload", {})
        instance = WorkflowInstance.objects.create(
            workflow=wf,
            trigger_data=payload,
            execution_context=payload.copy(),
            initiator=f"User: {request.user.username}"
        )
        WorkflowExecutor.execute_instance(instance)
        serializer = WorkflowInstanceSerializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorkflowInstanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowInstance.objects.all()
    serializer_class = WorkflowInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        instance = self.get_object()
        WorkflowExecutor.retry_instance(instance)
        return Response(WorkflowInstanceSerializer(instance).data)

    @action(detail=True, methods=['post'])
    def rollback(self, request, pk=None):
        instance = self.get_object()
        WorkflowExecutor.rollback_instance(instance)
        return Response(WorkflowInstanceSerializer(instance).data)


class ApprovalRequestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def decide(self, request, pk=None):
        approval = self.get_object()
        decision = request.data.get("decision", "APPROVED").upper()
        comments = request.data.get("comments", "")

        if decision not in ["APPROVED", "REJECTED"]:
            return Response({"error": "Invalid decision. Must be APPROVED or REJECTED."}, status=status.HTTP_400_BAD_REQUEST)

        approval.status = ApprovalRequest.Status.APPROVED if decision == "APPROVED" else ApprovalRequest.Status.REJECTED
        approval.comments = comments
        approval.decided_at = timezone.now()
        approval.approver = request.user
        approval.save()

        # Resume execution
        WorkflowExecutor.execute_instance(approval.instance)

        return Response(ApprovalRequestSerializer(approval).data)


class AutomationRuleViewSet(viewsets.ModelViewSet):
    queryset = AutomationRule.objects.all()
    serializer_class = AutomationRuleSerializer
    permission_classes = [permissions.IsAuthenticated]


class ScheduledJobViewSet(viewsets.ModelViewSet):
    queryset = ScheduledJob.objects.all()
    serializer_class = ScheduledJobSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def run_now(self, request, pk=None):
        job = self.get_object()
        res = AutomationScheduler.run_job(job)
        return Response(res)

    @action(detail=False, methods=['post'])
    def run_all(self, request):
        res = AutomationScheduler.run_all_due_jobs(force_run=True)
        return Response({"executed": len(res), "results": res})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def emit_event_view(request):
    event_name = request.data.get("event_name")
    payload = request.data.get("payload", {})
    if not event_name:
        return Response({"error": "event_name is required"}, status=status.HTTP_400_BAD_REQUEST)

    EventBus.emit_event(event_name, payload, initiator=request.user.username)
    return Response({"status": "Event emitted successfully", "event_name": event_name})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def telemetry_dashboard_view(request):
    active_instances = WorkflowInstance.objects.filter(status=WorkflowInstance.Status.RUNNING).count()
    completed_instances = WorkflowInstance.objects.filter(status=WorkflowInstance.Status.COMPLETED).count()
    failed_instances = WorkflowInstance.objects.filter(status=WorkflowInstance.Status.FAILED).count()
    pending_approvals = ApprovalRequest.objects.filter(status=ApprovalRequest.Status.PENDING).count()
    
    total_rules_runs = sum(r.execution_count for r in AutomationRule.objects.all())
    active_jobs = ScheduledJob.objects.filter(is_active=True).count()

    recent_instances = WorkflowInstanceSerializer(
        WorkflowInstance.objects.all()[:10], many=True
    ).data

    ai_recommendations = [
        {"title": "Admissions Review Bottleneck", "detail": "3 applications pending approval for > 24 hours in Admissions Review step.", "priority": "high"},
        {"title": "Attendance Alert Rule Optimization", "detail": "Daily attendance reminders rule triggered 45 times this week. Consider adjusting threshold to 82%.", "priority": "medium"},
        {"title": "Automated Fee Ledger Sync", "detail": "100% of payment receipts generated successfully via Finance Workflow.", "priority": "low"}
    ]

    return Response({
        "kpi": {
            "active_workflows": active_instances,
            "completed_workflows": completed_instances,
            "failed_workflows": failed_instances,
            "pending_approvals": pending_approvals,
            "rule_executions": total_rules_runs,
            "active_scheduled_jobs": active_jobs,
        },
        "recent_instances": recent_instances,
        "ai_recommendations": ai_recommendations
    })
