import os
import django
from datetime import date, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from academics.models import Level, Program, Cohort, VirtualClass
from accounts.models import User
from odel.models import Course, Subject, Unit, Module, Lesson, Topic, Resource

def seed():
    print("Seeding ODEL Course Hierarchy...")
    instructor = User.objects.filter(role='TEACHER').first()
    if not instructor:
        instructor = User.objects.create_user(username='odel_instructor', email='odel@da.com', password='password', role='TEACHER')

    b2_1 = Level.objects.filter(code="B2.1").first()
    if not b2_1:
        b2_1 = Level.objects.filter(code="B2").first()

    prog = Program.objects.filter(code="IGD").first()

    course, _ = Course.objects.get_or_create(
        code="ODEL-DEUTSCH-B2",
        defaults={
            'title': "ODEL Intensive German B2 - Beruf & Alltag",
            'program': prog,
            'level': b2_1,
            'description': "Comprehensive online distance learning course for German B2 level.",
            'is_published': True,
            'instructor': instructor
        }
    )

    subj, _ = Subject.objects.get_or_create(
        course=course,
        code="SPR-BERUF",
        defaults={'title': "Sprechen im Beruf", 'order': 1}
    )

    unit, _ = Unit.objects.get_or_create(
        subject=subj,
        title="Unit 1: Die erfolgreiche Bewerbung",
        defaults={'order': 1, 'description': "Mastering job applications and interviews in German."}
    )

    mod, _ = Module.objects.get_or_create(
        unit=unit,
        title="Module 1.1: Vorbereitung auf das Vorstellungsgespräch",
        defaults={'order': 1, 'estimated_duration_minutes': 120}
    )

    print("Creating Virtual Classroom link...")
    cohort = Cohort.objects.first()
    vclass = None
    if cohort:
        vclass, _ = VirtualClass.objects.get_or_create(
            cohort=cohort,
            platform="Zoom",
            date=date.today(),
            defaults={
                'teacher': instructor,
                'meeting_link': "https://zoom.us/j/9988776655",
                'meeting_id': "998 877 6655",
                'passcode': "DEUTSCH",
                'start_time': time(10, 0),
                'end_time': time(11, 30)
            }
        )

    print("Creating Lessons across all 9 Media Types...")
    lessons_data = [
        ("VIDEO", "L1: Video-Einführung in Bewerbungen", "https://www.youtube.com/embed/dQw4w9WgXcQ", 600, ""),
        ("AUDIO", "L2: Hörverstehen - Telefoninterview", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 180, ""),
        ("PDF", "L3: Grammatik-Leitfaden (Konjunktiv II)", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", 300, ""),
        ("PPT", "L4: Präsentation - Typische Interviewfragen", "https://example.com/slides.pptx", 400, ""),
        ("HTML", "L5: Lesetext - Redemittel und Höflichkeitsformen", "", 240, "<h3>Wichtige Redemittel</h3><p>Ich interessiere mich sehr für die Position, weil...</p>"),
        ("INTERACTIVE", "L6: Interaktives Quiz - Wortschatz", "https://h5p.org/h5p/embed/617", 300, ""),
        ("SCORM", "L7: SCORM E-Learning Modul - Rollenspiel", "https://scorm.example.com/index.html", 900, ""),
        ("EXTERNAL_URL", "L8: DW Deutsch Lernen - Wirtschaftstexte", "https://www.dw.com/de/deutsch-lernen/s-2055", 300, ""),
        ("DOWNLOAD", "L9: Arbeitsblatt zum Herunterladen (.docx)", "https://example.com/worksheet.docx", 120, ""),
    ]

    prev_lesson = None
    for order, (mtype, title, url, dur, html) in enumerate(lessons_data, start=1):
        lesson, created = Lesson.objects.get_or_create(
            module=mod,
            title=title,
            defaults={
                'order': order,
                'media_type': mtype,
                'content_url': url,
                'body_html': html,
                'duration_seconds': dur,
                'is_mandatory': True,
                'prerequisite': prev_lesson,
                'virtual_class': vclass if order == 1 else None
            }
        )
        if not created:
            lesson.prerequisite = prev_lesson
            lesson.save()
        prev_lesson = lesson

        if order == 1:
            Topic.objects.get_or_create(lesson=lesson, title="Begrüßung und Selbstpräsentation", defaults={'order': 1, 'summary': "How to introduce yourself professionally."})
            Resource.objects.get_or_create(lesson=lesson, title="Checkliste_Bewerbung.pdf", defaults={'file': 'odel/resources/checkliste.pdf'})

    print("ODEL Seeding completed successfully!")

if __name__ == '__main__':
    seed()
