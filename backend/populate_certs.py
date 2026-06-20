import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), 'apps'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from students.models import Student
from academics.models import Level
from certificates.models import Certificate
from django.contrib.auth import get_user_model

User = get_user_model()
student_profile = Student.objects.filter(admission_number='DA-2024-1042').first()
level_b1, _ = Level.objects.get_or_create(code='B1', defaults={'name': 'Level B1'})
level_b2, _ = Level.objects.get_or_create(code='B2', defaults={'name': 'Level B2'})
teacher = User.objects.filter(username='amueller').first()

if student_profile:
    # B1 Certificate
    Certificate.objects.get_or_create(
        student=student_profile,
        level=level_b1,
        defaults={
            'issue_date': timezone.now().date(),
            'issued_by': teacher
        }
    )
    # B2 Certificate
    Certificate.objects.get_or_create(
        student=student_profile,
        level=level_b2,
        defaults={
            'issue_date': timezone.now().date(),
            'issued_by': teacher
        }
    )
    print("Certificates populated successfully")
else:
    print("Student not found")
