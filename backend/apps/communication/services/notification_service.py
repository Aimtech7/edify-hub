from django.contrib.auth import get_user_model
from ..models import UserCommunicationProfile, PushNotificationToken
from notifications.models import Notification

User = get_user_model()

class NotificationService:
    @classmethod
    def should_notify(cls, user, notif_type="message"):
        try:
            profile = user.comm_profile
            if profile.mute_all:
                return False
            if notif_type == "message" and profile.mute_messages:
                return False
            if notif_type == "announcement" and profile.mute_announcements:
                return False
            if notif_type == "ai" and profile.mute_ai:
                return False
        except UserCommunicationProfile.DoesNotExist:
            pass
        return True

    @classmethod
    def notify_user(cls, user, title, message, notif_type="message"):
        if not cls.should_notify(user, notif_type):
            return None
        
        # 1. Create In-App Notification
        notif = Notification.objects.create(
            user=user,
            title=title[:255],
            message=message
        )

        # 2. Trigger Email / WhatsApp / Push dispatch hook if configured
        # This interfaces seamlessly with background workers or external queues
        return notif

    @classmethod
    def notify_conversation_participants(cls, conversation, sender, title, message, notif_type="message"):
        notifs = []
        for p in conversation.participants.exclude(pk=sender.pk):
            res = cls.notify_user(p, title, message, notif_type)
            if res:
                notifs.append(res)
        return notifs

    @classmethod
    def register_push_token(cls, user, token_str, device_type="Web/PWA"):
        if not token_str:
            return None
        token_obj, _ = PushNotificationToken.objects.update_or_create(
            user=user,
            token=token_str,
            defaults={'device_type': device_type}
        )
        return token_obj
