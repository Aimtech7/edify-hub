from rest_framework import serializers
from .models import (
    WorkflowDefinition, WorkflowInstance, WorkflowActionLog,
    ApprovalRequest, AutomationRule, ScheduledJob
)

class WorkflowDefinitionSerializer(serializers.ModelSerializer):
    instance_count = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowDefinition
        fields = [
            'id', 'name', 'description', 'category', 'trigger_type',
            'trigger_event', 'trigger_cron', 'status', 'definition_json',
            'created_at', 'updated_at', 'created_by', 'instance_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_instance_count(self, obj):
        return obj.instances.count()


class WorkflowActionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowActionLog
        fields = [
            'id', 'step_id', 'step_name', 'action_type', 'status',
            'input_data', 'output_data', 'duration_ms', 'executed_at', 'error_details'
        ]


class ApprovalRequestSerializer(serializers.ModelSerializer):
    workflow_name = serializers.CharField(source='instance.workflow.name', read_only=True)
    approver_username = serializers.CharField(source='approver.username', read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = [
            'id', 'instance', 'workflow_name', 'step_id', 'title',
            'description', 'target_role', 'target_user', 'status',
            'requested_at', 'decided_at', 'approver', 'approver_username', 'comments'
        ]
        read_only_fields = ['id', 'requested_at', 'decided_at', 'approver']


class WorkflowInstanceSerializer(serializers.ModelSerializer):
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    workflow_category = serializers.CharField(source='workflow.category', read_only=True)
    logs = WorkflowActionLogSerializer(many=True, read_only=True)
    approvals = ApprovalRequestSerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowInstance
        fields = [
            'id', 'instance_id', 'workflow', 'workflow_name', 'workflow_category',
            'status', 'trigger_data', 'execution_context', 'current_step_id',
            'started_at', 'completed_at', 'initiator', 'error_message', 'logs', 'approvals'
        ]
        read_only_fields = ['id', 'instance_id', 'started_at', 'completed_at']


class AutomationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomationRule
        fields = [
            'id', 'name', 'event_name', 'conditions', 'actions',
            'is_active', 'execution_count', 'last_triggered_at'
        ]


class ScheduledJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledJob
        fields = [
            'id', 'name', 'task_type', 'cron_expression', 'description',
            'is_active', 'last_run_at', 'last_status', 'execution_log'
        ]
