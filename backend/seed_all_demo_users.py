import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), 'apps'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from students.models import Student, ParentGuardian

User = get_user_model()

def seed_users():
    print("Seeding all demo accounts...")

    demo_accounts = [
        # (username, email, role, password, first_name, last_name)
        ('DA-2024-1042', 'amani.w@deutschakademie.co.ke', 'STUDENT', 'student', 'Amani', 'Wanjiru'),
        ('amueller', 'a.mueller@deutschakademie.co.ke', 'TEACHER', 'staff', 'Anna', 'Müller'),
        ('gachieng', 'finance@deutschakademie.co.ke', 'ACCOUNTANT', 'staff', 'Grace', 'Achieng'),
        ('admin', 'admin@deutschakademie.co.ke', 'ADMIN', 'aimtech', 'System', 'Administrator'),
        ('austinemakwaka254@gmail.com', 'austinemakwaka254@gmail.com', 'ADMIN', 'aimtech', 'Austin', 'Makwaka'),
        ('dwanjiru', 'david.wanjiru@gmail.com', 'PARENT', 'parent', 'David', 'Wanjiru'),
        ('botieno', 'hr@deutschakademie.co.ke', 'HR', 'staff', 'Beatrix', 'Otieno'),
        ('bkipkorir', 'admissions@deutschakademie.co.ke', 'ADMISSIONS', 'staff', 'Brian', 'Kipkorir'),
        ('eschmidt', 'registrar@deutschakademie.co.ke', 'REGISTRAR', 'staff', 'Elena', 'Schmidt'),
        ('cmwangi', 'library@deutschakademie.co.ke', 'LIBRARY', 'staff', 'Clara', 'Mwangi'),
        ('komondi', 'ict@deutschakademie.co.ke', 'ICT', 'staff', 'Kevin', 'Omondi'),
    ]

    for username, email, role, password, fname, lname in demo_accounts:
        user, created = User.objects.get_or_create(username=username, defaults={'email': email, 'role': role})
        user.email = email
        user.role = role
        user.first_name = fname
        user.last_name = lname
        if role == 'ADMIN':
            user.is_superuser = True
            user.is_staff = True
        user.set_password(password)
        user.save()
        status_str = "Created" if created else "Updated"
        print(f"[{status_str}] {role}: {username} (password: {password})")

    # Ensure Student profile exists for student
    student_user = User.objects.get(username='DA-2024-1042')
    student_prof, _ = Student.objects.get_or_create(
        user=student_user,
        admission_number='DA-2024-1042',
        defaults={'first_name': 'Amani', 'last_name': 'Wanjiru', 'email': 'amani.w@deutschakademie.co.ke'}
    )

    # Ensure Parent profile exists for dwanjiru
    parent_user = User.objects.get(username='dwanjiru')
    parent_prof, _ = ParentGuardian.objects.get_or_create(
        user=parent_user,
        defaults={'phone_number': '+254711223344', 'relationship': 'Guardian'}
    )
    parent_prof.students.add(student_prof)

    print("All demo accounts successfully seeded and linked!")

if __name__ == '__main__':
    seed_users()
