from django.db import models
from django.conf import settings

class Conversation(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    subject = models.CharField(max_length=255, blank=True)
    is_archived = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.subject or f"Conversation #{self.id}"

class PrivateMessage(models.Model):
    class Status(models.TextChoices):
        SENDING = "SENDING", "Sending"
        SENT = "SENT", "Sent"
        DELIVERED = "DELIVERED", "Delivered"
        READ = "READ", "Read"
        FAILED = "FAILED", "Failed"

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    attachment = models.FileField(upload_to='communication/attachments/', null=True, blank=True)
    attachment_name = models.CharField(max_length=255, blank=True)
    attachment_size = models.PositiveIntegerField(default=0)
    attachment_type = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SENT)
    is_read = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
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

class Announcement(models.Model):
    class TargetGroup(models.TextChoices):
        ALL = "ALL", "All Users"
        STUDENTS = "STUDENTS", "Students Only"
        TEACHERS = "TEACHERS", "Teachers Only"
        STAFF = "STAFF", "Staff & Admin"

    title = models.CharField(max_length=255)
    content = models.TextField()
    target_group = models.CharField(max_length=20, choices=TargetGroup.choices, default=TargetGroup.ALL)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='announcements')
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"[{self.target_group}] {self.title}"

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
