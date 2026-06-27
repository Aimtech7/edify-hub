from django.contrib import admin
from .models import Book, ResearchPaper, PastPaper, AudioBook, BorrowingRecord, Reservation

for model in [Book, ResearchPaper, PastPaper, AudioBook, BorrowingRecord, Reservation]:
    @admin.register(model)
    class GenericAdmin(admin.ModelAdmin):
        list_display = [f.name for f in model._meta.fields[:6]]
