from django.contrib import admin
from .models import (
    WorkflowDefinition, WorkflowInstance, WorkflowActionLog,
    ApprovalRequest, AutomationRule, ScheduledJob
)

@admin.register(WorkflowDefinition)
class WorkflowDefinitionAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'trigger_type', 'trigger_event', 'status', 'updated_at')
    list_filter = ('category', 'trigger_type', 'status')
    search_fields = ('name', 'description', 'trigger_event')

@admin.register(WorkflowInstance)
class WorkflowInstanceAdmin(admin.ModelAdmin):
    list_display = ('workflow', 'instance_id', 'status', 'current_step_id', 'started_at', 'completed_at')
    list_filter = ('status', 'workflow__category')
    search_fields = ('instance_id', 'workflow__name', 'initiator')

@admin.register(WorkflowActionLog)
class WorkflowActionLogAdmin(admin.ModelAdmin):
    list_display = ('instance', 'step_name', 'action_type', 'status', 'duration_ms', 'executed_at')
    list_filter = ('status', 'action_type')
    search_fields = ('step_name', 'error_details')

@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = ('title', 'instance', 'target_role', 'status', 'requested_at', 'decided_at')
    list_filter = ('status', 'target_role')
    search_fields = ('title', 'description')

@admin.register(AutomationRule)
class AutomationRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'event_name', 'is_active', 'execution_count', 'last_triggered_at')
    list_filter = ('is_active', 'event_name')
    search_fields = ('name', 'event_name')

@admin.register(ScheduledJob)
class ScheduledJobAdmin(admin.ModelAdmin):
    list_display = ('name', 'task_type', 'cron_expression', 'is_active', 'last_run_at', 'last_status')
    list_filter = ('is_active', 'last_status')
    search_fields = ('name', 'task_type')
