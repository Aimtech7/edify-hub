from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from students.models import Student, ParentGuardian

User = get_user_model()

class ParentPortalTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create Parent User
        self.parent_user = User.objects.create_user(
            username="parent1",
            email="parent@horizon.com",
            password="password",
            role=User.Role.PARENT
        )
        self.parent_profile = ParentGuardian.objects.create(
            user=self.parent_user,
            phone_number="+254700000001",
            relationship="Father"
        )
        
        # Create Child Student User
        self.student_user = User.objects.create_user(
            username="HDTI/2026/01",
            email="child@horizon.com",
            password="password",
            role=User.Role.STUDENT
        )
        self.student = Student.objects.create(
            user=self.student_user,
            admission_number="HDTI/2026/01",
            first_name="Hans",
            last_name="Müller"
        )
        
        # Link child to parent
        self.parent_profile.students.add(self.student)
        
        # Create another student not linked to parent
        self.other_user = User.objects.create_user(
            username="HDTI/2026/02",
            email="other@horizon.com",
            password="password",
            role=User.Role.STUDENT
        )
        self.other_student = Student.objects.create(
            user=self.other_user,
            admission_number="HDTI/2026/02",
            first_name="Anna",
            last_name="Schmidt"
        )

    def test_my_children_endpoint(self):
        self.client.force_authenticate(user=self.parent_user)
        res = self.client.get('/api/students/my-children/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['admission_number'], "HDTI/2026/01")
        self.assertEqual(res.data[0]['first_name'], "Hans")

    def test_parent_student_list_scopability(self):
        self.client.force_authenticate(user=self.parent_user)
        res = self.client.get('/api/students/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data['results'] if isinstance(res.data, dict) and 'results' in res.data else res.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['admission_number'], "HDTI/2026/01")
