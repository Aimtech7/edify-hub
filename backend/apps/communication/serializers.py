from rest_framework import serializers
from communication.models import (
    Conversation, PrivateMessage, Announcement, BroadcastMessage,
    PushNotificationToken, MessageReadReceipt, CommunicationAuditLog
)

class PrivateMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = PrivateMessage
        fields = '__all__'
        read_only_fields = ['sender', 'created_at']

    def get_attachment_url(self, obj):
        if obj.attachment and hasattr(obj.attachment, 'url'):
            return obj.attachment.url
        return None

class ConversationSerializer(serializers.ModelSerializer):
    messages = PrivateMessageSerializer(many=True, read_only=True)
    participant_names = serializers.SerializerMethodField()
    participant_details = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = '__all__'

    def get_participant_names(self, obj):
        return [u.username for u in obj.participants.all()]

    def get_participant_details(self, obj):
        return [{'id': u.id, 'username': u.username, 'role': getattr(u, 'role', '')} for u in obj.participants.all()]

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
