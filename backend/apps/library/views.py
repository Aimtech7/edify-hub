from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from library.models import Book, ResearchPaper, PastPaper, AudioBook, BorrowingRecord, Reservation
from library.serializers import (
    BookSerializer, ResearchPaperSerializer, PastPaperSerializer,
    AudioBookSerializer, BorrowingRecordSerializer, ReservationSerializer
)
from accounts.permissions import IsStaffOrReadOnly

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by('-created_at')
    serializer_class = BookSerializer
    permission_classes = [IsStaffOrReadOnly]

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def borrow(self, request, pk=None):
        book = self.get_object()
        if book.available_copies <= 0:
            return Response({'error': 'No copies currently available for borrowing'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already borrowed this book active
        existing = BorrowingRecord.objects.filter(user=request.user, book=book, status=BorrowingRecord.Status.BORROWED).exists()
        if existing:
            return Response({'error': 'You already have an active borrowing record for this book'}, status=status.HTTP_400_BAD_REQUEST)

        record = BorrowingRecord.objects.create(user=request.user, book=book)
        book.available_copies -= 1
        book.save()
        return Response(BorrowingRecordSerializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def return_book(self, request, pk=None):
        book = self.get_object()
        record = BorrowingRecord.objects.filter(user=request.user, book=book, status=BorrowingRecord.Status.BORROWED).first()
        if not record:
            return Response({'error': 'No active borrowing record found for you and this book'}, status=status.HTTP_404_NOT_FOUND)

        record.status = BorrowingRecord.Status.RETURNED
        record.returned_at = timezone.now()
        record.save()

        book.available_copies += 1
        book.save()
        return Response(BorrowingRecordSerializer(record).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reserve(self, request, pk=None):
        book = self.get_object()
        existing = Reservation.objects.filter(user=request.user, book=book, status=Reservation.Status.ACTIVE).exists()
        if existing:
            return Response({'error': 'You already have an active reservation for this book'}, status=status.HTTP_400_BAD_REQUEST)

        res = Reservation.objects.create(user=request.user, book=book)
        return Response(ReservationSerializer(res).data, status=status.HTTP_201_CREATED)

class ResearchPaperViewSet(viewsets.ModelViewSet):
    queryset = ResearchPaper.objects.all().order_by('-publication_year')
    serializer_class = ResearchPaperSerializer
    permission_classes = [IsStaffOrReadOnly]

class PastPaperViewSet(viewsets.ModelViewSet):
    queryset = PastPaper.objects.all().order_by('-year')
    serializer_class = PastPaperSerializer
    permission_classes = [IsStaffOrReadOnly]

class AudioBookViewSet(viewsets.ModelViewSet):
    queryset = AudioBook.objects.all().order_by('-created_at')
    serializer_class = AudioBookSerializer
    permission_classes = [IsStaffOrReadOnly]

class BorrowingRecordViewSet(viewsets.ModelViewSet):
    queryset = BorrowingRecord.objects.all().order_by('-borrowed_at')
    serializer_class = BorrowingRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role in ['ADMIN', 'STAFF', 'TEACHER']:
            return BorrowingRecord.objects.all().order_by('-borrowed_at')
        return BorrowingRecord.objects.filter(user=self.request.user).order_by('-borrowed_at')

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all().order_by('-reserved_at')
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role in ['ADMIN', 'STAFF', 'TEACHER']:
            return Reservation.objects.all().order_by('-reserved_at')
        return Reservation.objects.filter(user=self.request.user).order_by('-reserved_at')
