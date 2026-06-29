from django.utils import timezone
from ..models import UserCommunicationProfile

class PresenceService:
    @classmethod
    def get_or_create_profile(cls, user):
        profile, _ = UserCommunicationProfile.objects.get_or_create(user=user)
        return profile

    @classmethod
    def update_presence(cls, user, status_code, custom_status=""):
        profile = cls.get_or_create_profile(user)
        valid_statuses = [c[0] for c in UserCommunicationProfile.Presence.choices]
        if status_code in valid_statuses:
            profile.presence_status = status_code
        if custom_status is not None:
            profile.custom_status = custom_status[:100]
        profile.last_seen = timezone.now()
        profile.save()
        return profile

    @classmethod
    def heartbeat(cls, user):
        profile = cls.get_or_create_profile(user)
        profile.last_seen = timezone.now()
        if profile.presence_status == UserCommunicationProfile.Presence.OFFLINE:
            profile.presence_status = UserCommunicationProfile.Presence.ONLINE
        profile.save(update_fields=['last_seen', 'presence_status'])
        return profile
