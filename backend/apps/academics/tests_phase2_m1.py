from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from academics.models import AcademicYear, Semester, Term, Department, Program, Level, ProgressionRule
from accounts.models import User
from datetime import date

class Milestone1AcademicTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@test.com', password='password', role='ADMIN')
        self.staff = User.objects.create_user(username='registrar', email='reg@test.com', password='password', role='REGISTRAR')
        self.student = User.objects.create_user(username='student', email='stu@test.com', password='password', role='STUDENT')

        self.ay = AcademicYear.objects.create(year="2025/2026", start_date=date(2025,9,1), end_date=date(2026,8,31), is_current=True)
        self.dept = Department.objects.create(name="German Studies", code="DEUTSCH")
        self.prog = Program.objects.create(name="German Diploma", code="GD", department=self.dept)
        self.level_a11 = Level.objects.create(code="A1.1", name="Grundstufe A1.1", cefr_category="A1")
        self.rule = ProgressionRule.objects.create(level=self.level_a11, min_attendance_percentage=80.0, min_exam_score_percentage=60.0)

    def test_academic_structure_models(self):
        self.assertEqual(str(self.ay), "2025/2026")
        self.assertEqual(self.prog.department.code, "DEUTSCH")
        self.assertEqual(self.level_a11.progression_rule.min_attendance_percentage, 80.0)

    def test_api_list_levels_authenticated(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('level-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_api_create_department_admin_only(self):
        url = reverse('department-list')
        data = {'name': 'New Dept', 'code': 'NEW', 'description': 'test'}
        
        # Unauth should fail
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Student should fail
        self.client.force_authenticate(user=self.student)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin should succeed
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
