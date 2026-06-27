from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from library.models import Book, BorrowingRecord, Reservation

class LibraryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create_user(username='lib_staff', email='lib@da.com', password='password', role='STAFF')
        self.student = User.objects.create_user(username='lib_stu', email='stu@da.com', password='password', role='STUDENT')
        self.book = Book.objects.create(
            title="Grammatik Aktiv",
            author="Friederike Jin",
            barcode="LIB-GER-001",
            total_copies=2,
            available_copies=2
        )

    def test_borrow_and_return_flow(self):
        self.client.force_authenticate(user=self.student)
        url_borrow = reverse('library-book-borrow', kwargs={'pk': self.book.pk})
        
        # Borrow book
        res_borrow = self.client.post(url_borrow)
        self.assertEqual(res_borrow.status_code, status.HTTP_201_CREATED)
        
        self.book.refresh_from_db()
        self.assertEqual(self.book.available_copies, 1)

        # Return book
        url_return = reverse('library-book-return-book', kwargs={'pk': self.book.pk})
        res_return = self.client.post(url_return)
        self.assertEqual(res_return.status_code, status.HTTP_200_OK)

        self.book.refresh_from_db()
        self.assertEqual(self.book.available_copies, 2)

    def test_reservation_flow(self):
        self.client.force_authenticate(user=self.student)
        url_reserve = reverse('library-book-reserve', kwargs={'pk': self.book.pk})
        res_reserve = self.client.post(url_reserve)
        self.assertEqual(res_reserve.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Reservation.objects.filter(user=self.student, book=self.book).exists())
