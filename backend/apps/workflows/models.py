import uuid
from django.db import models
from django.conf import settings

class WorkflowDefinition(models.Model):
    class Category(models.TextChoices):
        ADMISSIONS = "Admissions", "Admissions"
        FINANCE = "Finance", "Finance"
        ACADEMIC = "Academic", "Academic"
        LESSON = "Lesson", "Lesson"
        EXAM = "Exam", "Exam"
        CERTIFICATE = "Certificate", "Certificate"
        COMMUNICATION = "Communication", "Communication"
        HR = "HR", "HR"
        GENERAL = "General", "General"

    class TriggerType(models.TextChoices):
        EVENT = "EVENT", "Event-Driven"
        SCHEDULED = "SCHEDULED", "Scheduled (Cron)"
        MANUAL = "MANUAL", "Manual Trigger"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        DRAFT = "DRAFT", "Draft"
        INACTIVE = "INACTIVE", "Inactive"

    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=Category.choices, default=Category.GENERAL)
    trigger_type = models.CharField(max_length=20, choices=TriggerType.choices, default=TriggerType.EVENT)
    trigger_event = models.CharField(max_length=150, blank=True, help_text="Event name triggering this workflow e.g. 'Payment Received'")
    trigger_cron = models.CharField(max_length=100, blank=True, help_text="Cron schedule if scheduled")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    definition_json = models.JSONField(default=dict, help_text="Nodes and edges visual workflow definition")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_workflows')

    class Meta:
        ordering = ['-updated_at']
        verbose_name = "Workflow Definition"
        verbose_name_plural = "Workflow Definitions"

    def __str__(self):
        return f"{self.name} ({self.status})"


class WorkflowInstance(models.Model):
    class Status(models.TextChoices):
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        WAITING_APPROVAL = "WAITING_APPROVAL", "Waiting for Approval"
        CANCELLED = "CANCELLED", "Cancelled"
        ROLLED_BACK = "ROLLED_BACK", "Rolled Back"

    instance_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    workflow = models.ForeignKey(WorkflowDefinition, on_delete=models.CASCADE, related_name='instances')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.RUNNING)
    trigger_data = models.JSONField(default=dict, help_text="Initial payload/event data")
    execution_context = models.JSONField(default=dict, help_text="Accumulated state and variables")
    current_step_id = models.CharField(max_length=100, blank=True)
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    initiator = models.CharField(max_length=200, default="System")
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-started_at']
        verbose_name = "Workflow Instance"
        verbose_name_plural = "Workflow Instances"

    def __str__(self):
        return f"{self.workflow.name} - {self.instance_id} ({self.status})"


class WorkflowActionLog(models.Model):
    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        PENDING = "PENDING", "Pending"
        ROLLED_BACK = "ROLLED_BACK", "Rolled Back"

    instance = models.ForeignKey(WorkflowInstance, on_delete=models.CASCADE, related_name='logs')
    step_id = models.CharField(max_length=100)
    step_name = models.CharField(max_length=200)
    action_type = models.CharField(max_length=50) # Start, End, Approval, Decision, Condition, Notification, AI Action, Database Update, Payment, Document Generation, Certificate Generation, Delay, Webhook, Custom Action
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.SUCCESS)
    input_data = models.JSONField(default=dict)
    output_data = models.JSONField(default=dict)
    duration_ms = models.IntegerField(default=0)
    executed_at = models.DateTimeField(auto_now_add=True)
    error_details = models.TextField(blank=True)

    class Meta:
        ordering = ['executed_at']
        verbose_name = "Workflow Action Log"
        verbose_name_plural = "Workflow Action Logs"

    def __str__(self):
        return f"{self.instance.instance_id} | {self.step_name} [{self.status}]"


class ApprovalRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    instance = models.ForeignKey(WorkflowInstance, on_delete=models.CASCADE, related_name='approvals')
    step_id = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    target_role = models.CharField(max_length=50, blank=True, help_text="e.g., admin, accountant, hr, registrar, admissions")
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='targeted_approvals')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    requested_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='workflow_approvals')
    comments = models.TextField(blank=True)

    class Meta:
        ordering = ['-requested_at']
        verbose_name = "Approval Request"
        verbose_name_plural = "Approval Requests"

    def __str__(self):
        return f"{self.title} ({self.status})"


class AutomationRule(models.Model):
    name = models.CharField(max_length=200)
    event_name = models.CharField(max_length=150, help_text="Triggering Event e.g. 'Payment Received'")
    conditions = models.JSONField(default=list, help_text='List of IF conditions e.g. [{"field": "amount", "op": ">=", "val": 1000}]')
    actions = models.JSONField(default=list, help_text='List of THEN actions e.g. [{"type": "notify", "target": "student"}]')
    is_active = models.BooleanField(default=True)
    execution_count = models.IntegerField(default=0)
    last_triggered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Automation Rule"
        verbose_name_plural = "Automation Rules"

    def __str__(self):
        return f"IF {self.event_name} -> {self.name}"


class ScheduledJob(models.Model):
    class Status(models.TextChoices):
        IDLE = "IDLE", "Idle"
        RUNNING = "RUNNING", "Running"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    name = models.CharField(max_length=200, unique=True)
    task_type = models.CharField(max_length=100, help_text="attendance_reminder, weekly_report, monthly_finance, certificate_gen, db_cleanup, backup_verify")
    cron_expression = models.CharField(max_length=100, default="0 0 * * *")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    last_run_at = models.DateTimeField(null=True, blank=True)
    last_status = models.CharField(max_length=20, choices=Status.choices, default=Status.IDLE)
    execution_log = models.TextField(blank=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Scheduled Job"
        verbose_name_plural = "Scheduled Jobs"

    def __str__(self):
        return f"{self.name} ({self.cron_expression})"
