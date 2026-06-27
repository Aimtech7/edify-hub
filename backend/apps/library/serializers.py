from rest_framework import serializers
from library.models import Book, ResearchPaper, PastPaper, AudioBook, BorrowingRecord, Reservation

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

class ResearchPaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchPaper
        fields = '__all__'

class PastPaperSerializer(serializers.ModelSerializer):
    level_code = serializers.CharField(source='level.code', read_only=True)

    class Meta:
        model = PastPaper
        fields = '__all__'

class AudioBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudioBook
        fields = '__all__'

class BorrowingRecordSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_barcode = serializers.CharField(source='book.barcode', read_only=True)

    class Meta:
        model = BorrowingRecord
        fields = '__all__'
        read_only_fields = ['user', 'borrowed_at', 'due_date', 'returned_at', 'status', 'fine_amount']

class ReservationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['user', 'reserved_at', 'status']
