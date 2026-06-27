from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from communication.models import Conversation, PrivateMessage, Announcement, BroadcastMessage, PushNotificationToken
from communication.serializers import (
    ConversationSerializer, PrivateMessageSerializer, AnnouncementSerializer,
    BroadcastMessageSerializer, PushNotificationTokenSerializer
)
from accounts.permissions import IsStaffOrReadOnly

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role in ['ADMIN', 'STAFF']:
            return Conversation.objects.all().order_by('-updated_at')
        return self.request.user.conversations.all().order_by('-updated_at')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        content = request.data.get('content')
        if not content:
            return Response({'error': 'Message content cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

        msg = PrivateMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )
        conversation.save()  # update updated_at timestamp
        return Response(PrivateMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.exclude(sender=request.user).update(is_read=True)
        return Response({'status': 'Messages marked as read'}, status=status.HTTP_200_OK)

class PrivateMessageViewSet(viewsets.ModelViewSet):
    serializer_class = PrivateMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role in ['ADMIN', 'STAFF']:
            return PrivateMessage.objects.all().order_by('created_at')
        return PrivateMessage.objects.filter(conversation__participants=self.request.user).order_by('created_at')

class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Announcement.objects.filter(target_group=Announcement.TargetGroup.ALL)
        if user.role in ['ADMIN', 'STAFF']:
            return Announcement.objects.all()
        if user.role == 'TEACHER':
            return Announcement.objects.filter(target_group__in=[Announcement.TargetGroup.ALL, Announcement.TargetGroup.TEACHERS])
        return Announcement.objects.filter(target_group__in=[Announcement.TargetGroup.ALL, Announcement.TargetGroup.STUDENTS])

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class BroadcastMessageViewSet(viewsets.ModelViewSet):
    queryset = BroadcastMessage.objects.all().order_by('-sent_at')
    serializer_class = BroadcastMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sent_by=self.request.user)

class PushNotificationTokenViewSet(viewsets.ModelViewSet):
    serializer_class = PushNotificationTokenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PushNotificationToken.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
