import datetime
from django.db.models import Sum, Count, Avg, Q


def execute_ai_query(prompt: str) -> dict:
    q = prompt.lower().strip()
    today = datetime.date.today()

    # 1. Today's Revenue
    if "today" in q and ("revenue" in q or "collection" in q or "paid" in q or "finance" in q):
        try:
            from finance.models import Payment
            pay = Payment.objects.filter(is_deleted=False, payment_date=today).exclude(status='CANCELLED')
            total = float(pay.aggregate(s=Sum('amount'))['s'] or 0.00)
            count = pay.count()
            return {
                "intent": "TODAYS_REVENUE",
                "summary": f"Today's total institutional revenue is KES {total:,.2f} collected across {count} verified transactions.",
                "data": {"todays_revenue": total, "transactions_count": count, "date": str(today)}
            }
        except Exception:
            return {
                "intent": "TODAYS_REVENUE",
                "summary": "Today's total revenue is KES 0.00 (0 transactions).",
                "data": {"todays_revenue": 0.00}
            }

    # 2. Unpaid Students / Outstanding Balances — via ledger aggregation per student
    if "unpaid" in q or "outstanding" in q or "balance" in q or "debt" in q or "defaulter" in q:
        unpaid_list = []
        tot_outstanding = 0.00
        try:
            from finance.models import StudentLedger
            from students.models import Student

            for s in Student.objects.filter(is_deleted=False).select_related('current_level'):
                balance = float(s.outstanding_balance)
                if balance > 0:
                    tot_outstanding += balance
                    unpaid_list.append({
                        "admission_number": s.admission_number,
                        "name": f"{s.first_name} {s.last_name}",
                        "balance": round(balance, 2),
                        "level": s.current_level.code if s.current_level else "N/A"
                    })
        except Exception:
            pass
        # Sort by balance descending
        unpaid_list.sort(key=lambda x: x['balance'], reverse=True)
        return {
            "intent": "UNPAID_STUDENTS",
            "summary": f"There are {len(unpaid_list)} students with outstanding balances totaling KES {tot_outstanding:,.2f}.",
            "data": {"total_outstanding": round(tot_outstanding, 2), "count": len(unpaid_list), "students": unpaid_list[:20]}
        }

    # 3. Attendance below 75% — live aggregation from Attendance model
    if "attendance" in q and ("below" in q or "<" in q or "low" in q or "poor" in q or "75" in q):
        low_att = []
        try:
            from attendance.models import Attendance
            from students.models import Student

            # Aggregate per student: count total sessions and present sessions
            from django.db.models import Count, Q as dbQ
            student_stats = Attendance.objects.values('student').annotate(
                total=Count('id'),
                present=Count('id', filter=dbQ(status='Present'))
            ).filter(total__gt=0)

            for row in student_stats:
                pct = round((row['present'] / row['total']) * 100, 1)
                if pct < 75:
                    try:
                        s = Student.objects.get(id=row['student'], is_deleted=False)
                        low_att.append({
                            "admission_number": s.admission_number,
                            "name": f"{s.first_name} {s.last_name}",
                            "attendance_pct": pct,
                            "level": s.current_level.code if s.current_level else "N/A",
                            "total_sessions": row['total'],
                            "present_sessions": row['present'],
                        })
                    except Exception:
                        pass
        except Exception:
            pass

        low_att.sort(key=lambda x: x['attendance_pct'])
        return {
            "intent": "LOW_ATTENDANCE",
            "summary": f"Found {len(low_att)} students with attendance records below the institutional threshold of 75%.",
            "data": {"count": len(low_att), "students": low_att[:20]}
        }

    # 4. Certificates issued today
    if "certificate" in q:
        cert_count = 0
        cert_total = 0
        try:
            from certificates.models import Certificate
            cert_count = Certificate.objects.filter(is_deleted=False, issue_date=today).count()
            cert_total = Certificate.objects.filter(is_deleted=False, status='ACTIVE').count()
        except Exception:
            pass
        return {
            "intent": "CERTIFICATES_ISSUED",
            "summary": f"A total of {cert_count} certificates were issued today ({today}). Institution total: {cert_total} active certificates.",
            "data": {"certificates_today": cert_count, "certificates_total": cert_total, "date": str(today)}
        }

    # 5. Pending Admissions — from AdmissionApplication in students.models
    if "admission" in q or "applicant" in q or "application" in q:
        pending_apps = 0
        interview_apps = 0
        approved_apps = 0
        try:
            from students.models import AdmissionApplication
            pending_apps = AdmissionApplication.objects.filter(
                status__in=['New', 'Admissions Queue', 'Under Review',
                            'Documents Pending', 'Placement Test Pending']
            ).count()
            interview_apps = AdmissionApplication.objects.filter(
                status='Interview Scheduled'
            ).count()
            approved_apps = AdmissionApplication.objects.filter(
                status__in=['Approved', 'Converted to Student']
            ).count()
        except Exception:
            pass
        return {
            "intent": "PENDING_ADMISSIONS",
            "summary": (
                f"There are currently {pending_apps} student applications awaiting review, "
                f"{interview_apps} interviews scheduled, and {approved_apps} approved admissions."
            ),
            "data": {
                "pending_admissions": pending_apps,
                "interviews_scheduled": interview_apps,
                "approved_admissions": approved_apps,
            }
        }

    # 6. Active Online Students
    if "online" in q or "active" in q or "studying" in q:
        online_students = 0
        try:
            from odel.models import StudentLessonProgress
            import datetime as dt
            since = dt.datetime.now() - dt.timedelta(hours=24)
            online_students = StudentLessonProgress.objects.filter(
                last_accessed_at__gte=since
            ).values('student').distinct().count()
        except Exception:
            pass
        return {
            "intent": "ACTIVE_ONLINE_STUDENTS",
            "summary": f"There are {online_students} students who have accessed ODEL content in the past 24 hours.",
            "data": {"online_students": online_students}
        }

    # 7. Executive Summary / General Query
    from .command_center import get_executive_overview
    overview = get_executive_overview()
    kpis = overview["kpis"]
    summary = (
        f"Institutional Executive Overview ({today}):\n"
        f"• Total Enrollment: {kpis['total_students']} students | Active: {kpis['active_students']} | "
        f"Classes Running: {kpis['classes_running']}.\n"
        f"• Today's Revenue: KES {kpis['todays_revenue']:,.2f} | Outstanding: KES {kpis['outstanding_fees']:,.2f}.\n"
        f"• Attendance Today: {kpis['today_attendance_pct']}% | "
        f"ODEL Active Courses: {kpis['odel_courses_active']}.\n"
        f"• System Status: {overview['system_health']['server_health']} | "
        f"DB: {overview['system_health']['database_health']}."
    )
    return {
        "intent": "EXECUTIVE_SUMMARY",
        "summary": summary,
        "data": overview
    }
