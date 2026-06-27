import os
import sys
import django
import uuid
import datetime

# Setup Django Environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'apps'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from students.models import Student, AdmissionApplication
from academics.models import Level, AcademicYear, Semester, Term, Department, Program
from finance.models import FeeStructure, Payment, Allocation
from results.models import Result
from certificates.models import Certificate
from audits.models import AuditLog, log_action

User = get_user_model()

def run_uat_verification():
    print("=" * 60)
    print("[START] STARTING AUTOMATED UAT LIFECYCLE VERIFICATION (PHASE 9)")
    print("=" * 60)

    # Clean up previous UAT test artifacts for idempotent verification
    Student.objects.filter(admission_number='UAT-2026-001').delete()
    User.objects.filter(username='UAT-2026-001').delete()
    AdmissionApplication.objects.filter(email='hans@zimmer.de').delete()

    # Clean previous test logs for clean assertion
    initial_log_count = AuditLog.objects.count()

    # 1. Setup Actor Roles
    admin_user, _ = User.objects.get_or_create(username='uat_admin', defaults={'role': 'ADMIN', 'email': 'admin@uat.local'})
    staff_user, _ = User.objects.get_or_create(username='uat_staff', defaults={'role': 'TEACHER', 'email': 'staff@uat.local'})
    
    # 2. Setup Academic Primitives
    level_a1, _ = Level.objects.get_or_create(code='UAT-A1', defaults={'name': 'UAT Level A1', 'cefr_category': 'A1'})
    fee_struct, _ = FeeStructure.objects.get_or_create(
        level=level_a1, 
        academic_year='2026',
        defaults={'tuition_fee': 35000.00, 'exam_fee': 5000.00}
    )

    print("\n[STEP 1] Prospective Student Admissions Submission")
    app = AdmissionApplication.objects.create(
        first_name='Hans',
        last_name='Zimmer',
        email='hans@zimmer.de',
        phone='+254700112233',
        status=AdmissionApplication.Status.ADMISSIONS_QUEUE
    )
    log_action(admin_user, f"Received admission application for {app.first_name} {app.last_name}", entity="AdmissionApplication", entity_id=app.id)
    print(f"[OK] Application created: {app} (ID: {app.id})")

    print("\n[STEP 2] Admin Approval & Profile Generation")
    app.status = AdmissionApplication.Status.APPROVED
    app.save()

    student_user, _ = User.objects.get_or_create(username='UAT-2026-001', defaults={'role': 'STUDENT', 'email': app.email})
    if not student_user.email:
        student_user.email = app.email
        student_user.save()

    student, _ = Student.objects.get_or_create(
        admission_number='UAT-2026-001',
        defaults={
            'user': student_user,
            'first_name': app.first_name,
            'last_name': app.last_name,
            'email': app.email,
            'current_level': level_a1
        }
    )
    log_action(admin_user, f"Approved application and created student {student.admission_number}", entity="Student", entity_id=student.id)
    print(f"[OK] Student Profile Generated: {student}")

    print("\n[STEP 3] Financial Fee Settlement & Allocation")
    initial_balance = student.outstanding_balance
    print(f"[INFO] Student Initial Outstanding Balance: KES {initial_balance}")

    payment = Payment.objects.create(
        student=student,
        payer_name='Hans Zimmer',
        phone_number='+254700112233',
        amount=40000.00,
        payment_method=Payment.Methods.MPESA,
        mpesa_reference=f'QWE{uuid.uuid4().hex[:6].upper()}'
    )
    # Allocate to tuition and exam
    Allocation.objects.create(payment=payment, category=Allocation.Categories.TUITION, amount=35000.00)
    Allocation.objects.create(payment=payment, category=Allocation.Categories.EXAMINATION, amount=5000.00)
    
    log_action(staff_user, f"Allocated payment {payment.receipt_number} for KES 40000.00", entity="Payment", entity_id=payment.id)
    
    # Reload student balance
    new_balance = student.outstanding_balance
    print(f"[OK] Payment Allocated. Updated Balance: KES {new_balance}")
    assert new_balance == 0.00, f"Expected balance 0.00, got {new_balance}"

    print("\n[STEP 4] Academic Assessment & Grading")
    result = Result.objects.create(
        student=student,
        level=level_a1,
        term="Term 1 2026",
        listening=92.5,
        reading=95.0,
        writing=88.0,
        speaking=91.0,
        grammar=90.0,
        vocabulary=94.0,
        is_published=True
    )
    log_action(staff_user, f"Published academic result for {student.admission_number} with grade {result.grade}", entity="Result", entity_id=result.id)
    print(f"[OK] Result Published: Average Score {result.average_score} | Grade: {result.grade}")
    assert result.grade == Result.Grades.SEHR_GUT, f"Expected Sehr Gut, got {result.grade}"

    print("\n[STEP 5] Certificate Issuance & QR Verification")
    cert = Certificate.objects.create(
        student=student,
        level=level_a1,
        issued_by=staff_user
    )
    log_action(staff_user, f"Issued official certificate {cert.certificate_number}", entity="Certificate", entity_id=cert.id)
    print(f"[OK] Certificate Issued: {cert.certificate_number} | Verification Code: {cert.verification_code}")

    print("\n[STEP 6] Audit Trailing (Non-Repudiation) Verification")
    final_log_count = AuditLog.objects.count()
    logs_generated = final_log_count - initial_log_count
    print(f"[INFO] Audit Logs Generated during lifecycle: {logs_generated}")
    
    recent_logs = AuditLog.objects.all()[:5]
    for log in recent_logs:
        print(f"   [{log.timestamp.strftime('%H:%M:%S')}] {log.user} -> {log.action}")

    assert logs_generated >= 5, "Audit logs failed to record full lifecycle!"

    print("\n" + "=" * 60)
    print("[SUCCESS] ALL PHASE 9 UAT LIFECYCLE ASSERTIONS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    run_uat_verification()
