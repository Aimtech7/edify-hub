from rest_framework import serializers
from communication.models import Conversation, PrivateMessage, Announcement, BroadcastMessage, PushNotificationToken

class PrivateMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = PrivateMessage
        fields = '__all__'
        read_only_fields = ['sender', 'created_at']

class ConversationSerializer(serializers.ModelSerializer):
    messages = PrivateMessageSerializer(many=True, read_only=True)
    participant_names = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = '__all__'

    def get_participant_names(self, obj):
        return [u.username for u in obj.participants.all()]

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
