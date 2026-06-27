from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class Book(models.Model):
    class Format(models.TextChoices):
        PHYSICAL = "PHYSICAL", "Physical Book"
        DIGITAL = "DIGITAL", "Digital PDF/eBook"
        BOTH = "BOTH", "Physical & Digital"

    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    isbn = models.CharField(max_length=50, blank=True, unique=True, null=True)
    barcode = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, default="German Language & Literature")
    book_format = models.CharField(max_length=20, choices=Format.choices, default=Format.PHYSICAL)
    total_copies = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)
    pdf_file = models.FileField(upload_to='library/books/', null=True, blank=True)
    cover_image = models.ImageField(upload_to='library/covers/', null=True, blank=True)
    description = models.TextField(blank=True)
    borrow_limit_days = models.PositiveIntegerField(default=14)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.barcode}] {self.title} by {self.author}"

class ResearchPaper(models.Model):
    title = models.CharField(max_length=300)
    authors = models.CharField(max_length=300)
    abstract = models.TextField(blank=True)
    publication_year = models.PositiveIntegerField(default=2026)
    doi = models.CharField(max_length=100, blank=True)
    pdf_file = models.FileField(upload_to='library/papers/')
    category = models.CharField(max_length=100, default="Linguistics & Pedagogy")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.publication_year})"

class PastPaper(models.Model):
    title = models.CharField(max_length=255)
    level = models.ForeignKey('academics.Level', on_delete=models.SET_NULL, null=True, blank=True, related_name='past_papers')
    year = models.PositiveIntegerField()
    semester = models.CharField(max_length=50, default="Semester 1")
    pdf_file = models.FileField(upload_to='library/past_papers/')
    solution_file = models.FileField(upload_to='library/solutions/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        level_name = self.level.code if self.level else "General"
        return f"{self.title} - {level_name} ({self.year})"

class AudioBook(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    narrator = models.CharField(max_length=255, blank=True)
    duration_minutes = models.PositiveIntegerField(default=120)
    audio_file = models.FileField(upload_to='library/audio/')
    cover_image = models.ImageField(upload_to='library/covers/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Audio: {self.title} ({self.duration_minutes}m)"

class BorrowingRecord(models.Model):
    class Status(models.TextChoices):
        BORROWED = "BORROWED", "Active Borrowing"
        RETURNED = "RETURNED", "Returned"
        OVERDUE = "OVERDUE", "Overdue"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='borrowed_books')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrowing_records')
    borrowed_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BORROWED)
    fine_amount = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        if not self.due_date and self.book:
            self.due_date = timezone.now() + timedelta(days=self.book.borrow_limit_days)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} -> {self.book.barcode} ({self.status})"

class Reservation(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active Reservation"
        FULFILLED = "FULFILLED", "Fulfilled"
        CANCELLED = "CANCELLED", "Cancelled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservations')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reservations')
    reserved_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ['reserved_at']

    def __str__(self):
        return f"Reserve: {self.user.username} for {self.book.title}"
