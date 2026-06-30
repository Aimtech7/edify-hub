import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from workflows.models import WorkflowDefinition, AutomationRule, ScheduledJob
from workflows.engine.templates import ENTERPRISE_WORKFLOW_TEMPLATES

def seed():
    print("Seeding Enterprise Workflow Definitions & Templates...")
    for template in ENTERPRISE_WORKFLOW_TEMPLATES:
        wf, created = WorkflowDefinition.objects.get_or_create(
            name=template["name"],
            defaults={
                "description": template["description"],
                "category": template["category"],
                "trigger_type": template["trigger_type"],
                "trigger_event": template["trigger_event"],
                "status": template["status"],
                "definition_json": template["definition_json"],
            }
        )
        if not created:
            wf.description = template["description"]
            wf.category = template["category"]
            wf.trigger_type = template["trigger_type"]
            wf.trigger_event = template["trigger_event"]
            wf.status = template["status"]
            wf.definition_json = template["definition_json"]
            wf.save()
            print(f"Updated workflow: {wf.name}")
        else:
            print(f"Created workflow: {wf.name}")

    print("\nSeeding Automation Rules (IF -> THEN Engine)...")
    rules = [
        {
            "name": "Auto-Receipt & Notification on Payment",
            "event_name": "Payment Received",
            "conditions": [{"field": "amount", "op": ">", "val": 0}],
            "actions": [
                {"type": "generate_receipt", "target": "finance"},
                {"type": "notify", "target": "student", "channel": "Hub & Email"},
                {"type": "audit_log", "target": "system"}
            ]
        },
        {
            "name": "Live Lesson Notification & AI Indexing",
            "event_name": "Lesson Uploaded",
            "conditions": [],
            "actions": [
                {"type": "notify", "target": "enrolled_students"},
                {"type": "ai_index", "target": "vector_kb"},
                {"type": "update_dashboard", "target": "lms"}
            ]
        },
        {
            "name": "Transcript & Graduation Check on Result",
            "event_name": "Result Published",
            "conditions": [{"field": "passed", "op": "==", "val": True}],
            "actions": [
                {"type": "notify", "target": "student"},
                {"type": "update_transcript", "target": "records"},
                {"type": "check_graduation", "target": "certificates"}
            ]
        }
    ]

    for r in rules:
        rule, created = AutomationRule.objects.get_or_create(
            name=r["name"],
            defaults={
                "event_name": r["event_name"],
                "conditions": r["conditions"],
                "actions": r["actions"],
                "is_active": True
            }
        )
        if not created:
            rule.event_name = r["event_name"]
            rule.conditions = r["conditions"]
            rule.actions = r["actions"]
            rule.save()
            print(f"Updated rule: {rule.name}")
        else:
            print(f"Created rule: {rule.name}")

    print("\nSeeding Scheduled Automation Jobs (Cron Scheduler)...")
    jobs = [
        ("Daily Attendance Reminder", "attendance_reminder", "0 8 * * *", "Checks student attendance and sends automated reminders."),
        ("Weekly Academic KPI Report", "weekly_report", "0 17 * * 5", "Aggregates weekly academic and admissions KPI data."),
        ("Monthly Finance Reconciliation", "monthly_finance", "0 9 1 * *", "Generates monthly revenue, ledger balance, and invoice summaries."),
        ("Automated Diploma & Certificate Run", "certificate_gen", "0 0 * * *", "Evaluates CEFR completion eligibility and queues certificates."),
        ("Session Token & Upload Cache Pruning", "db_cleanup", "0 3 * * 0", "Cleans up expired tokens and temp file caches."),
        ("Storage Snapshot & Backup Verification", "backup_verify", "0 2 * * *", "Verifies Supabase storage and database integrity.")
    ]

    for name, t_type, cron, desc in jobs:
        job, created = ScheduledJob.objects.get_or_create(
            name=name,
            defaults={
                "task_type": t_type,
                "cron_expression": cron,
                "description": desc,
                "is_active": True
            }
        )
        if not created:
            job.task_type = t_type
            job.cron_expression = cron
            job.description = desc
            job.save()
            print(f"Updated job: {job.name}")
        else:
            print(f"Created job: {job.name}")

    print("\nSeeding Phase 3 Enterprise Automation Engine Completed Successfully!")

if __name__ == '__main__':
    seed()
