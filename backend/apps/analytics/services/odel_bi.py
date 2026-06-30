import datetime
from django.db.models import Count, Sum, Avg, Q


def get_odel_bi_data():
    lessons_pub = 0
    draft_lessons = 0
    completed_lessons = 0
    assignments_total = 0
    assignments_sub = 0
    discussions = 0
    downloads = 0
    video_views = 0
    online_students = 0
    virtual_classes_count = 0
    avg_progress = 0.0
    storage_bytes = 0
    notes_count = 0

    try:
        from odel.models import (
            Lesson, StudentLessonProgress, Assignment, AssignmentSubmission,
            ForumPost, Resource, StudentLessonNote
        )
        from academics.models import VirtualClass

        lessons_pub = Lesson.objects.filter(is_published=True, status='PUBLISHED').count()
        draft_lessons = Lesson.objects.filter(status='DRAFT').count()
        completed_lessons = StudentLessonProgress.objects.filter(is_completed=True).count()
        assignments_total = Assignment.objects.count()
        assignments_sub = AssignmentSubmission.objects.count()
        discussions = ForumPost.objects.count()
        downloads = StudentLessonProgress.objects.aggregate(t=Sum('download_count'))['t'] or 0
        video_views = StudentLessonProgress.objects.filter(video_watch_percentage__gt=0).count()
        online_students = StudentLessonProgress.objects.values('student').distinct().count()
        virtual_classes_count = VirtualClass.objects.count()
        avg_progress = round(
            StudentLessonProgress.objects.aggregate(a=Avg('progress_percentage'))['a'] or 0.0, 1
        )
        storage_bytes = Resource.objects.aggregate(s=Sum('file_size_bytes'))['s'] or 0
        notes_count = StudentLessonNote.objects.count()
    except Exception:
        pass

    storage_mb = round(storage_bytes / (1024 * 1024), 2)

    return {
        "kpis": {
            "lessons_published": lessons_pub,
            "draft_lessons": draft_lessons,
            "completed_lessons": completed_lessons,
            "assignments_total": assignments_total,
            "assignments_submitted": assignments_sub,
            "discussion_activity": discussions,
            "resource_downloads": downloads,
            "video_views": video_views,
            "online_students": online_students,
            "virtual_classes": virtual_classes_count,
            "learning_progress_pct": avg_progress,
            "storage_usage_mb": storage_mb,
            "student_notes": notes_count
        }
    }


def get_communication_bi_data():
    """
    All values derived strictly from live PostgreSQL queries.
    NOTE: The model is PrivateMessage (not Message), Announcement, BroadcastMessage.
    """
    today = datetime.date.today()
    msg_total = 0
    msg_today = 0
    unread_messages = 0
    announcements = 0
    broadcasts_sent = 0
    active_conversations = 0
    attachment_storage_bytes = 0
    ai_convos = 0

    try:
        from communication.models import PrivateMessage, Announcement, BroadcastMessage, Conversation
        msg_total = PrivateMessage.objects.filter(is_deleted=False).count()
        msg_today = PrivateMessage.objects.filter(is_deleted=False, created_at__date=today).count()
        unread_messages = PrivateMessage.objects.filter(is_read=False, is_deleted=False).count()
        announcements = Announcement.objects.count()
        broadcasts_sent = BroadcastMessage.objects.count()
        active_conversations = Conversation.objects.filter(is_archived=False).count()
        attachment_storage_bytes = PrivateMessage.objects.filter(
            is_deleted=False, attachment_size__gt=0
        ).aggregate(s=Sum('attachment_size'))['s'] or 0
    except Exception:
        pass

    try:
        from ai_assistant.models import AIRequestLog
        ai_convos = AIRequestLog.objects.count()
    except Exception:
        pass

    # Most active conversations by message count (live aggregation)
    most_active_conversations = []
    try:
        from communication.models import Conversation, PrivateMessage
        for row in PrivateMessage.objects.filter(is_deleted=False).values(
            'conversation__subject', 'conversation__type'
        ).annotate(msg_count=Count('id')).order_by('-msg_count')[:5]:
            most_active_conversations.append({
                "conversation": row['conversation__subject'] or f"({row['conversation__type']})",
                "messages": row['msg_count']
            })
    except Exception:
        pass

    # Most active announcers (live aggregation)
    most_active_announcers = []
    try:
        from communication.models import Announcement
        for row in Announcement.objects.values(
            'author__first_name', 'author__last_name', 'author__username'
        ).annotate(ann_count=Count('id')).order_by('-ann_count')[:5]:
            name = (
                f"{row['author__first_name']} {row['author__last_name']}".strip()
                or row['author__username']
                or "Unknown"
            )
            most_active_announcers.append({
                "author": name,
                "announcements": row['ann_count']
            })
    except Exception:
        pass

    return {
        "kpis": {
            "messages_total": msg_total,
            "messages_today": msg_today,
            "unread_messages": unread_messages,
            "announcements": announcements,
            "broadcasts_sent": broadcasts_sent,
            "active_conversations": active_conversations,
            "attachment_storage_bytes": attachment_storage_bytes,
            "attachment_storage_mb": round(attachment_storage_bytes / (1024 * 1024), 2),
            "ai_conversations": ai_convos,
        },
        "most_active_conversations": most_active_conversations,
        "most_active_announcers": most_active_announcers,
    }
