from ..models import Conversation
from django.contrib.auth import get_user_model

User = get_user_model()

class DiscussionService:
    DEFAULT_CHANNELS = [
        "GENERAL",
        "GRAMMAR",
        "VOCABULARY",
        "LISTENING",
        "SPEAKING",
        "HOMEWORK",
        "TEACHER_QA",
        "ANNOUNCEMENTS"
    ]

    @classmethod
    def initialize_course_discussions(cls, course_id, course_name, admin_user=None):
        """Automatically creates the 7 default discussion channels for a course."""
        if not admin_user:
            admin_user = User.objects.filter(role='ADMIN').first()
            if not admin_user:
                return []

        created_convs = []
        for ch in cls.DEFAULT_CHANNELS:
            conv, created = Conversation.objects.get_or_create(
                type=Conversation.Type.COURSE,
                entity_id=str(course_id),
                entity_type='COURSE',
                course_channel=ch,
                defaults={
                    'subject': f"{course_name} - #{ch}",
                    'created_by': admin_user
                }
            )
            if created:
                conv.participants.add(admin_user)
            created_convs.append(conv)
        return created_convs

    @classmethod
    def sync_user_to_course(cls, user, course_id):
        """Adds an enrolled student or assigned teacher to all channels of a course."""
        convs = Conversation.objects.filter(
            type=Conversation.Type.COURSE,
            entity_id=str(course_id),
            entity_type='COURSE'
        )
        for c in convs:
            c.participants.add(user)
        return convs.count()

    @classmethod
    def remove_user_from_course(cls, user, course_id):
        """Removes a dropped/transferred student from course channels."""
        convs = Conversation.objects.filter(
            type=Conversation.Type.COURSE,
            entity_id=str(course_id),
            entity_type='COURSE'
        )
        for c in convs:
            c.participants.remove(user)
        return convs.count()
