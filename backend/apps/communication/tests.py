from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from communication.models import Conversation, PrivateMessage, Announcement, BroadcastMessage

class CommunicationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create_user(username='comm_staff', email='staff@comm.com', password='password', role='STAFF')
        self.student = User.objects.create_user(username='comm_stu', email='stu@comm.com', password='password', role='STUDENT')
        self.teacher = User.objects.create_user(username='comm_teach', email='teach@comm.com', password='password', role='TEACHER')

    def test_conversation_and_messaging_flow(self):
        self.client.force_authenticate(user=self.staff)
        conv = Conversation.objects.create(subject="Welcome to German A1")
        conv.participants.add(self.staff, self.student)

        url_send = reverse('comm-conversation-send-message', kwargs={'pk': conv.pk})
        res_send = self.client.post(url_send, {'content': 'Hallo! Willkommen im Kurs.'}, format='json')
        self.assertEqual(res_send.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PrivateMessage.objects.count(), 1)

        # Student marks read
        self.client.force_authenticate(user=self.student)
        url_mark = reverse('comm-conversation-mark-read', kwargs={'pk': conv.pk})
        res_mark = self.client.post(url_mark)
        self.assertEqual(res_mark.status_code, status.HTTP_200_OK)
        msg = PrivateMessage.objects.first()
        self.assertTrue(msg.is_read)

    def test_announcement_filtering(self):
        Announcement.objects.create(title="General Info", content="All", target_group=Announcement.TargetGroup.ALL)
        Announcement.objects.create(title="Teachers Meeting", content="Teachers", target_group=Announcement.TargetGroup.TEACHERS)

        self.client.force_authenticate(user=self.student)
        res_stu = self.client.get(reverse('comm-announcement-list'))
        stu_count = res_stu.data['count'] if isinstance(res_stu.data, dict) and 'count' in res_stu.data else len(res_stu.data)
        self.assertEqual(stu_count, 1)

        self.client.force_authenticate(user=self.teacher)
        res_teach = self.client.get(reverse('comm-announcement-list'))
        teach_count = res_teach.data['count'] if isinstance(res_teach.data, dict) and 'count' in res_teach.data else len(res_teach.data)
        self.assertEqual(teach_count, 2)

    def test_user_search_and_global_search(self):
        self.client.force_authenticate(user=self.staff)
        res_user_search = self.client.get(reverse('comm-usersearch-list') + '?q=comm_stu')
        self.assertEqual(res_user_search.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res_user_search.data) >= 1)
        self.assertEqual(res_user_search.data[0]['username'], 'comm_stu')

        res_global_search = self.client.get(reverse('comm-search-list') + '?q=comm_stu')
        self.assertEqual(res_global_search.status_code, status.HTTP_200_OK)
        self.assertIn('users', res_global_search.data)
        self.assertIn('messages', res_global_search.data)
        self.assertIn('announcements', res_global_search.data)
