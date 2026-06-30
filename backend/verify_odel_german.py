import os
import sys
import django

if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from academics.models import Level, Cohort, VirtualClass, VirtualAttendanceLog
from odel.services.virtual_classroom_service import VirtualClassroomService
from odel.services.german_ai_coach import GermanAICoachService
from odel.services.transcript_service import TranscriptService
from students.models import Student
from attendance.models import Attendance

User = get_user_model()

def run_verification():
    print("======================================================================")
    print("VERIFYING HORIZON PHASE 5: GERMAN LANGUAGE TEACHING PLATFORM & ODEL")
    print("======================================================================")
    errors = []

    # Test 1: Verify 11 German Levels
    print("\n[Test 1] Checking 11 CEFR German Levels (A1.1 to C2)...")
    levels = Level.objects.filter(code__in=["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2", "B2.1", "B2.2", "C1.1", "C1.2", "C2"])
    if levels.count() < 11:
        errors.append(f"Expected 11 levels, found {levels.count()}")
    else:
        print(f"  -> PASSED: All 11 German Levels verified ({', '.join([l.code for l in levels])})")

    # Test 2: Virtual Classroom & Attendance Sync
    print("\n[Test 2] Testing Zoom/BBB Virtual Classroom & SIS Attendance Sync...")
    teacher = User.objects.filter(role="TEACHER").first() or User.objects.first()
    cohort = Cohort.objects.first()
    student = Student.objects.first()

    if not cohort or not student:
        print("  -> WARNING: No cohort or student found. Creating dummy student for verification.")
        u, _ = User.objects.get_or_create(username="verify_stu_ger", defaults={"role": "STUDENT"})
        student, _ = Student.objects.get_or_create(user=u, defaults={"admission_number": "GER-VER-001", "first_name": "Hans", "last_name": "Zimmer"})
        b1 = Level.objects.filter(code="B1.1").first()
        if b1:
            student.current_level = b1
            student.save()
        if not cohort:
            cohort, _ = Cohort.objects.get_or_create(name="Verify-German-Cohort", level=b1, defaults={"instructor": teacher})

    vc = VirtualClassroomService.schedule_meeting(
        cohort=cohort,
        teacher=teacher,
        platform="Zoom",
        date=django.utils.timezone.now().date(),
        start_time=django.utils.timezone.now().time(),
        end_time=(django.utils.timezone.now() + django.utils.timezone.timedelta(hours=1)).time()
    )

    log = VirtualClassroomService.record_attendance_telemetry(vc.id, student.id, connection_interruptions=1)
    if not log or log.attendance_percentage <= 0:
        errors.append("Virtual attendance telemetry calculation failed")
    else:
        # Check if SIS attendance synced
        att = Attendance.objects.filter(student=student, cohort=cohort, date=vc.date).first()
        if not att:
            errors.append("Attendance did not sync back to physical SIS ledger")
        else:
            print(f"  -> PASSED: Zoom Room {vc.meeting_id} created, Telemetry logged ({log.attendance_percentage}%), SIS synced ({att.status})")

    # Test 3: German AI Coach
    print("\n[Test 3] Testing German AI Language Coach...")
    ai_res = GermanAICoachService.assist(intent="GRAMMAR", prompt="Explain Akkusativ vs Dativ", level_code="B1.1")
    if not ai_res or "Akkusativ" not in ai_res.get("response", ""):
        errors.append("AI Coach grammar inquiry failed")
    else:
        print(f"  -> PASSED: AI Coach generated accurate response for level {ai_res['level']}")

    # Test 4: Transcript Service
    print("\n[Test 4] Testing Academic Transcript Service...")
    transcript = TranscriptService.generate_academic_transcript(student.id)
    if not transcript or "transcript_id" not in transcript:
        errors.append("Transcript generation failed")
    else:
        print(f"  -> PASSED: Transcript {transcript['transcript_id']} generated for {transcript['student_info']['full_name']}")

    print("\n======================================================================")
    if errors:
        print("VERIFICATION FAILED WITH ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("VERIFICATION PASSED 100%! ALL PHASE 5 GERMAN PLATFORM TESTS SUCCESSFUL.")
        print("======================================================================")
        sys.exit(0)

if __name__ == "__main__":
    run_verification()
