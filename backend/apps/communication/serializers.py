from rest_framework import serializers
from communication.models import (
    Conversation, PrivateMessage, Announcement, BroadcastMessage,
    PushNotificationToken, MessageReadReceipt, CommunicationAuditLog,
    CommunicationPermissionPolicy, UserCommunicationProfile
)

class PrivateMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    attachment_url = serializers.SerializerMethodField()
    reply_to_preview = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    is_starred_by_me = serializers.SerializerMethodField()
    mentions_list = serializers.SerializerMethodField()

    class Meta:
        model = PrivateMessage
        fields = '__all__'
        read_only_fields = ['sender', 'created_at']

    def get_attachment_url(self, obj):
        if obj.attachment and hasattr(obj.attachment, 'url'):
            return obj.attachment.url
        return None

    def get_reply_to_preview(self, obj):
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'sender_username': obj.reply_to.sender.username,
                'content': obj.reply_to.content[:60] + ('...' if len(obj.reply_to.content) > 60 else '')
            }
        return None

    def get_reactions(self, obj):
        return obj.metadata.get('reactions', {}) if isinstance(obj.metadata, dict) else {}

    def get_is_starred_by_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.starred_by.filter(id=request.user.id).exists()
        return False

    def get_mentions_list(self, obj):
        return [u.username for u in obj.mentions.all()]

class ConversationSerializer(serializers.ModelSerializer):
    messages = PrivateMessageSerializer(many=True, read_only=True)
    participant_names = serializers.SerializerMethodField()
    participant_details = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = '__all__'
        read_only_fields = ['participants', 'created_by']

    def get_participant_names(self, obj):
        return [u.username for u in obj.participants.all()]

    def get_participant_details(self, obj):
        res = []
        for u in obj.participants.all():
            presence = "ONLINE"
            if hasattr(u, 'comm_profile'):
                presence = u.comm_profile.presence_status
            name = f"{u.first_name} {u.last_name}".strip() or u.username
            res.append({
                'id': u.id,
                'username': u.username,
                'name': name,
                'role': getattr(u, 'role', ''),
                'presence': presence,
                'email': getattr(u, 'email', '') or ''
            })
        return res

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'content': last_msg.content,
                'sender_username': last_msg.sender.username,
                'created_at': last_msg.created_at,
                'status': last_msg.status
            }
        return None

class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ['author', 'created_at']

class BroadcastMessageSerializer(serializers.ModelSerializer):
    sent_by_name = serializers.CharField(source='sent_by.username', read_only=True)

    class Meta:
        model = BroadcastMessage
        fields = '__all__'
        read_only_fields = ['sent_by', 'sent_at']

class PushNotificationTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushNotificationToken
        fields = '__all__'
        read_only_fields = ['user', 'registered_at']

class CommunicationAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True)

    class Meta:
        model = CommunicationAuditLog
        fields = '__all__'

class CommunicationPermissionPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationPermissionPolicy
        fields = '__all__'

class UserCommunicationProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = UserCommunicationProfile
        fields = '__all__'
        read_only_fields = ['user']
