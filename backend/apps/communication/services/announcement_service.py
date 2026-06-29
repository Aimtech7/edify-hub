from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from ..models import Announcement
from .audit_service import AuditService
from .notification_service import NotificationService
from django.contrib.auth import get_user_model

User = get_user_model()

class AnnouncementService:
    @classmethod
    def publish_announcement(cls, author, title, content, target_group="ALL", priority="NORMAL", scheduled_for=None, is_pinned=False):
        if author.role not in ['ADMIN', 'TEACHER', 'FINANCE', 'ADMISSIONS', 'REGISTRAR', 'HR']:
            raise PermissionDenied("You do not have institutional permission to publish announcements.")
        if not title.strip() or not content.strip():
            raise ValidationError("Title and content are required.")

        ann = Announcement.objects.create(
            title=title.strip()[:255],
            content=content.strip(),
            target_group=target_group,
            priority=priority,
            author=author,
            is_pinned=is_pinned,
            scheduled_for=scheduled_for
        )

        AuditService.log_announcement_published(author, title)

        # Notify if published immediately
        if not scheduled_for or scheduled_for <= timezone.now():
            cls._dispatch_announcement_notifications(ann)

        return ann

    @classmethod
    def _dispatch_announcement_notifications(cls, announcement):
        # Notify relevant target groups
        users = User.objects.all()
        if announcement.target_group == 'STUDENTS':
            users = users.filter(role='STUDENT')
        elif announcement.target_group == 'TEACHERS':
            users = users.filter(role='TEACHER')
        elif announcement.target_group == 'STAFF':
            users = users.exclude(role='STUDENT').exclude(role='PARENT')

        for u in users:
            NotificationService.notify_user(
                user=u,
                title=f"[{announcement.priority}] {announcement.title}",
                message=announcement.content[:150],
                notif_type="announcement"
            )
