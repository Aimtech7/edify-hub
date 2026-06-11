import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from academics.models import Level, Cohort
from finance.models import FeeStructure

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the database with CEFR levels, fee structures, default roles, and sample cohorts."

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # 1. Create Default Users/Roles
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@deutschakademie.co.ke",
                "first_name": "System",
                "last_name": "Admin",
                "role": User.Role.ADMIN
            }
        )
        if created:
            admin_user.set_password("adminpassword")
            admin_user.save()
            self.stdout.write("Created Admin user: admin / adminpassword")
        else:
            self.stdout.write("Admin user already exists")

        teacher_user, created = User.objects.get_or_create(
            username="teacher",
            defaults={
                "email": "teacher@deutschakademie.co.ke",
                "first_name": "Andreas",
                "last_name": "Mueller",
                "role": User.Role.TEACHER
            }
        )
        if created:
            teacher_user.set_password("teacherpassword")
            teacher_user.save()
            self.stdout.write("Created Teacher user: teacher / teacherpassword")
        else:
            self.stdout.write("Teacher user already exists")

        accountant_user, created = User.objects.get_or_create(
            username="accountant",
            defaults={
                "email": "accountant@deutschakademie.co.ke",
                "first_name": "Grace",
                "last_name": "Achieng",
                "role": User.Role.ACCOUNTANT
            }
        )
        if created:
            accountant_user.set_password("accountantpassword")
            accountant_user.save()
            self.stdout.write("Created Accountant user: accountant / accountantpassword")
        else:
            self.stdout.write("Accountant user already exists")

        # 2. Create CEFR Levels
        levels_data = [
            {"code": "A1", "name": "Grundstufe A1", "duration_weeks": 8, "description": "Beginner German CEFR level"},
            {"code": "A2", "name": "Grundstufe A2", "duration_weeks": 8, "description": "Elementary German CEFR level"},
            {"code": "B1", "name": "Mittelstufe B1", "duration_weeks": 10, "description": "Intermediate German CEFR level"},
            {"code": "B2", "name": "Mittelstufe B2", "duration_weeks": 10, "description": "Upper-Intermediate German CEFR level"},
            {"code": "C1", "name": "Oberstufe C1", "duration_weeks": 12, "description": "Advanced German CEFR level"},
            {"code": "C2", "name": "Oberstufe C2", "duration_weeks": 12, "description": "Proficient German CEFR level"},
        ]

        levels = {}
        for l_data in levels_data:
            level, created = Level.objects.get_or_create(
                code=l_data["code"],
                defaults={
                    "name": l_data["name"],
                    "duration_weeks": l_data["duration_weeks"],
                    "description": l_data["description"]
                }
            )
            levels[l_data["code"]] = level
            if created:
                self.stdout.write(f"Created Level: {level.code}")
            else:
                self.stdout.write(f"Level {level.code} already exists")

        # 3. Create Fee Structures
        # We configure distinct fee structures for CEFR levels for the academic year 2026
        fees_config = {
            "A1": {"tuition": 15000.00, "exam": 2000.00, "materials": 1500.00, "cert": 1000.00, "tech": 500.00, "other": 0.00},
            "A2": {"tuition": 18000.00, "exam": 2500.00, "materials": 1500.00, "cert": 1000.00, "tech": 500.00, "other": 0.00},
            "B1": {"tuition": 22000.00, "exam": 3000.00, "materials": 2000.00, "cert": 1500.00, "tech": 500.00, "other": 500.00},
            "B2": {"tuition": 25000.00, "exam": 3500.00, "materials": 2000.00, "cert": 1500.00, "tech": 500.00, "other": 500.00},
            "C1": {"tuition": 30000.00, "exam": 4000.00, "materials": 2500.00, "cert": 2000.00, "tech": 1000.00, "other": 500.00},
            "C2": {"tuition": 35000.00, "exam": 5000.00, "materials": 3000.00, "cert": 2000.00, "tech": 1000.00, "other": 1000.00},
        }

        for code, level in levels.items():
            cfg = fees_config[code]
            fs, created = FeeStructure.objects.get_or_create(
                level=level,
                academic_year="2026",
                defaults={
                    "tuition_fee": cfg["tuition"],
                    "exam_fee": cfg["exam"],
                    "materials_fee": cfg["materials"],
                    "certificate_fee": cfg["cert"],
                    "tech_fee": cfg["tech"],
                    "other_fee": cfg["other"]
                }
            )
            if created:
                self.stdout.write(f"Created Fee Structure for {code} ({fs.total_fee})")
            else:
                self.stdout.write(f"Fee Structure for {code} already exists")

        # 4. Create Sample Cohorts
        cohorts_data = [
            {
                "name": "A1-Batch-2026-01",
                "level_code": "A1",
                "start": datetime.date(2026, 1, 5),
                "end": datetime.date(2026, 3, 2),
            },
            {
                "name": "A2-Batch-2026-01",
                "level_code": "A2",
                "start": datetime.date(2026, 1, 5),
                "end": datetime.date(2026, 3, 2),
            },
            {
                "name": "B1-Batch-2026-01",
                "level_code": "B1",
                "start": datetime.date(2026, 1, 12),
                "end": datetime.date(2026, 3, 23),
            }
        ]

        for c_data in cohorts_data:
            cohort, created = Cohort.objects.get_or_create(
                name=c_data["name"],
                defaults={
                    "level": levels[c_data["level_code"]],
                    "instructor": teacher_user,
                    "start_date": c_data["start"],
                    "end_date": c_data["end"]
                }
            )
            if created:
                self.stdout.write(f"Created Cohort: {cohort.name}")
            else:
                self.stdout.write(f"Cohort {cohort.name} already exists")

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
