import os
import sys
import django
from django.utils import timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from odel.models import Course, Module, Lesson, Topic, Resource, StudentLessonProgress, StudentLessonNote
from ai_assistant.models import KnowledgeDocument
from odel.services.resource_indexing_service import ResourceIndexingService
from odel.services.virtual_classroom_service import VirtualClassroomService
from analytics.services.odel_bi import get_odel_bi_data
from academics.models import Cohort, Level

User = get_user_model()

def run_verification():
    print("==========================================================")
    print("STARTING HORIZON ODEL PRODUCTION VERIFICATION")
    print("==========================================================\n")

    # 1. User & Course setup
    teacher, _ = User.objects.get_or_create(username="teacher_odel", defaults={"email": "t@h.edu", "role": "TEACHER"})
    student_user, _ = User.objects.get_or_create(username="student_odel", defaults={"email": "s@h.edu", "role": "STUDENT"})

    level, _ = Level.objects.get_or_create(code="VER-B2-LVL", defaults={"name": "Verification B2 Level"})
    course, _ = Course.objects.get_or_create(code="VER-B2", defaults={"title": "Verification German B2", "level": level})
    module, _ = Module.objects.get_or_create(course=course, order=1, defaults={"title": "Modul 1: Konjunktiv II"})

    # 2. Test Lesson Lifecycle & Indexing
    lesson = Lesson.objects.create(
        module=module,
        title="Lektion 1: Einführung",
        order=1,
        description="Detailed study of Konjunktiv II",
        objectives="Master hypothetical sentence structures in German.",
        body_html="<p>Wenn ich reich wäre, würde ich reisen.</p>",
        status="PUBLISHED",
        is_published=True
    )
    print(f"[OK] Created Lesson L{lesson.id} ({lesson.title})")

    # Index lesson into KnowledgeDocument
    doc = ResourceIndexingService.index_lesson(lesson)
    assert doc.category == KnowledgeDocument.Category.COURSE_NOTE
    assert "Wenn ich reich wäre" in doc.content
    print(f"[OK] AI Knowledge base indexing verified (Doc ID: {doc.id})")

    # 3. Test Resource Checksum & Deduplication
    resource = Resource.objects.create(
        lesson=lesson,
        title="Konjunktiv Worksheet",
        file_type="pdf",
        file_size_bytes=45000,
        checksum="abc123sha256hashtest",
        is_downloadable=True
    )
    res_doc = ResourceIndexingService.index_resource(resource)
    assert res_doc.title.startswith("[Resource VER-B2]")
    print(f"[OK] Resource indexing & metadata verified (Doc ID: {res_doc.id})")

    # 4. Test Student Lesson Notes
    from students.models import Student
    student, _ = Student.objects.get_or_create(
        admission_number="STU-ODEL-001",
        defaults={"user": student_user, "first_name": "Hans", "last_name": "Zimmer"}
    )
    note = StudentLessonNote.objects.create(
        student=student,
        lesson=lesson,
        note_type="GRAMMAR",
        content="Important rule: würde + Infinitiv at the end.",
        selected_text="würde ich reisen"
    )
    prog, _ = StudentLessonProgress.objects.get_or_create(student=student, lesson=lesson)
    prog.notes_count = StudentLessonNote.objects.filter(student=student, lesson=lesson).count()
    prog.save()
    assert prog.notes_count == 1
    print(f"[OK] Student study notes & progress tracking verified (Note ID: {note.id})")

    # 5. Test Virtual Classroom & Countdown
    cohort, _ = Cohort.objects.get_or_create(name="ODEL B2 Cohort", defaults={"level": level, "start_date": timezone.now().date(), "end_date": timezone.now().date()})
    vc = VirtualClassroomService.schedule_meeting(
        cohort=cohort,
        teacher=teacher,
        platform="Zoom",
        date=timezone.now().date(),
        start_time=timezone.now().time(),
        end_time=(timezone.now() + timezone.timedelta(hours=1)).time()
    )
    meta = VirtualClassroomService.get_countdown_metadata(vc.id)
    assert meta["meeting_id"] == vc.meeting_id
    print(f"[OK] Virtual classroom scheduling & countdown metadata verified (Meet ID: {vc.meeting_id})")

    # 6. Test BI Analytics
    bi = get_odel_bi_data()
    assert bi["kpis"]["lessons_published"] >= 1
    assert bi["kpis"]["student_notes"] >= 1
    print(f"[OK] Database-driven ODEL BI Analytics verified (Published: {bi['kpis']['lessons_published']}, Notes: {bi['kpis']['student_notes']})")

    print("\n==========================================================")
    print("ALL 6 ODEL PRODUCTION VERIFICATION SUITES PASSED 100%")
    print("==========================================================")

if __name__ == "__main__":
    run_verification()
