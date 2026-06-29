import time
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied

from communication.models import (
    Conversation, PrivateMessage, Announcement, BroadcastMessage,
    PushNotificationToken, MessageReadReceipt, CommunicationAuditLog,
    CommunicationPermissionPolicy, UserCommunicationProfile
)
from communication.serializers import (
    ConversationSerializer, PrivateMessageSerializer, AnnouncementSerializer,
    BroadcastMessageSerializer, PushNotificationTokenSerializer, CommunicationAuditLogSerializer,
    CommunicationPermissionPolicySerializer, UserCommunicationProfileSerializer
)
from accounts.permissions import IsStaffOrReadOnly

from communication.services import (
    ConversationService, MessageService, SearchService, PresenceService,
    AIConversationService, AnnouncementService
)

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

        conv_type = self.request.query_params.get('type', '').strip().upper()
        if conv_type in ['DIRECT', 'GROUP', 'COURSE']:
            qs = qs.filter(type=conv_type)

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
        conv_type = serializer.validated_data.get('type', Conversation.Type.DIRECT)
        subject = serializer.validated_data.get('subject', '')
        course_channel = serializer.validated_data.get('course_channel', '')
        entity_id = serializer.validated_data.get('entity_id', '')
        entity_type = serializer.validated_data.get('entity_type', '')
        participant_ids = self.request.data.get('participant_ids', [])

        conv = ConversationService.create_conversation(
            creator=self.request.user,
            conv_type=conv_type,
            subject=subject,
            participant_ids=participant_ids,
            course_channel=course_channel,
            entity_id=entity_id,
            entity_type=entity_type
        )
        serializer.instance = conv

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        content = request.data.get('content', '')
        attachment = request.FILES.get('attachment')
        reply_to_id = request.data.get('reply_to_id')
        mentions_ids = request.data.get('mentions_ids', [])

        msg = MessageService.send_message(
            sender=request.user,
            conversation=conversation,
            content=content,
            file_obj=attachment,
            reply_to_id=reply_to_id,
            mentions_ids=mentions_ids
        )
        return Response(PrivateMessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def ask_ai(self, request, pk=None):
        conversation = self.get_object()
        prompt = request.data.get('prompt', '').strip()
        action_type = request.data.get('action_type', 'QUERY').upper()
        
        msg = AIConversationService.process_ai_request(
            actor=request.user,
            conversation=conversation,
            prompt=prompt,
            action_type=action_type
        )
        return Response(PrivateMessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        unread_messages = conversation.messages.exclude(sender=request.user).filter(is_read=False)
        for msg in unread_messages:
            MessageService.mark_read(request.user, msg)
        return Response({'status': 'Messages marked as read'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_pin(self, request, pk=None):
        conversation = self.get_object()
        is_pinned = ConversationService.toggle_pin(request.user, conversation)
        return Response({'is_pinned': is_pinned}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_archive(self, request, pk=None):
        conversation = self.get_object()
        is_archived = ConversationService.toggle_archive(request.user, conversation)
        return Response({'is_archived': is_archived}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def read_analytics(self, request, pk=None):
        conversation = self.get_object()
        receipts = MessageReadReceipt.objects.filter(message__conversation=conversation).select_related('user', 'message')
        data = [{
            'message_id': r.message_id,
            'user_id': r.user_id,
            'username': r.user.username,
            'read_at': r.read_at
        } for r in receipts]
        return Response(data)


class PrivateMessageViewSet(viewsets.ModelViewSet):
    serializer_class = PrivateMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role in ['ADMIN', 'STAFF']:
            return PrivateMessage.objects.all().order_by('created_at')
        return PrivateMessage.objects.filter(conversation__participants=self.request.user).order_by('created_at')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_reaction(self, request, pk=None):
        msg = self.get_object()
        emoji = request.data.get('emoji', '👍').strip()
        msg = MessageService.toggle_reaction(request.user, msg, emoji)
        return Response(PrivateMessageSerializer(msg, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_star(self, request, pk=None):
        msg = self.get_object()
        starred = MessageService.toggle_star(request.user, msg)
        return Response({'is_starred': starred})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def edit_message(self, request, pk=None):
        msg = self.get_object()
        new_content = request.data.get('content', '').strip()
        msg = MessageService.edit_message(request.user, msg, new_content)
        return Response(PrivateMessageSerializer(msg, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def delete_for_everyone(self, request, pk=None):
        msg = self.get_object()
        msg = MessageService.delete_message(request.user, msg, delete_for_everyone=True)
        return Response(PrivateMessageSerializer(msg, context={'request': request}).data)


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
        title = serializer.validated_data.get('title', '')
        content = serializer.validated_data.get('content', '')
        target_group = serializer.validated_data.get('target_group', 'ALL')
        priority = serializer.validated_data.get('priority', 'NORMAL')
        scheduled_for = serializer.validated_data.get('scheduled_for')
        is_pinned = serializer.validated_data.get('is_pinned', False)

        ann = AnnouncementService.publish_announcement(
            author=self.request.user,
            title=title,
            content=content,
            target_group=target_group,
            priority=priority,
            scheduled_for=scheduled_for,
            is_pinned=is_pinned
        )
        serializer.instance = ann


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


class UserCommunicationProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserCommunicationProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return UserCommunicationProfile.objects.all()
        return UserCommunicationProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_presence(self, request):
        presence = request.data.get('presence_status')
        custom = request.data.get('custom_status')
        mute_all = request.data.get('mute_all')

        profile = PresenceService.update_presence(request.user, presence or 'ONLINE', custom or '')
        if mute_all is not None:
            profile.mute_all = bool(mute_all)
            profile.save(update_fields=['mute_all'])

        return Response(UserCommunicationProfileSerializer(profile).data)


class CommunicationPermissionPolicyViewSet(viewsets.ModelViewSet):
    serializer_class = CommunicationPermissionPolicySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = CommunicationPermissionPolicy.objects.all()


class UserSearchViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        q = request.query_params.get('q', '').strip()
        results = SearchService.search_users(q)
        return Response(results)


class GlobalSearchViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        q = request.query_params.get('q', '').strip()
        category = request.query_params.get('category', 'ALL').strip().upper()
        output = SearchService.global_search(request.user, q, category)
        return Response(output)


class AdminDashboardStatsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    def list(self, request):
        today = timezone.now().date()
        msgs_today = PrivateMessage.objects.filter(created_at__date=today).count()
        unread_msgs = PrivateMessage.objects.filter(is_read=False).count()
        online_users = UserCommunicationProfile.objects.filter(presence_status='ONLINE').count()
        ai_requests = CommunicationAuditLog.objects.filter(action='AI_REQUEST').count()

        return Response({
            'messages_today': msgs_today,
            'unread_messages': unread_msgs,
            'online_users': online_users,
            'ai_conversations': ai_requests,
            'storage_status': 'Supabase CDN Bucket Active (Healthy)',
        })
