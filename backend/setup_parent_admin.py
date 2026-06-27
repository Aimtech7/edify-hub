import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), 'apps'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from students.models import Student, ParentGuardian

User = get_user_model()

def run_setup():
    print("Updating Superadmin credentials...")
    admin, _ = User.objects.get_or_create(username='admin', defaults={'email': 'admin@example.com', 'role': 'ADMIN'})
    admin.set_password('aimtech')
    admin.is_superuser = True
    admin.is_staff = True
    admin.role = 'ADMIN'
    admin.save()
    print("Superadmin 'admin' password set to 'aimtech'.")

    # Create austinemakwaka254@gmail.com superuser
    austin, _ = User.objects.get_or_create(username='austinemakwaka254@gmail.com', defaults={'email': 'austinemakwaka254@gmail.com', 'role': 'ADMIN'})
    austin.set_password('aimtech')
    austin.is_superuser = True
    austin.is_staff = True
    austin.role = 'ADMIN'
    austin.save()
    print("Superadmin 'austinemakwaka254@gmail.com' password set to 'aimtech'.")

    print("Setting up Parent account 'dwanjiru'...")
    parent_user, _ = User.objects.get_or_create(username='dwanjiru', defaults={'email': 'david.wanjiru@gmail.com', 'role': 'PARENT'})
    parent_user.set_password('parent')
    parent_user.role = 'PARENT'
    parent_user.save()

    parent_profile, _ = ParentGuardian.objects.get_or_create(user=parent_user, defaults={'phone_number': '+254711223344', 'relationship': 'Mother'})
    student = Student.objects.filter(admission_number='DA-2024-1042').first()
    if student:
        parent_profile.students.add(student)
        print(f"Linked parent 'dwanjiru' to student '{student.admission_number}'.")
    
    print("Parent account 'dwanjiru' created with password 'parent'.")

if __name__ == '__main__':
    run_setup()
