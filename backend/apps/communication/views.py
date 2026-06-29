from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from communication.models import (
    Conversation, PrivateMessage, Announcement, BroadcastMessage,
    PushNotificationToken, MessageReadReceipt, CommunicationAuditLog
)
from communication.serializers import (
    ConversationSerializer, PrivateMessageSerializer, AnnouncementSerializer,
    BroadcastMessageSerializer, PushNotificationTokenSerializer, CommunicationAuditLogSerializer
)
from accounts.permissions import IsStaffOrReadOnly

User = get_user_model()

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'STAFF']:
            qs = Conversation.objects.all()
        else:
            qs = user.conversations.all()

        # Search filter
        search_query = self.request.query_params.get('q', '').strip()
        if search_query:
            qs = qs.filter(
                Q(subject__icontains=search_query) |
                Q(participants__username__icontains=search_query) |
                Q(messages__content__icontains=search_query) |
                Q(messages__attachment_name__icontains=search_query)
            ).distinct()

        return qs.order_by('-is_pinned', '-updated_at')

    def perform_create(self, serializer):
        conv = serializer.save(created_by=self.request.user)
        conv.participants.add(self.request.user)
        participant_ids = self.request.data.get('participant_ids', [])
        if isinstance(participant_ids, list):
            for pid in participant_ids:
                try:
                    p_user = User.objects.get(pk=pid)
                    conv.participants.add(p_user)
                except User.DoesNotExist:
                    pass

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        content = request.data.get('content', '')
        attachment = request.FILES.get('attachment')

        if not content and not attachment:
            return Response({'error': 'Message must contain text or an attachment'}, status=status.HTTP_400_BAD_REQUEST)

        attachment_name = ''
        attachment_size = 0
        attachment_type = ''

        if attachment:
            attachment_name = attachment.name
            attachment_size = attachment.size
            attachment_type = getattr(attachment, 'content_type', '')

        msg = PrivateMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            attachment=attachment,
            attachment_name=attachment_name,
            attachment_size=attachment_size,
            attachment_type=attachment_type,
            status=PrivateMessage.Status.DELIVERED
        )
        conversation.updated_at = timezone.now()
        conversation.save()

        # Record Audit Log
        CommunicationAuditLog.objects.create(
            actor=request.user,
            action=CommunicationAuditLog.Action.CREATED,
            message=msg,
            conversation=conversation,
            details=f"Sent message #{msg.id} with attachment: {attachment_name if attachment else 'None'}"
        )

        return Response(PrivateMessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        unread_messages = conversation.messages.exclude(sender=request.user).filter(is_read=False)
        
        for msg in unread_messages:
            msg.is_read = True
            msg.status = PrivateMessage.Status.READ
            msg.save()
            MessageReadReceipt.objects.get_or_create(message=msg, user=request.user)

            CommunicationAuditLog.objects.create(
                actor=request.user,
                action=CommunicationAuditLog.Action.READ,
                message=msg,
                conversation=conversation,
                details=f"Read message #{msg.id}"
            )

        return Response({'status': 'Messages marked as read'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_pin(self, request, pk=None):
        conversation = self.get_object()
        conversation.is_pinned = not conversation.is_pinned
        conversation.save()
        return Response({'is_pinned': conversation.is_pinned}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_archive(self, request, pk=None):
        conversation = self.get_object()
        conversation.is_archived = not conversation.is_archived
        conversation.save()
        return Response({'is_archived': conversation.is_archived}, status=status.HTTP_200_OK)

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
