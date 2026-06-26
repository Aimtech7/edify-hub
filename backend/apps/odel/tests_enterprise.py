from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from academics.models import Level
from accounts.models import User
from students.models import Student
from odel.models import (
    Course, Subject, Unit, Module, Lesson, DiscussionForum, ForumThread,
    ForumPost, Assignment, AssignmentSubmission, Quiz, QuizQuestion, QuizAttempt, Gradebook
)

class EnterpriseOdelTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(username='prof_odel', email='p@da.com', password='password', role='TEACHER')
        self.student_user = User.objects.create_user(username='stu_odel', email='s@da.com', password='password', role='STUDENT')
        
        lvl = Level.objects.create(code="C1", name="C1")
        self.student = Student.objects.create(user=self.student_user, admission_number="DA-ENT-001", current_level=lvl)
        self.course = Course.objects.create(title="Enterprise German", code="ENT-01", level=lvl, is_published=True)
        self.mod = Module.objects.create(course=self.course, title="Mod Direct", order=1)
        self.lesson = Lesson.objects.create(module=self.mod, title="L1 Enterprise", order=1)

    def test_forum_workflow(self):
        self.client.force_authenticate(user=self.teacher)
        forum = DiscussionForum.objects.create(course=self.course, title="General Discussion")
        
        url_thread = reverse('odel-thread-list')
        res_thread = self.client.post(url_thread, {'forum': forum.id, 'title': 'Grammar Q', 'body': 'How to use Dativ?'}, format='json')
        self.assertEqual(res_thread.status_code, status.HTTP_201_CREATED)
        thread_id = res_thread.data['id']

        self.client.force_authenticate(user=self.student_user)
        url_post = reverse('odel-post-list')
        res_post = self.client.post(url_post, {'thread': thread_id, 'body': 'Use Aus, Bei, Mit, Nach, Seit, Von, Zu!'}, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)

    def test_assignment_submission(self):
        assignment = Assignment.objects.create(lesson=self.lesson, title="Essay Sub", description="Write 200 words")
        self.client.force_authenticate(user=self.student_user)
        
        url_sub = reverse('odel-submission-list')
        res_sub = self.client.post(url_sub, {'assignment': assignment.id, 'rich_text_submission': 'Sehr geehrte Damen und Herren...'}, format='json')
        self.assertEqual(res_sub.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_sub.data['student'], self.student.id)

    def test_quiz_attempt(self):
        quiz = Quiz.objects.create(lesson=self.lesson, title="C1 Quiz")
        QuizQuestion.objects.create(quiz=quiz, prompt_text="What is 2+2 in German?", correct_answer_text="Vier", marks=10.0)
        
        self.client.force_authenticate(user=self.student_user)
        url_attempt = reverse('odel-quiz-attempt-list')
        res_attempt = self.client.post(url_attempt, {'quiz': quiz.id, 'score_obtained': 10.0, 'is_completed': True}, format='json')
        self.assertEqual(res_attempt.status_code, status.HTTP_201_CREATED)
