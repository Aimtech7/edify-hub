from django.db.models import Count


def get_admissions_bi_data():
    apps_received = 0
    apps_pending = 0
    apps_approved = 0
    apps_rejected = 0
    interviews_scheduled = 0

    admissions_by_intake = []
    admissions_by_country = []
    admissions_by_gender = []
    admissions_by_program = []

    # AdmissionApplication is in students.models, NOT odel
    try:
        from students.models import AdmissionApplication
        apps_received = AdmissionApplication.objects.count()
        apps_pending = AdmissionApplication.objects.filter(
            status__in=['New', 'Admissions Queue', 'Under Review', 'Documents Pending',
                        'Placement Test Pending']
        ).count()
        apps_approved = AdmissionApplication.objects.filter(
            status__in=['Approved', 'Converted to Student']
        ).count()
        apps_rejected = AdmissionApplication.objects.filter(status='Rejected').count()
        interviews_scheduled = AdmissionApplication.objects.filter(
            status='Interview Scheduled'
        ).count()
    except Exception:
        pass

    try:
        from students.models import Student
        for row in Student.objects.filter(is_deleted=False).values('intake__name').annotate(c=Count('id')):
            admissions_by_intake.append({"intake": row['intake__name'] or 'Not Specified', "count": row['c']})

        for row in Student.objects.filter(is_deleted=False).values('user__profile__nationality').annotate(c=Count('id')):
            country = row.get('user__profile__nationality') or 'Not Specified'
            admissions_by_country.append({"country": country, "count": row['c']})

        for row in Student.objects.filter(is_deleted=False).values('gender').annotate(c=Count('id')):
            admissions_by_gender.append({"gender": row['gender'] or 'Not Specified', "count": row['c']})
    except Exception:
        pass

    # Also try nationality from AdmissionApplication
    if not admissions_by_country:
        try:
            from students.models import AdmissionApplication
            for row in AdmissionApplication.objects.values('nationality').annotate(c=Count('id')):
                admissions_by_country.append({"country": row['nationality'] or 'Not Specified', "count": row['c']})
        except Exception:
            pass

    return {
        "kpis": {
            "applications_received": apps_received,
            "applications_pending": apps_pending,
            "applications_approved": apps_approved,
            "applications_rejected": apps_rejected,
            "interviews_scheduled": interviews_scheduled,
        },
        "admissions_by_intake": admissions_by_intake,
        "admissions_by_country": admissions_by_country,
        "admissions_by_gender": admissions_by_gender,
        "admissions_by_program": admissions_by_program,
    }
