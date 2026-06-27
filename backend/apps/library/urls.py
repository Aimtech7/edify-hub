from django.urls import path, include
from rest_framework.routers import DefaultRouter
from library.views import (
    BookViewSet, ResearchPaperViewSet, PastPaperViewSet,
    AudioBookViewSet, BorrowingRecordViewSet, ReservationViewSet
)

router = DefaultRouter()
router.register('books', BookViewSet, basename='library-book')
router.register('research-papers', ResearchPaperViewSet, basename='library-paper')
router.register('past-papers', PastPaperViewSet, basename='library-pastpaper')
router.register('audio-books', AudioBookViewSet, basename='library-audiobook')
router.register('borrowings', BorrowingRecordViewSet, basename='library-borrowing')
router.register('reservations', ReservationViewSet, basename='library-reservation')

urlpatterns = [
    path('', include(router.urls)),
]
