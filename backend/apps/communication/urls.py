from django.urls import path, include
from rest_framework.routers import DefaultRouter
from communication.views import (
    ConversationViewSet, PrivateMessageViewSet, AnnouncementViewSet,
    BroadcastMessageViewSet, PushNotificationTokenViewSet
)

router = DefaultRouter()
router.register('conversations', ConversationViewSet, basename='comm-conversation')
router.register('messages', PrivateMessageViewSet, basename='comm-message')
router.register('announcements', AnnouncementViewSet, basename='comm-announcement')
router.register('broadcasts', BroadcastMessageViewSet, basename='comm-broadcast')
router.register('push-tokens', PushNotificationTokenViewSet, basename='comm-pushtoken')

urlpatterns = [
    path('', include(router.urls)),
]
