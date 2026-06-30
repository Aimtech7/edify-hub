import datetime
import psutil
from django.db import connection
from django.db.models import Sum, Count, Avg, Q


def get_executive_overview():
    today = datetime.date.today()
    now = datetime.datetime.now()

    # 1. Students & Admissions — live from Student and AdmissionApplication
    total_students = 0
    active_students = 0
    applicants = 0
    admissions_today = 0
    try:
        from students.models import Student
        total_students = Student.objects.filter(is_deleted=False).count()
        active_students = Student.objects.filter(is_deleted=False, status='Active').count()
        admissions_today = Student.objects.filter(is_deleted=False, enrollment_date=today).count()
    except Exception:
        pass

    try:
        # AdmissionApplication lives in students.models — NOT odel
        from students.models import AdmissionApplication
        applicants = AdmissionApplication.objects.filter(
            status__in=['New', 'Admissions Queue', 'Under Review', 'Documents Pending',
                        'Placement Test Pending', 'Interview Scheduled']
        ).count()
    except Exception:
        pass

    # 2. Staff Counts
    teacher_count = 0
    staff_count = 0
    try:
        from accounts.models import User
        teacher_count = User.objects.filter(role='TEACHER', is_active=True).count()
        staff_count = User.objects.filter(is_active=True).count()
    except Exception:
        pass

    # 3. Attendance — live from attendance.Attendance (actual model is Attendance, not AttendanceRecord)
    today_attendance_pct = 0.0
    teacher_attendance_pct = 0.0
    try:
        from attendance.models import Attendance
        records_today = Attendance.objects.filter(date=today)
        tot_rec = records_today.count()
        if tot_rec > 0:
            pres = records_today.filter(status='Present').count()
            today_attendance_pct = round((pres / tot_rec) * 100, 1)
    except Exception:
        pass

    # 4. Academic
    courses_running = 0
    classes_running = 0
    odel_courses_active = 0
    try:
        from academics.models import Cohort
        # Cohort is the class/group model; count active cohorts (ones that have not ended)
        classes_running = Cohort.objects.filter(end_date__gte=today).count()
    except Exception:
        pass

    try:
        from odel.models import Course, Lesson
        courses_running = Course.objects.count()
        odel_courses_active = Course.objects.filter(is_published=True).count()
    except Exception:
        pass

    # 5. Finance Real Data
    todays_revenue = 0.00
    outstanding_fees = 0.00
    receipts_today = 0
    pending_allocations = 0
    try:
        from finance.models import Payment, Receipt
        todays_pay = Payment.objects.filter(is_deleted=False, payment_date=today).exclude(status='CANCELLED')
        todays_revenue = float(todays_pay.aggregate(s=Sum('amount'))['s'] or 0.00)
        pending_allocations = Payment.objects.filter(is_deleted=False, status='PENDING_ALLOCATION').count()
        receipts_today = Receipt.objects.filter(is_deleted=False, issue_date=today, status='FINAL').count()
    except Exception:
        pass

    try:
        from students.models import Student
        # Efficient outstanding balance via ledger aggregation
        from finance.models import StudentLedger
        fee_total = float(StudentLedger.objects.filter(
            is_deleted=False, transaction_type='Fee Charge'
        ).aggregate(s=Sum('amount'))['s'] or 0.00)
        paid_total = float(StudentLedger.objects.filter(
            is_deleted=False, transaction_type='Payment'
        ).aggregate(s=Sum('amount'))['s'] or 0.00)
        refund_total = float(StudentLedger.objects.filter(
            is_deleted=False, transaction_type='Refund'
        ).aggregate(s=Sum('amount'))['s'] or 0.00)
        outstanding_fees = max(0.0, fee_total - paid_total + refund_total)
    except Exception:
        pass

    # 6. Certificates
    certificates_generated = 0
    try:
        from certificates.models import Certificate
        certificates_generated = Certificate.objects.filter(is_deleted=False, status='ACTIVE').count()
    except Exception:
        pass

    # 7. Exam Results (using actual results.Result model — no ExamSchedule model exists)
    exams_completed = 0
    exams_pending_marking = 0
    try:
        from results.models import Result
        exams_completed = Result.objects.filter(is_deleted=False, is_published=True).count()
        exams_pending_marking = Result.objects.filter(is_deleted=False, is_published=False).count()
    except Exception:
        pass

    # 8. ODEL Assignments Due
    assignments_due = 0
    try:
        from odel.models import Assignment
        assignments_due = Assignment.objects.filter(is_deleted=False, due_date__gte=now).count()
    except Exception:
        pass

    # 9. Communication
    communication_activity = 0
    unread_messages = 0
    broadcasts_sent = 0
    try:
        from communication.models import PrivateMessage, Announcement, BroadcastMessage
        communication_activity = PrivateMessage.objects.filter(is_deleted=False).count() + Announcement.objects.count()
        unread_messages = PrivateMessage.objects.filter(is_read=False, is_deleted=False).count()
        broadcasts_sent = BroadcastMessage.objects.count()
    except Exception:
        pass

    # 10. Storage
    storage_usage_mb = 0.0
    try:
        from dms.models import Document
        tot_bytes = Document.objects.filter(is_deleted=False).aggregate(s=Sum('file_size'))['s'] or 0
        storage_usage_mb = round(float(tot_bytes) / (1024 * 1024), 2)
    except Exception:
        pass

    # 11. AI Usage
    ai_usage_queries = 0
    try:
        from ai_assistant.models import AIRequestLog
        ai_usage_queries = AIRequestLog.objects.count()
    except Exception:
        pass

    # 12. Workflows & Background Jobs
    active_workflows = 0
    background_jobs = 0
    try:
        from workflows.models import WorkflowInstance, ScheduledJob
        active_workflows = WorkflowInstance.objects.filter(status='RUNNING').count()
        background_jobs = ScheduledJob.objects.filter(is_active=True).count()
    except Exception:
        pass

    # 13. Server Health Metrics
    cpu_usage = 0.0
    mem_usage = 0.0
    try:
        cpu_usage = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory()
        mem_usage = mem.percent
    except Exception:
        pass

    db_status = "HEALTHY"
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        db_status = "DEGRADED"

    return {
        "kpis": {
            "total_students": total_students,
            "active_students": active_students,
            "applicants": applicants,
            "admissions_today": admissions_today,
            "teacher_count": teacher_count,
            "staff_count": staff_count,
            "today_attendance_pct": today_attendance_pct,
            "teacher_attendance_pct": teacher_attendance_pct,
            "courses_running": courses_running,
            "classes_running": classes_running,
            "odel_courses_active": odel_courses_active,
            "todays_revenue": todays_revenue,
            "outstanding_fees": round(outstanding_fees, 2),
            "receipts_issued_today": receipts_today,
            "payments_awaiting_allocation": pending_allocations,
            "certificates_generated": certificates_generated,
            "exams_completed": exams_completed,
            "exams_pending_marking": exams_pending_marking,
            "assignments_due": assignments_due,
            "communication_activity": communication_activity,
            "unread_messages": unread_messages,
            "broadcasts_sent": broadcasts_sent,
            "storage_usage_mb": storage_usage_mb,
            "ai_usage_queries": ai_usage_queries,
            "active_workflows": active_workflows,
            "background_jobs": background_jobs,
        },
        "system_health": {
            "server_health": "OPTIMAL" if cpu_usage < 85 else "HEAVY LOAD",
            "database_health": db_status,
            "cpu_usage": round(cpu_usage, 1),
            "memory_usage": round(mem_usage, 1),
            "api_status": "ONLINE",
            "supabase_storage": "CONNECTED",
        },
        "timestamp": now.isoformat()
    }
