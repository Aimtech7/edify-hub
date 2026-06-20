import os
import django

from django.contrib.auth import get_user_model
from students.models import Student

User = get_user_model()

# Create or update student user
student_user, _ = User.objects.get_or_create(username='DA-2024-1042', defaults={'role': 'STUDENT'})
student_user.set_password('student')
student_user.save()

student_profile, _ = Student.objects.get_or_create(
    user=student_user, 
    admission_number='DA-2024-1042', 
    defaults={'first_name': 'Test', 'last_name': 'Student'}
)

# Create or update staff user
staff_user, _ = User.objects.get_or_create(username='amueller', defaults={'role': 'TEACHER'})
staff_user.set_password('staff')
staff_user.save()

print("Test accounts created successfully")
