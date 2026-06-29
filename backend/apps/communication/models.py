from django.db import models
from django.conf import settings

class Conversation(models.Model):
    class Type(models.TextChoices):
        DIRECT = "DIRECT", "Direct Messaging"
        GROUP = "GROUP", "Group Chat"
        COURSE = "COURSE", "Course Discussion"

    type = models.CharField(max_length=20, choices=Type.choices, default=Type.DIRECT)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    subject = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(blank=True)
    course_channel = models.CharField(max_length=50, blank=True)  # e.g., GENERAL, GRAMMAR, VOCABULARY, HOMEWORK
    is_archived = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.subject or f"Conversation #{self.id} ({self.type})"

class PrivateMessage(models.Model):
    class Status(models.TextChoices):
        SENDING = "SENDING", "Sending"
        SENT = "SENT", "Sent"
        DELIVERED = "DELIVERED", "Delivered"
        READ = "READ", "Read"
        FAILED = "FAILED", "Failed"

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to='communication/attachments/', null=True, blank=True)
    attachment_name = models.CharField(max_length=255, blank=True)
    attachment_size = models.PositiveIntegerField(default=0)
    attachment_type = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SENT)
    is_read = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    is_edited = models.BooleanField(default=False)
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    starred_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='starred_messages', blank=True)
    mentions = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='mentioned_in_messages', blank=True)
    metadata = models.JSONField(default=dict, blank=True)  # stores reactions {"👍": [user_ids]}, calendar invites, voice duration
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg from {self.sender.username} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class MessageReadReceipt(models.Model):
    message = models.ForeignKey(PrivateMessage, on_delete=models.CASCADE, related_name='read_receipts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_read_receipts')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['message', 'user']

    def __str__(self):
        return f"{self.user.username} read {self.message_id} at {self.read_at}"

class CommunicationAuditLog(models.Model):
    class Action(models.TextChoices):
        CREATED = "CREATED", "Message Created"
        EDITED = "EDITED", "Message Edited"
        DELETED = "DELETED", "Message Deleted"
        READ = "READ", "Message Read"
        AI_REQUEST = "AI_REQUEST", "AI Assistant Query"

    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    message = models.ForeignKey(PrivateMessage, on_delete=models.SET_NULL, null=True, blank=True)
    conversation = models.ForeignKey(Conversation, on_delete=models.SET_NULL, null=True, blank=True)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.action}] by {self.actor} at {self.timestamp}"

class CommunicationPermissionPolicy(models.Model):
    sender_role = models.CharField(max_length=50)  # STUDENT, TEACHER, FINANCE, ADMISSIONS, ADMIN, PARENT
    target_role = models.CharField(max_length=50)  # ASSIGNED_TEACHER, ASSIGNED_STUDENT, EVERYONE, AI_ASSISTANT, FINANCE, ADMISSIONS, SUPPORT
    is_allowed = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Communication Permission Policies"
        unique_together = ['sender_role', 'target_role']

    def __str__(self):
        return f"{self.sender_role} -> {self.target_role}: {'Allowed' if self.is_allowed else 'Blocked'}"

class UserCommunicationProfile(models.Model):
    class Presence(models.TextChoices):
        ONLINE = "ONLINE", "Online"
        AWAY = "AWAY", "Away"
        BUSY = "BUSY", "Busy"
        OFFLINE = "OFFLINE", "Offline"
        DND = "DND", "Do Not Disturb"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comm_profile')
    presence_status = models.CharField(max_length=20, choices=Presence.choices, default=Presence.ONLINE)
    custom_status = models.CharField(max_length=100, blank=True)
    last_seen = models.DateTimeField(auto_now=True)
    mute_all = models.BooleanField(default=False)
    mute_messages = models.BooleanField(default=False)
    mute_announcements = models.BooleanField(default=False)
    mute_ai = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.presence_status}"

class Announcement(models.Model):
    class TargetGroup(models.TextChoices):
        ALL = "ALL", "All Users"
        STUDENTS = "STUDENTS", "Students Only"
        TEACHERS = "TEACHERS", "Teachers Only"
        STAFF = "STAFF", "Staff & Admin"

    class Priority(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        IMPORTANT = "IMPORTANT", "Important"
        URGENT = "URGENT", "Urgent"
        EMERGENCY = "EMERGENCY", "Emergency"

    title = models.CharField(max_length=255)
    content = models.TextField()
    target_group = models.CharField(max_length=20, choices=TargetGroup.choices, default=TargetGroup.ALL)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.NORMAL)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='announcements')
    is_pinned = models.BooleanField(default=False)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"[{self.priority}] [{self.target_group}] {self.title}"

class BroadcastMessage(models.Model):
    class Channel(models.TextChoices):
        EMAIL = "EMAIL", "Email Dispatch"
        SMS = "SMS", "SMS Dispatch"
        WHATSAPP = "WHATSAPP", "WhatsApp Dispatch"
        PUSH = "PUSH", "Push Notification"

    title = models.CharField(max_length=255)
    message = models.TextField()
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.EMAIL)
    recipient_count = models.PositiveIntegerField(default=0)
    sent_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sent_broadcasts')
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"Broadcast ({self.channel}): {self.title}"

class PushNotificationToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='push_tokens')
    token = models.CharField(max_length=255, unique=True)
    device_type = models.CharField(max_length=50, default="Web/PWA")
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.device_type}"
