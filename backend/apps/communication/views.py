import time
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
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

User = get_user_model()

# Helper for AI integration inside chat
try:
    from ai_assistant.models import AISetting
    from ai_assistant.retrieval import retrieve_rag_context
    from ai_assistant.providers import get_llm_provider
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'STAFF']:
            qs = Conversation.objects.all()
        else:
            qs = user.conversations.all()

        # Type filter
        conv_type = self.request.query_params.get('type', '').strip().upper()
        if conv_type in ['DIRECT', 'GROUP', 'COURSE']:
            qs = qs.filter(type=conv_type)

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
                    if isinstance(pid, int) or (isinstance(pid, str) and str(pid).isdigit()):
                        p_user = User.objects.get(pk=int(pid))
                    else:
                        p_user = User.objects.get(username__iexact=str(pid).strip())
                    
                    if conv.type == Conversation.Type.DIRECT and self.request.user.role == 'STUDENT':
                        policy = CommunicationPermissionPolicy.objects.filter(sender_role='STUDENT', target_role=p_user.role).first()
                        if policy and not policy.is_allowed:
                            continue
                    conv.participants.add(p_user)
                except User.DoesNotExist:
                    pass

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        content = request.data.get('content', '')
        attachment = request.FILES.get('attachment')
        reply_to_id = request.data.get('reply_to_id')
        metadata = request.data.get('metadata', {})

        if not content and not attachment:
            return Response({'error': 'Message must contain text or an attachment'}, status=status.HTTP_400_BAD_REQUEST)

        # Check Permission Matrix (unless sender is admin/staff or sending inside a group/course)
        if conversation.type == Conversation.Type.DIRECT and request.user.role == 'STUDENT':
            # Check if allowed to message target recipients
            for target in conversation.participants.exclude(id=request.user.id):
                policy = CommunicationPermissionPolicy.objects.filter(sender_role='STUDENT', target_role=target.role).first()
                if policy and not policy.is_allowed:
                    return Response({'error': f'Communication policy restricts messaging users with role {target.role}'}, status=status.HTTP_403_FORBIDDEN)

        attachment_name = ''
        attachment_size = 0
        attachment_type = ''

        if attachment:
            attachment_name = attachment.name
            attachment_size = attachment.size
            attachment_type = getattr(attachment, 'content_type', '')

        reply_to = None
        if reply_to_id:
            reply_to = PrivateMessage.objects.filter(id=reply_to_id, conversation=conversation).first()

        if not isinstance(metadata, dict):
            metadata = {}
        metadata.setdefault('reactions', {})

        msg = PrivateMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            attachment=attachment,
            attachment_name=attachment_name,
            attachment_size=attachment_size,
            attachment_type=attachment_type,
            status=PrivateMessage.Status.DELIVERED,
            reply_to=reply_to,
            metadata=metadata
        )

        # Parse Mentions e.g. @username
        if '@' in content:
            words = content.split()
            for w in words:
                if w.startswith('@'):
                    uname = w[1:].strip().replace(',', '').replace('.', '')
                    mentioned_user = User.objects.filter(username__iexact=uname).first()
                    if mentioned_user:
                        msg.mentions.add(mentioned_user)

        conversation.updated_at = timezone.now()
        conversation.save()

        # Record Audit Log
        CommunicationAuditLog.objects.create(
            actor=request.user,
            action=CommunicationAuditLog.Action.CREATED,
            message=msg,
            conversation=conversation,
            details=f"Sent message #{msg.id} ({conversation.type})"
        )

        return Response(PrivateMessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def ask_ai(self, request, pk=None):
        conversation = self.get_object()
        prompt = request.data.get('prompt', '').strip()
        if not prompt:
            return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Record prompt as user message
        user_msg = PrivateMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            content=f"🤖 AI Inquiry: {prompt}",
            status=PrivateMessage.Status.READ
        )

        reply_content = "AI Assistant is currently offline or unconfigured."
        if AI_AVAILABLE:
            try:
                # Gather recent conversation history for context
                recent_msgs = conversation.messages.order_by('-created_at')[:15]
                history_text = "\n".join([f"{m.sender.username}: {m.content}" for m in reversed(recent_msgs)])
                full_query = f"Thread Context:\n{history_text}\n\nUser Request: {prompt}"

                context_text, _ = retrieve_rag_context(request.user, full_query)
                config = AISetting.get_settings()
                provider = get_llm_provider(config)
                reply_content = provider.generate(
                    system_prompt=config.system_prompt + "\nYou are inside a live chat thread in Horizon LMS. Answer concisely.",
                    user_prompt=full_query,
                    context=context_text,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
            except Exception as e:
                reply_content = f"Horizon AI encountered an issue: {str(e)}"

        # Find or create virtual AI Bot user
        ai_user, _ = User.objects.get_or_create(username='Horizon-AI', defaults={'email': 'ai@deutschakademie.co.ke', 'role': 'STAFF'})

        ai_msg = PrivateMessage.objects.create(
            conversation=conversation,
            sender=ai_user,
            content=reply_content,
            status=PrivateMessage.Status.READ,
            reply_to=user_msg
        )
        conversation.updated_at = timezone.now()
        conversation.save()

        CommunicationAuditLog.objects.create(
            actor=request.user,
            action=CommunicationAuditLog.Action.AI_REQUEST,
            message=ai_msg,
            conversation=conversation,
            details=f"AI Request: {prompt[:50]}"
        )

        return Response(PrivateMessageSerializer(ai_msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        unread_messages = conversation.messages.exclude(sender=request.user).filter(is_read=False)
        
        for msg in unread_messages:
            msg.is_read = True
            msg.status = PrivateMessage.Status.READ
            msg.save()
            MessageReadReceipt.objects.get_or_create(message=msg, user=request.user)

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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_reaction(self, request, pk=None):
        msg = self.get_object()
        emoji = request.data.get('emoji', '👍').strip()
        user_id_str = str(request.user.id)

        meta = msg.metadata if isinstance(msg.metadata, dict) else {}
        reactions = meta.get('reactions', {})
        if not isinstance(reactions, dict):
            reactions = {}

        users_list = reactions.get(emoji, [])
        if not isinstance(users_list, list):
            users_list = []

        if user_id_str in users_list:
            users_list.remove(user_id_str)
        else:
            users_list.append(user_id_str)

        if users_list:
            reactions[emoji] = users_list
        elif emoji in reactions:
            del reactions[emoji]

        meta['reactions'] = reactions
        msg.metadata = meta
        msg.save()
        return Response(PrivateMessageSerializer(msg, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_star(self, request, pk=None):
        msg = self.get_object()
        if request.user in msg.starred_by.all():
            msg.starred_by.remove(request.user)
            starred = False
        else:
            msg.starred_by.add(request.user)
            starred = True
        return Response({'is_starred': starred})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def edit_message(self, request, pk=None):
        msg = self.get_object()
        if msg.sender != request.user and request.user.role != 'ADMIN':
            return Response({'error': 'Unauthorized to edit message'}, status=status.HTTP_403_FORBIDDEN)
        
        new_content = request.data.get('content', '').strip()
        if not new_content:
            return Response({'error': 'Content cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

        msg.content = new_content
        msg.is_edited = True
        msg.save()
        CommunicationAuditLog.objects.create(actor=request.user, action=CommunicationAuditLog.Action.EDITED, message=msg, details="Message edited")
        return Response(PrivateMessageSerializer(msg, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def delete_for_everyone(self, request, pk=None):
        msg = self.get_object()
        if msg.sender != request.user and request.user.role != 'ADMIN':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        # Time-limited SLA check (15 mins) unless Admin
        elapsed = (timezone.now() - msg.created_at).total_seconds()
        if elapsed > 900 and request.user.role != 'ADMIN':
            return Response({'error': 'Time limit (15 mins) exceeded for deleting message for everyone'}, status=status.HTTP_400_BAD_REQUEST)

        msg.content = "🚫 This message was deleted."
        msg.is_deleted = True
        if msg.attachment:
            msg.attachment.delete(save=False)
            msg.attachment = None
            msg.attachment_name = ''
        msg.save()
        CommunicationAuditLog.objects.create(actor=request.user, action=CommunicationAuditLog.Action.DELETED, message=msg, details="Deleted for everyone")
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

class UserCommunicationProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserCommunicationProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return UserCommunicationProfile.objects.all()
        return UserCommunicationProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_presence(self, request):
        profile, _ = UserCommunicationProfile.objects.get_or_create(user=request.user)
        presence = request.data.get('presence_status')
        custom = request.data.get('custom_status')
        mute_all = request.data.get('mute_all')

        if presence in UserCommunicationProfile.Presence.values:
            profile.presence_status = presence
        if custom is not None:
            profile.custom_status = custom
        if mute_all is not None:
            profile.mute_all = bool(mute_all)
        
        profile.save()
        return Response(UserCommunicationProfileSerializer(profile).data)

class CommunicationPermissionPolicyViewSet(viewsets.ModelViewSet):
    serializer_class = CommunicationPermissionPolicySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = CommunicationPermissionPolicy.objects.all()

class GlobalSearchViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'messages': [], 'announcements': [], 'conversations': []})

        msgs = PrivateMessage.objects.filter(
            Q(content__icontains=q) | Q(attachment_name__icontains=q),
            conversation__participants=request.user
        )[:20]

        anns = Announcement.objects.filter(
            Q(title__icontains=q) | Q(content__icontains=q)
        )[:10]

        convs = Conversation.objects.filter(
            Q(subject__icontains=q),
            participants=request.user
        )[:10]

        return Response({
            'messages': PrivateMessageSerializer(msgs, many=True, context={'request': request}).data,
            'announcements': AnnouncementSerializer(anns, many=True).data,
            'conversations': ConversationSerializer(convs, many=True, context={'request': request}).data,
        })

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
