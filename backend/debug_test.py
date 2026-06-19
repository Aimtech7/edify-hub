import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test.utils import setup_test_environment, teardown_test_environment
from django.test.client import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from finance.models import Payment, Allocation
from students.models import Student
from academics.models import Level, Cohort

User = get_user_model()

def run():
    setup_test_environment()
    client = APIClient()
    
    User.objects.all().delete()
    Payment.objects.all().delete()
    Student.objects.all().delete()
    admin = User.objects.create_superuser(username="admin_tmp", password="pwd", email="admin@tmp.com")
    accountant = User.objects.create_user(username="acc_tmp", password="pwd", role=User.Role.ACCOUNTANT, email="acc@tmp.com")
    
    level_a1 = Level.objects.create(code="A1", duration_weeks=8)
    cohort = Cohort.objects.create(name="Batch-1", level=level_a1, start_date="2026-01-05", end_date="2026-03-02")
    student_user = User.objects.create_user(username="stu_tmp", password="pwd", role=User.Role.STUDENT)
    student = Student.objects.create(user=student_user, admission_number="DA-2026-0009", current_level=level_a1, current_cohort=cohort)
    
    client.force_authenticate(user=accountant)
    
    payment = Payment.objects.create(
        student=student, payer_name="Parent", phone_number="0712345678",
        amount=20000.00, payment_method=Payment.Methods.MPESA,
        created_by=accountant
    )
    
    correct_payload = {
        "payment_id": payment.id,
        "allocations": [
            {"category": Allocation.Categories.TUITION, "amount": 15000.00},
            {"category": Allocation.Categories.EXAMINATION, "amount": 3000.00}
        ]
    }
    
    response = client.post("/api/finance/allocations/allocate/", correct_payload, format='json')
    print("STATUS:", response.status_code)
    print("CONTENT:", response.content)
    
    teardown_test_environment()

run()
