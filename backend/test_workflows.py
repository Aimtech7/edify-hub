import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from workflows.models import WorkflowDefinition, WorkflowInstance, ScheduledJob, AutomationRule
from workflows.engine.templates import ENTERPRISE_WORKFLOW_TEMPLATES
from workflows.engine.event_bus import EventBus
from workflows.engine.scheduler import AutomationScheduler
from django.contrib.auth import get_user_model

def load_templates():
    print("Loading templates...")
    for tpl in ENTERPRISE_WORKFLOW_TEMPLATES:
        wf, created = WorkflowDefinition.objects.get_or_create(
            name=tpl['name'],
            defaults={
                'description': tpl.get('description', ''),
                'category': tpl.get('category', 'General'),
                'trigger_type': tpl.get('trigger_type', 'EVENT'),
                'trigger_event': tpl.get('trigger_event', ''),
                'status': tpl.get('status', 'ACTIVE'),
                'definition_json': tpl.get('definition_json', {})
            }
        )
        if not created:
            wf.definition_json = tpl.get('definition_json', {})
            wf.save()
    print(f"Loaded {WorkflowDefinition.objects.count()} workflows.")

def test_admissions():
    print("Testing Admissions Workflow...")
    EventBus.emit_event("Student Applied", {"applicant_id": 1, "name": "John Doe"})
    instances = WorkflowInstance.objects.filter(workflow__name="Enterprise Admissions Automation").order_by('-started_at')
    if instances.exists():
        inst = instances.first()
        print(f"Admissions Instance Status: {inst.status}")
        for log in inst.logs.all():
            print(f" - {log.step_name}: {log.status} | Output: {log.output_data}")
        for approval in inst.approvals.all():
            print(f" - Approval Required: {approval.title} | Status: {approval.status}")

def test_finance():
    print("Testing Finance Workflow...")
    EventBus.emit_event("Payment Received", {"payment_id": 100, "amount": 5000})
    instances = WorkflowInstance.objects.filter(workflow__name="Enterprise Finance ERP Reconciliation").order_by('-started_at')
    if instances.exists():
        inst = instances.first()
        print(f"Finance Instance Status: {inst.status}")
        for log in inst.logs.all():
            print(f" - {log.step_name}: {log.status} | Output: {log.output_data}")

def test_scheduler():
    print("Testing Scheduler...")
    jobs = [
        {"name": "Daily Attendance", "task_type": "attendance_reminder"},
        {"name": "Weekly Academic Report", "task_type": "weekly_report"},
        {"name": "Monthly Finance Review", "task_type": "monthly_finance"},
        {"name": "Nightly DB Cleanup", "task_type": "db_cleanup"}
    ]
    for j in jobs:
        ScheduledJob.objects.get_or_create(name=j["name"], defaults={"task_type": j["task_type"]})
    
    res = AutomationScheduler.run_all_due_jobs()
    for r in res:
        print(f"Scheduled Job Result: {r}")

if __name__ == "__main__":
    load_templates()
    test_admissions()
    test_finance()
    test_scheduler()
