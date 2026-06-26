import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from academics.models import (
    AcademicYear, Semester, Term, Department, Program,
    Level, ProgressionRule, GraduationRule
)

def seed():
    print("Seeding Academic Year, Semester, Term...")
    ay, _ = AcademicYear.objects.get_or_create(
        year="2025/2026",
        defaults={'start_date': date(2025, 9, 1), 'end_date': date(2026, 8, 31), 'is_current': True}
    )
    
    sem, _ = Semester.objects.get_or_create(
        academic_year=ay,
        name="Semester 1 (2026)",
        defaults={'start_date': date(2026, 1, 5), 'end_date': date(2026, 6, 30), 'is_current': True}
    )
    
    term, _ = Term.objects.get_or_create(
        semester=sem,
        name="Term 1 (2026)",
        defaults={'start_date': date(2026, 1, 5), 'end_date': date(2026, 3, 31), 'is_current': True}
    )

    print("Seeding Department & Program...")
    dept, _ = Department.objects.get_or_create(
        code="DEUTSCH",
        defaults={'name': "German Language & ODEL Studies", 'description': "Main department for German language training."}
    )
    
    prog, _ = Program.objects.get_or_create(
        code="IGD",
        defaults={'name': "Intensive German Diploma", 'department': dept, 'duration_months': 12, 'description': "Complete A1.1 to B2.2 German language diploma."}
    )

    print("Seeding Granular German Levels...")
    granular_levels = [
        ("A1.1", "Grundstufe A1.1", "A1"),
        ("A1.2", "Grundstufe A1.2", "A1"),
        ("A2.1", "Grundstufe A2.1", "A2"),
        ("A2.2", "Grundstufe A2.2", "A2"),
        ("B1.1", "Mittelstufe B1.1", "B1"),
        ("B1.2", "Mittelstufe B1.2", "B1"),
        ("B2.1", "Mittelstufe B2.1", "B2"),
        ("B2.2", "Mittelstufe B2.2", "B2"),
        ("C1.1", "Oberstufe C1.1", "C1"),
        ("C1.2", "Oberstufe C1.2", "C1"),
        ("C2", "Mastery C2", "C2"),
    ]

    # First ensure parent CEFR levels exist
    parent_map = {}
    for cefr in ["A1", "A2", "B1", "B2", "C1", "C2"]:
        p, _ = Level.objects.get_or_create(code=cefr, defaults={'name': f"CEFR {cefr}", 'cefr_category': cefr})
        parent_map[cefr] = p

    for code, name, cefr in granular_levels:
        lvl, created = Level.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'cefr_category': cefr,
                'parent_level': parent_map[cefr],
                'duration_weeks': 8,
                'description': f"Granular German training level {code}."
            }
        )
        if not created:
            lvl.name = name
            lvl.cefr_category = cefr
            lvl.parent_level = parent_map[cefr]
            lvl.save()

        # Create progression rule
        ProgressionRule.objects.get_or_create(
            level=lvl,
            defaults={
                'min_attendance_percentage': 80.0,
                'min_exam_score_percentage': 60.0,
                'min_assignments_completed': 5,
                'allow_repeat_on_failure': True,
                'max_repeat_attempts': 2
            }
        )

    # Attach graduation rule to B2.2
    b2_2 = Level.objects.filter(code="B2.2").first()
    if b2_2:
        GraduationRule.objects.get_or_create(
            program=prog,
            defaults={
                'required_level': b2_2,
                'min_total_credits': 120,
                'require_fee_clearance': True,
                'require_library_clearance': True
            }
        )

    print("Seeding completed successfully!")

if __name__ == '__main__':
    seed()
