import datetime
from django.db.models import Count, Q


def get_certificate_bi_data():
    """
    Certificate Analytics — derives all metrics strictly from certificates.Certificate model.
    No estimates, no predictions.
    """
    today = datetime.date.today()

    issued_total = 0
    revoked_total = 0
    issued_today = 0
    by_type = {}
    by_level = []
    eligible_awaiting = 0

    try:
        from certificates.models import Certificate

        issued_total = Certificate.objects.filter(is_deleted=False, status='ACTIVE').count()
        revoked_total = Certificate.objects.filter(status='REVOKED').count()
        issued_today = Certificate.objects.filter(is_deleted=False, issue_date=today).count()

        # Breakdown by certificate type
        for row in Certificate.objects.filter(is_deleted=False).values('certificate_type').annotate(
            count=Count('id')
        ):
            by_type[row['certificate_type'] or 'Unknown'] = row['count']

        # Breakdown by CEFR level
        for row in Certificate.objects.filter(is_deleted=False, status='ACTIVE').values('level__code').annotate(
            count=Count('id')
        ):
            by_level.append({
                "level": row['level__code'] or "N/A",
                "count": row['count']
            })

    except Exception:
        pass

    # Eligible students awaiting certificates: have completed all required results
    # at their level with is_published=True, but don't yet have a certificate for that level
    try:
        from results.models import Result
        from certificates.models import Certificate
        from students.models import Student

        # Students who have a published result but no certificate for that level
        students_with_results = Result.objects.filter(
            is_deleted=False, is_published=True
        ).exclude(
            grade='Nicht Bestanden'
        ).values('student_id', 'level_id').distinct()

        for row in students_with_results:
            has_cert = Certificate.objects.filter(
                student_id=row['student_id'],
                level_id=row['level_id'],
                is_deleted=False,
                status='ACTIVE'
            ).exists()
            if not has_cert:
                eligible_awaiting += 1

    except Exception:
        pass

    # Recent certificates issued (last 10)
    recent_certificates = []
    try:
        from certificates.models import Certificate
        for cert in Certificate.objects.filter(is_deleted=False, status='ACTIVE').select_related(
            'student', 'level'
        ).order_by('-issue_date')[:10]:
            recent_certificates.append({
                "certificate_number": cert.certificate_number,
                "student": cert.student.admission_number,
                "name": f"{cert.student.first_name} {cert.student.last_name}",
                "level": cert.level.code if cert.level else "N/A",
                "type": cert.certificate_type,
                "issue_date": str(cert.issue_date),
            })
    except Exception:
        pass

    return {
        "kpis": {
            "issued_total": issued_total,
            "revoked_total": revoked_total,
            "issued_today": issued_today,
            "eligible_awaiting": eligible_awaiting,
        },
        "by_type": by_type,
        "by_level": by_level,
        "recent_certificates": recent_certificates,
    }
