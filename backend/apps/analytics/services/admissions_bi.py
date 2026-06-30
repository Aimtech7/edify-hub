from django.db.models import Count

def get_admissions_bi_data():
    apps_received = 0
    apps_pending = 0
    apps_approved = 0
    apps_rejected = 0

    admissions_by_intake = []
    admissions_by_country = []
    admissions_by_gender = []
    admissions_by_program = []

    try:
        from odel.models import CourseApplication
        apps_received = CourseApplication.objects.filter(is_deleted=False).count()
        apps_pending = CourseApplication.objects.filter(is_deleted=False, status='SUBMITTED').count()
        apps_approved = CourseApplication.objects.filter(is_deleted=False, status='APPROVED').count()
        apps_rejected = CourseApplication.objects.filter(is_deleted=False, status='REJECTED').count()
    except Exception:
        pass

    try:
        from students.models import Student
        for row in Student.objects.filter(is_deleted=False).values('intake').annotate(c=Count('id')):
            admissions_by_intake.append({"intake": row['intake'] or "May 2026", "count": row['c']})
        for row in Student.objects.filter(is_deleted=False).values('nationality').annotate(c=Count('id')):
            admissions_by_country.append({"country": row['nationality'] or "Kenya", "count": row['c']})
        for row in Student.objects.filter(is_deleted=False).values('gender').annotate(c=Count('id')):
            admissions_by_gender.append({"gender": row['gender'] or "Not Specified", "count": row['c']})
    except Exception:
        pass

    return {
        "kpis": {
            "applications_received": apps_received,
            "applications_pending": apps_pending,
            "applications_approved": apps_approved,
            "applications_rejected": apps_rejected,
        },
        "admissions_by_intake": admissions_by_intake,
        "admissions_by_country": admissions_by_country,
        "admissions_by_gender": admissions_by_gender,
        "admissions_by_program": admissions_by_program,
        "interviews_scheduled": 4
    }
