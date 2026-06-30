import datetime
from django.db.models import Sum, Count, Q

def generate_filtered_report(report_type: str, filters: dict) -> dict:
    today = datetime.date.today()
    campus = filters.get("campus")
    level = filters.get("cefr_level") or filters.get("level")
    payment_method = filters.get("payment_method")
    start_date = filters.get("start_date")
    end_date = filters.get("end_date")

    rows = []
    summary_stats = {}

    if report_type == "FINANCE":
        try:
            from finance.models import Payment
            qs = Payment.objects.filter(is_deleted=False).exclude(status='CANCELLED')
            if payment_method:
                qs = qs.filter(payment_method__iexact=payment_method)
            if start_date:
                qs = qs.filter(payment_date__gte=start_date)
            if end_date:
                qs = qs.filter(payment_date__lte=end_date)
            if level:
                qs = qs.filter(student__current_level__code__iexact=level)

            tot = float(qs.aggregate(s=Sum('amount'))['s'] or 0.00)
            summary_stats = {"total_collections": tot, "transaction_count": qs.count()}
            for p in qs.select_related('student')[:50]:
                rows.append({
                    "receipt_number": p.receipt_number,
                    "student": p.student.admission_number if p.student else "N/A",
                    "payer": p.payer_name,
                    "amount": float(p.amount),
                    "method": p.payment_method,
                    "date": str(p.payment_date),
                    "status": p.status
                })
        except Exception:
            pass

    elif report_type == "STUDENT" or report_type == "ACADEMIC":
        try:
            from students.models import Student
            qs = Student.objects.filter(is_deleted=False)
            if campus:
                qs = qs.filter(campus__icontains=campus)
            if level:
                qs = qs.filter(current_level__code__iexact=level)

            summary_stats = {"total_students": qs.count()}
            for s in qs.select_related('current_level')[:50]:
                rows.append({
                    "admission_number": s.admission_number,
                    "name": f"{s.first_name} {s.last_name}",
                    "level": s.current_level.code if s.current_level else "General",
                    "intake": getattr(s, 'intake', 'N/A'),
                    "campus": getattr(s, 'campus', 'Main Campus'),
                    "status": getattr(s, 'status', 'ACTIVE')
                })
        except Exception:
            pass

    elif report_type == "ATTENDANCE":
        try:
            from attendance.models import AttendanceRecord
            qs = AttendanceRecord.objects.all()
            if start_date:
                qs = qs.filter(session__date__gte=start_date)
            summary_stats = {"total_records": qs.count()}
            for r in qs.select_related('student', 'session')[:50]:
                rows.append({
                    "date": str(r.session.date) if r.session else str(today),
                    "student": r.student.admission_number if r.student else "N/A",
                    "status": r.status,
                    "remarks": getattr(r, 'remarks', '')
                })
        except Exception:
            pass

    else:
        summary_stats = {"total_records": 0, "report_type": report_type}

    return {
        "report_type": report_type,
        "generated_at": datetime.datetime.now().isoformat(),
        "filters_applied": filters,
        "summary": summary_stats,
        "row_count": len(rows),
        "data": rows
    }
