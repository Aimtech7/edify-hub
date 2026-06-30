import datetime
from django.db.models import Count, Avg, Q


def get_academic_bi_data():
    today = datetime.date.today()
    enrollment_by_level = []
    enrollment_by_intake = []
    enrollment_by_campus = []
    teacher_workload = []
    class_sizes = []

    # --- Live attendance rate from Attendance model ---
    attendance_rate = 0.0
    try:
        from attendance.models import Attendance
        total_records = Attendance.objects.count()
        if total_records > 0:
            present_records = Attendance.objects.filter(status='Present').count()
            attendance_rate = round((present_records / total_records) * 100, 1)
    except Exception:
        pass

    # --- Live course completion rate from ODEL StudentLessonProgress ---
    course_completion = 0.0
    try:
        from odel.models import StudentLessonProgress, Lesson
        total_lessons = Lesson.objects.filter(is_published=True, status='PUBLISHED').count()
        total_progress_records = StudentLessonProgress.objects.count()
        completed_records = StudentLessonProgress.objects.filter(is_completed=True).count()
        if total_progress_records > 0:
            course_completion = round((completed_records / total_progress_records) * 100, 1)
    except Exception:
        pass

    # --- Live exam pass rate from results.Result ---
    exam_pass_rate = 0.0
    try:
        from results.models import Result
        total_results = Result.objects.filter(is_deleted=False, is_published=True).count()
        if total_results > 0:
            passed = Result.objects.filter(
                is_deleted=False,
                is_published=True
            ).exclude(grade='Nicht Bestanden').count()
            exam_pass_rate = round((passed / total_results) * 100, 1)
    except Exception:
        pass

    # --- Enrollment by CEFR Level ---
    try:
        from students.models import Student
        for row in Student.objects.filter(is_deleted=False).values('current_level__code').annotate(c=Count('id')):
            lvl = row['current_level__code'] or 'Unassigned'
            enrollment_by_level.append({"level": lvl, "count": row['c']})

        for row in Student.objects.filter(is_deleted=False).values('intake__name').annotate(c=Count('id')):
            intake = row['intake__name'] or 'Not Specified'
            enrollment_by_intake.append({"intake": intake, "count": row['c']})

        for row in Student.objects.filter(is_deleted=False).values('campus__name').annotate(c=Count('id')):
            c = row['campus__name'] or 'Main Campus'
            enrollment_by_campus.append({"campus": c, "count": row['c']})
    except Exception:
        pass

    # --- Teacher workload: live from Cohort with instructor ---
    try:
        from academics.models import Cohort
        from accounts.models import User
        teachers = User.objects.filter(role='TEACHER', is_active=True)
        for t in teachers[:10]:
            # Count cohorts assigned to this teacher
            cohort_count = Cohort.objects.filter(instructor=t).count()
            # Count distinct students in those cohorts
            students_count = Student.objects.filter(
                current_cohort__instructor=t, is_deleted=False
            ).count()
            teacher_workload.append({
                "name": t.get_full_name() or t.username,
                "classes_assigned": cohort_count,
                "students_taught": students_count
            })
    except Exception:
        pass

    # --- Class sizes from Cohort (actual class model) ---
    try:
        from academics.models import Cohort
        from students.models import Student
        for cg in Cohort.objects.all()[:10]:
            student_count = Student.objects.filter(
                current_cohort=cg, is_deleted=False
            ).count()
            class_sizes.append({
                "class_name": cg.name,
                "level": cg.level.code if cg.level else "N/A",
                "students": student_count
            })
    except Exception:
        pass

    return {
        "enrollment_by_level": enrollment_by_level,
        "enrollment_by_intake": enrollment_by_intake,
        "enrollment_by_campus": enrollment_by_campus,
        "teacher_workload": teacher_workload,
        "class_sizes": class_sizes,
        "kpis": {
            "attendance_rate": attendance_rate,
            "course_completion": course_completion,
            "exam_pass_rate": exam_pass_rate,
        }
    }
