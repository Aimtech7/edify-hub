import os
import sys
import django
import datetime
from django.utils import timezone

if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from academics.models import Level, Cohort, VirtualClass, Department, Program, ProgressionRule
from odel.models import Course, Subject, Unit, Module, Lesson, DiscussionForum, ForumThread, Assignment, OfficialExamination
from odel.services.virtual_classroom_service import VirtualClassroomService
from students.models import Student

User = get_user_model()

GERMAN_LEVELS = [
    ("A1.1", "Grundstufe A1.1", "Beginner German Part 1 - Alphabet, Greetings, Basic Numbers, Regular Verbs", 8, "A1", None),
    ("A1.2", "Grundstufe A1.2", "Beginner German Part 2 - Accusative Case, Daily Routine, Food & Drink", 8, "A1", "A1.1"),
    ("A2.1", "Grundstufe A2.1", "Elementary German Part 1 - Dative Case, Perfekt Tense, Traveling", 8, "A2", "A1.2"),
    ("A2.2", "Grundstufe A2.2", "Elementary German Part 2 - Subordinate Clauses, Modal Verbs, Workplace", 8, "A2", "A2.1"),
    ("B1.1", "Mittelstufe B1.1", "Intermediate German Part 1 - Konjunktiv II, Career & Society, Media", 10, "B1", "A2.2"),
    ("B1.2", "Mittelstufe B1.2", "Intermediate German Part 2 - Passive Voice, Goethe-Zertifikat B1 Exam Prep", 10, "B1", "B1.1"),
    ("B2.1", "Mittelstufe B2.1", "Upper Intermediate Part 1 - Complex Syntax, Academic Reading, Debate", 12, "B2", "B1.2"),
    ("B2.2", "Mittelstufe B2.2", "Upper Intermediate Part 2 - Professional & Medical German, Formal Writing", 12, "B2", "B2.1"),
    ("C1.1", "Oberstufe C1.1", "Advanced German Part 1 - Literary Analysis, Scientific Discourses", 14, "C1", "B2.2"),
    ("C1.2", "Oberstufe C1.2", "Advanced German Part 2 - TestDaF & DSH Mastery, Rhetorical Precision", 14, "C1", "C1.1"),
    ("C2",   "Großes Deutsches Sprachdiplom C2", "Native Mastery - Near-native fluency across academic, legal, and cultural domains", 16, "C2", "C1.2"),
]

def seed_german_platform():
    print("======================================================================")
    print("SEEDING HORIZON PHASE 5: GERMAN LANGUAGE TEACHING PLATFORM & ODEL")
    print("======================================================================")

    # Ensure teacher and admin exist
    teacher, _ = User.objects.get_or_create(username="herr_muller", defaults={
        "first_name": "Thomas", "last_name": "Müller", "email": "muller@horizon.edu", "role": "TEACHER"
    })
    admin, _ = User.objects.get_or_create(username="admin", defaults={
        "first_name": "System", "last_name": "Admin", "email": "admin@horizon.edu", "role": "ADMIN"
    })

    dept, _ = Department.objects.get_or_create(code="GER", defaults={"name": "Department of German Language & Culture", "head": teacher})
    prog, _ = Program.objects.get_or_create(code="GER-DIP", defaults={"name": "Diploma in German Language Competency", "department": dept, "duration_months": 24})

    level_objects = {}
    for code, name, desc, weeks, cefr, parent_code in GERMAN_LEVELS:
        parent_obj = level_objects.get(parent_code) if parent_code else None
        lvl, created = Level.objects.update_or_create(
            code=code,
            defaults={
                "name": name,
                "description": desc,
                "duration_weeks": weeks,
                "cefr_category": cefr,
                "parent_level": parent_obj
            }
        )
        ProgressionRule.objects.update_or_create(
            level=lvl,
            defaults={
                "min_attendance_percentage": 75.0,
                "min_exam_score_percentage": 60.0,
                "min_assignments_completed": 4
            }
        )
        level_objects[code] = lvl
        print(f"  [Level Seeded] {code}: {name} ({weeks} wks)")

    # Seed Cohorts / Class Modes (Physical, Virtual, Hybrid, Weekend, Evening, Conversation Club)
    b1_level = level_objects["B1.1"]
    today = datetime.date.today()
    
    cohorts_to_create = [
        ("B1.1-Hybrid-Morning", "Hybrid Classes"),
        ("B1.1-Virtual-Evening", "Virtual Classes"),
        ("B1.1-Physical-Weekend", "Weekend Classes"),
        ("B1.1-Conversation-Club", "Conversation Clubs"),
    ]
    
    cohort_objs = {}
    for c_name, mode in cohorts_to_create:
        ch, _ = Cohort.objects.update_or_create(
            name=c_name,
            level=b1_level,
            defaults={
                "instructor": teacher,
                "start_date": today - datetime.timedelta(days=14),
                "end_date": today + datetime.timedelta(days=56)
            }
        )
        cohort_objs[c_name] = ch

    # Seed Zoom & BigBlueButton Virtual Classrooms
    vc_zoom = VirtualClassroomService.schedule_meeting(
        cohort=cohort_objs["B1.1-Virtual-Evening"],
        teacher=teacher,
        platform="Zoom",
        date=today,
        start_time=datetime.time(18, 0),
        end_time=datetime.time(19, 30),
        waiting_room=True,
        is_recurring=True
    )
    vc_bbb = VirtualClassroomService.schedule_meeting(
        cohort=cohort_objs["B1.1-Conversation-Club"],
        teacher=teacher,
        platform="BBB",
        date=today + datetime.timedelta(days=1),
        start_time=datetime.time(16, 0),
        end_time=datetime.time(17, 30),
        waiting_room=True,
        is_recurring=False
    )
    print(f"  [Virtual Classes] Zoom Scheduled: {vc_zoom.meeting_id} | BigBlueButton Scheduled: {vc_bbb.meeting_id}")

    # Seed ODEL Course & Multimedia Lessons
    course, _ = Course.objects.update_or_create(
        code="GER-B11-01",
        defaults={
            "title": "B1.1 Komplettkurs: Grammatik & Konversation",
            "program": prog,
            "level": b1_level,
            "description": "Comprehensive German B1.1 module covering advanced subordinate syntax, career vocabulary, and speaking immersion.",
            "is_published": True,
            "instructor": teacher
        }
    )

    subj, _ = Subject.objects.update_or_create(course=course, code="GRAM-B1", defaults={"title": "Grammatik & Struktur", "order": 1})
    unit, _ = Unit.objects.update_or_create(subject=subj, title="Nebensätze und Konjunktiv II", defaults={"order": 1})
    mod, _ = Module.objects.update_or_create(unit=unit, course=course, title="Modul 1: Wünsche und Ratschläge äußern", defaults={"order": 1, "estimated_duration_minutes": 120})

    l1, _ = Lesson.objects.update_or_create(
        module=mod,
        order=1,
        defaults={
            "title": "Lektion 1: Einführung in den Konjunktiv II (Video)",
            "media_type": Lesson.MediaType.VIDEO,
            "content_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "body_html": "<p>In this video lecture, Herr Müller explains how to construct Konjunktiv II forms using <em>würde + Infinitiv</em>, <em>hätte</em>, and <em>wäre</em>.</p>",
            "duration_seconds": 600,
            "is_published": True,
            "virtual_class": vc_zoom
        }
    )

    l2, _ = Lesson.objects.update_or_create(
        module=mod,
        order=2,
        defaults={
            "title": "Lektion 2: Übungsblatt Konjunktiv II (PDF & interaktiv)",
            "media_type": Lesson.MediaType.PDF,
            "content_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            "body_html": "<p>Read the PDF worksheet carefully and complete the exercises below.</p>",
            "duration_seconds": 1200,
            "is_published": True,
            "prerequisite": l1
        }
    )

    # Seed Discussion Forum
    forum, _ = DiscussionForum.objects.get_or_create(course=course, defaults={"title": f"Diskussionsforum: {course.code}", "description": "Ask grammar questions and practice German conversation with peers."})
    thread, _ = ForumThread.objects.get_or_create(
        forum=forum,
        title="Wann benutzt man 'wäre' statt 'würde sein'?",
        defaults={
            "author": teacher,
            "body": "Hallo zusammen! Bitte schreibt hier eure Beispielsätze im Konjunktiv II.",
            "is_pinned": True
        }
    )

    # Seed Assignment
    assign, _ = Assignment.objects.update_or_create(
        lesson=l2,
        defaults={
            "title": "Schriftliche Aufgabe B1.1: Bewerbungsbrief im Konjunktiv II",
            "description": "Write a formal 150-word letter applying for an internship in Berlin, utilizing at least 5 Konjunktiv II structures.",
            "max_marks": 100.0,
            "rubric_text": "Grammar accuracy (40%), Vocabulary richness (30%), Formal etiquette (30%)"
        }
    )

    # Seed Official Exam
    Exam, _ = OfficialExamination.objects.update_or_create(
        exam_code="GOETHE-MOCK-B11",
        defaults={
            "title": "Offizielle Goethe-Zertifikat B1.1 Probeprüfung",
            "course": course,
            "level": b1_level,
            "exam_type": OfficialExamination.ExamType.GOETHE_MOCK,
            "duration_minutes": 120,
            "maximum_marks": 100.0,
            "passing_marks": 60.0,
            "start_datetime": timezone.now() - datetime.timedelta(hours=1),
            "end_datetime": timezone.now() + datetime.timedelta(days=7),
            "publish_status": OfficialExamination.PublishStatus.PUBLISHED
        }
    )

    print("======================================================================")
    print("GERMAN LANGUAGE TEACHING PLATFORM SUCCESSFULLY SEEDED!")
    print("======================================================================")

if __name__ == "__main__":
    seed_german_platform()
