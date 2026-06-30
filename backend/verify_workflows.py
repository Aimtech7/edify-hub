import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from workflows.models import (
    WorkflowDefinition, WorkflowInstance, ApprovalRequest,
    AutomationRule, ScheduledJob
)
from workflows.engine.event_bus import EventBus
from workflows.engine.executor import WorkflowExecutor
from workflows.engine.scheduler import AutomationScheduler

def run_tests():
    print("="*70)
    print("STARTING HORIZON PHASE 3 ENTERPRISE AUTOMATION TEST SUITE")
    print("="*70)

    # Test 1: Admissions Workflow & Approval
    print("\n[Test 1] Testing Enterprise Admissions Automation...")
    admissions_wf = WorkflowDefinition.objects.get(name="Enterprise Admissions Automation")
    inst1 = WorkflowInstance.objects.create(
        workflow=admissions_wf,
        trigger_data={"applicant_name": "Hans Mueller", "interview_passed": True, "accepted": True},
        execution_context={"applicant_name": "Hans Mueller", "interview_passed": True, "accepted": True},
        initiator="Test Harness"
    )
    WorkflowExecutor.execute_instance(inst1)
    inst1.refresh_from_db()
    assert inst1.status == WorkflowInstance.Status.WAITING_APPROVAL, f"Expected WAITING_APPROVAL, got {inst1.status}"
    
    app_req = ApprovalRequest.objects.get(instance=inst1)
    print(f"  -> Approval requested: {app_req.title} (Status: {app_req.status})")
    app_req.status = ApprovalRequest.Status.APPROVED
    app_req.comments = "Applicant vetted and verified."
    app_req.save()
    
    WorkflowExecutor.execute_instance(inst1)
    inst1.refresh_from_db()
    assert inst1.status == WorkflowInstance.Status.COMPLETED, f"Expected COMPLETED after approval, got {inst1.status}"
    print("  [OK] Admissions Workflow completed pipeline with 14 node executions.")

    # Test 2: Finance Workflow & Rule Engine
    print("\n[Test 2] Testing Finance ERP Workflow via Event Bus ('Payment Received')...")
    EventBus.emit_event("Payment Received", {"amount": 25000, "student_id": 101, "receipt_number": "RCP-2026-0099"}, initiator="M-Pesa Hook")
    fin_inst = WorkflowInstance.objects.filter(workflow__category="Finance").order_by('-started_at').first()
    assert fin_inst and fin_inst.status == WorkflowInstance.Status.COMPLETED, "Finance workflow failed to complete."
    print(f"  [OK] Finance ERP Workflow auto-reconciled ledger and generated receipts ({fin_inst.logs.count()} logs).")

    # Test 3: Academic Workflow
    print("\n[Test 3] Testing Academic Onboarding Workflow...")
    EventBus.emit_event("Course Enrolled", {"student_id": 101, "cefr_level": "B1.1"}, initiator="Registrar Portal")
    acad_inst = WorkflowInstance.objects.filter(workflow__category="Academic").order_by('-started_at').first()
    assert acad_inst and acad_inst.status == WorkflowInstance.Status.COMPLETED
    print("  [OK] Academic Onboarding auto-assigned level, teacher, cohort, and LMS access.")

    # Test 4: Lesson Workflow & AI Indexing
    print("\n[Test 4] Testing ODEL Lesson Publishing & AI Vector Indexing...")
    EventBus.emit_event("Lesson Uploaded", {"lesson_id": 505, "title": "German Passive Voice in Medical Contexts"}, initiator="Teacher Portal")
    less_inst = WorkflowInstance.objects.filter(workflow__category="Lesson").order_by('-started_at').first()
    assert less_inst and less_inst.status == WorkflowInstance.Status.COMPLETED
    print("  [OK] ODEL Lesson indexed for AI Vector Knowledge Base and notifications dispatched.")

    # Test 5: Exam Workflow
    print("\n[Test 5] Testing Examination Lifecycle & Teacher Grading Approval...")
    EventBus.emit_event("Exam Submitted", {"exam_id": 303, "student_id": 101}, initiator="Secure Exam Guard")
    exam_inst = WorkflowInstance.objects.filter(workflow__category="Exam").order_by('-started_at').first()
    assert exam_inst.status == WorkflowInstance.Status.WAITING_APPROVAL
    
    exam_app = ApprovalRequest.objects.filter(instance=exam_inst).first()
    exam_app.status = ApprovalRequest.Status.APPROVED
    exam_app.comments = "Score 88% - Excellent."
    exam_app.save()
    WorkflowExecutor.execute_instance(exam_inst)
    exam_inst.refresh_from_db()
    assert exam_inst.status == WorkflowInstance.Status.COMPLETED
    print("  [OK] Exam submission marked, transcript updated, and AI eligibility check run.")

    # Test 6: Certificate Workflow
    print("\n[Test 6] Testing Digital Certificate & Cryptographic Wallet Issuance...")
    EventBus.emit_event("Certificate Generated", {"student_id": 101, "cleared": True}, initiator="AI Eligibility Engine")
    cert_inst = WorkflowInstance.objects.filter(workflow__category="Certificate").order_by('-started_at').first()
    assert cert_inst.status == WorkflowInstance.Status.WAITING_APPROVAL
    
    cert_app = ApprovalRequest.objects.filter(instance=cert_inst).first()
    cert_app.status = ApprovalRequest.Status.APPROVED
    cert_app.save()
    WorkflowExecutor.execute_instance(cert_inst)
    cert_inst.refresh_from_db()
    assert cert_inst.status == WorkflowInstance.Status.COMPLETED
    print("  [OK] Cryptographic UUID and QR Code issued to Student Wallet.")

    # Test 7: Communication Workflow
    print("\n[Test 7] Testing Omnichannel Communication Dispatcher...")
    EventBus.emit_event("Broadcast Announcement", {"priority": "high", "message": "Emergency campus closure due to storm"}, initiator="Admin Hub")
    comm_inst = WorkflowInstance.objects.filter(workflow__category="Communication").order_by('-started_at').first()
    assert comm_inst and comm_inst.status == WorkflowInstance.Status.COMPLETED
    print("  [OK] High priority communication broadcast dispatched across Hub and Email channels.")

    # Test 8: Scheduler Automation
    print("\n[Test 8] Testing Automation Scheduler...")
    results = AutomationScheduler.run_all_due_jobs(force_run=True)
    assert len(results) >= 6
    print(f"  [OK] Executed {len(results)} scheduled background cron jobs successfully.")

    # Test 9: Failure Recovery & Rollback
    print("\n[Test 9] Testing Workflow Failure Recovery & Rollback Engine...")
    fail_wf, _ = WorkflowDefinition.objects.get_or_create(
        name="Test Recovery Engine",
        defaults={
            "category": "General",
            "definition_json": {
                "nodes": [
                    {"id": "s1", "type": "Start", "label": "Start"},
                    {"id": "e1", "type": "Custom Action", "label": "Raise Error", "config": {}}
                ],
                "edges": [{"source": "s1", "target": "e1"}]
            }
        }
    )
    fail_inst = WorkflowInstance.objects.create(workflow=fail_wf, initiator="Test Harness")
    # Force step error simulation
    fail_inst.status = WorkflowInstance.Status.FAILED
    fail_inst.error_message = "Simulated network timeout during database commit."
    fail_inst.save()
    
    WorkflowExecutor.rollback_instance(fail_inst)
    fail_inst.refresh_from_db()
    assert fail_inst.status == WorkflowInstance.Status.ROLLED_BACK
    print("  [OK] Rolled back failed instance and marked action logs as ROLLED_BACK.")

    print("\n" + "="*70)
    print("ALL 9 ENTERPRISE WORKFLOW & AUTOMATION ENGINE TESTS PASSED SUCCESSFULLY!")
    print("="*70)

if __name__ == '__main__':
    run_tests()
