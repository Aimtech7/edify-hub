import datetime
from django.db.models import Avg, Count, Q


def get_exam_bi_data():
    """
    Examination Analytics — derives all metrics strictly from the results.Result model
    and odel.models (ExamSessionLog, ExamSubmission) which contain the actual exam records.
    """
    today = datetime.date.today()

    completed_exams = 0
    pending_marking = 0
    published_results = 0
    avg_score = 0.0
    pass_rate = 0.0
    total_results = 0
    grade_distribution = {}
    exam_sessions_total = 0
    exam_submissions_total = 0

    try:
        from results.models import Result

        total_results = Result.objects.filter(is_deleted=False).count()
        completed_exams = total_results
        pending_marking = Result.objects.filter(is_deleted=False, is_published=False).count()
        published_results = Result.objects.filter(is_deleted=False, is_published=True).count()

        # Average score from the stored aggregate field
        avg_agg = Result.objects.filter(
            is_deleted=False, is_published=True, average_score__isnull=False
        ).aggregate(avg=Avg('average_score'))
        avg_score = round(float(avg_agg['avg'] or 0.0), 2)

        # Pass rate: anything not 'Nicht Bestanden' is a pass
        if published_results > 0:
            passed = Result.objects.filter(
                is_deleted=False, is_published=True
            ).exclude(grade='Nicht Bestanden').count()
            pass_rate = round((passed / published_results) * 100, 1)

        # Grade distribution
        for row in Result.objects.filter(is_deleted=False, is_published=True).values('grade').annotate(
            count=Count('id')
        ):
            grade_distribution[row['grade'] or 'Ungraded'] = row['count']

    except Exception:
        pass

    # ODEL Exam Sessions (secure exam tracking)
    try:
        from odel.models import ExamSessionLog, ExamSubmission
        exam_sessions_total = ExamSessionLog.objects.count()
        exam_submissions_total = ExamSubmission.objects.count()
    except Exception:
        pass

    # Results by CEFR Level
    results_by_level = []
    try:
        from results.models import Result
        for row in Result.objects.filter(is_deleted=False).values('level__code').annotate(
            count=Count('id'),
            avg_score=Avg('average_score')
        ):
            results_by_level.append({
                "level": row['level__code'] or "N/A",
                "count": row['count'],
                "avg_score": round(float(row['avg_score'] or 0.0), 2)
            })
    except Exception:
        pass

    return {
        "kpis": {
            "total_results": total_results,
            "completed_exams": completed_exams,
            "pending_marking": pending_marking,
            "published_results": published_results,
            "avg_score": avg_score,
            "pass_rate": pass_rate,
            "exam_sessions": exam_sessions_total,
            "exam_submissions": exam_submissions_total,
        },
        "grade_distribution": grade_distribution,
        "results_by_level": results_by_level,
    }
