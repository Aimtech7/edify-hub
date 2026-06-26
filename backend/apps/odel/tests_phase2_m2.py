from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from academics.models import Level, Program
from accounts.models import User
from students.models import Student
from odel.models import Course, Subject, Unit, Module, Lesson, StudentLessonProgress

class Milestone2OdelTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create_user(username='teacher', email='t@da.com', password='password', role='TEACHER')
        self.student_user = User.objects.create_user(username='student_m2', email='stu2@da.com', password='password', role='STUDENT')

        lvl, _ = Level.objects.get_or_create(code="B1", defaults={'name': 'B1', 'cefr_category': 'B1'})
        self.student = Student.objects.create(user=self.student_user, admission_number="DA-ODEL-001", current_level=lvl)

        self.course = Course.objects.create(title="Test Course", code="TC-01", level=lvl, is_published=True)
        self.subj = Subject.objects.create(course=self.course, title="Subj 1", code="S1")
        self.unit = Unit.objects.create(subject=self.subj, title="Unit 1")
        self.mod = Module.objects.create(unit=self.unit, title="Mod 1")

        self.l1 = Lesson.objects.create(module=self.mod, title="L1 Video", order=1, media_type="VIDEO", duration_seconds=100)
        self.l2 = Lesson.objects.create(module=self.mod, title="L2 Audio", order=2, media_type="AUDIO", prerequisite=self.l1)

    def test_unlocking_logic(self):
        self.client.force_authenticate(user=self.student_user)
        url1 = reverse('odel-lesson-detail', args=[self.l1.id])
        url2 = reverse('odel-lesson-detail', args=[self.l2.id])

        res1 = self.client.get(url1)
        res2 = self.client.get(url2)

        self.assertTrue(res1.data['is_unlocked'])
        self.assertFalse(res2.data['is_unlocked']) # L1 not completed yet

        # Record L1 completion
        rec_url = reverse('odel-lesson-record-progress', args=[self.l1.id])
        res_post = self.client.post(rec_url, {'time_spent_seconds': 100, 'is_completed': True}, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_200_OK)

        # Now L2 should be unlocked
        res2_after = self.client.get(url2)
        self.assertTrue(res2_after.data['is_unlocked'])

    def test_course_progress_api(self):
        self.client.force_authenticate(user=self.student_user)
        prog_url = reverse('odel-course-progress', args=[self.course.id])
        res = self.client.get(prog_url)
        self.assertEqual(res.data['progress_percentage'], 0.0)

        # Complete L1
        rec_url = reverse('odel-lesson-record-progress', args=[self.l1.id])
        self.client.post(rec_url, {'time_spent_seconds': 100, 'is_completed': True}, format='json')

        res_after = self.client.get(prog_url)
        self.assertEqual(res_after.data['progress_percentage'], 50.0) # 1 of 2 completed
