from django.urls import path, include
from rest_framework.routers import DefaultRouter
from communication.views import (
    ConversationViewSet, PrivateMessageViewSet, AnnouncementViewSet,
    BroadcastMessageViewSet, PushNotificationTokenViewSet, UserCommunicationProfileViewSet,
    CommunicationPermissionPolicyViewSet, GlobalSearchViewSet, AdminDashboardStatsViewSet,
    UserSearchViewSet
)

router = DefaultRouter()
router.register('conversations', ConversationViewSet, basename='comm-conversation')
router.register('messages', PrivateMessageViewSet, basename='comm-message')
router.register('announcements', AnnouncementViewSet, basename='comm-announcement')
router.register('broadcasts', BroadcastMessageViewSet, basename='comm-broadcast')
router.register('push-tokens', PushNotificationTokenViewSet, basename='comm-pushtoken')
router.register('profiles', UserCommunicationProfileViewSet, basename='comm-profile')
router.register('permissions-matrix', CommunicationPermissionPolicyViewSet, basename='comm-permissions')
router.register('user-search', UserSearchViewSet, basename='comm-usersearch')
router.register('global-search', GlobalSearchViewSet, basename='comm-search')
router.register('admin-stats', AdminDashboardStatsViewSet, basename='comm-adminstats')

urlpatterns = [
    path('', include(router.urls)),
]
