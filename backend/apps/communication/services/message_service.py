from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied
from ..models import PrivateMessage, MessageReadReceipt, Conversation
from .permission_service import PermissionService
from .audit_service import AuditService
from .notification_service import NotificationService
from .attachment_service import AttachmentService

class MessageService:
    @classmethod
    def send_message(cls, sender, conversation, content="", file_obj=None, reply_to_id=None, mentions_ids=None):
        if not content.strip() and not file_obj:
            raise ValidationError("Message content or attachment cannot be empty.")

        # Ensure sender is in conversation participants
        if not conversation.participants.filter(pk=sender.pk).exists():
            raise PermissionDenied("You are not a participant in this conversation.")

        # Verify permission against all other participants if DIRECT
        if conversation.type == Conversation.Type.DIRECT:
            for target in conversation.participants.exclude(pk=sender.pk):
                PermissionService.can_message(sender, target)

        reply_msg = None
        if reply_to_id:
            reply_msg = PrivateMessage.objects.filter(pk=reply_to_id, conversation=conversation).first()

        message = PrivateMessage.objects.create(
            conversation=conversation,
            sender=sender,
            content=content.strip(),
            reply_to=reply_msg,
            status=PrivateMessage.Status.SENT
        )

        if file_obj:
            AttachmentService.save_attachment(message, file_obj, sender)

        if mentions_ids and isinstance(mentions_ids, list):
            for m_id in mentions_ids:
                try:
                    p = conversation.participants.get(pk=int(m_id))
                    message.mentions.add(p)
                except Exception:
                    pass

        # Mark conversation updated
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        AuditService.log_message_sent(sender, message)

        # Send Notifications
        notif_title = f"New message from {sender.username}"
        if conversation.type != Conversation.Type.DIRECT:
            notif_title = f"[{conversation.subject or conversation.type}] {sender.username}"
        NotificationService.notify_conversation_participants(
            conversation=conversation,
            sender=sender,
            title=notif_title,
            message=content[:150] or "[Attachment]"
        )

        return message

    @classmethod
    def edit_message(cls, actor, message, new_content):
        if message.sender_id != actor.pk and actor.role != 'ADMIN':
            raise PermissionDenied("You can only edit your own messages.")
        if message.is_deleted:
            raise ValidationError("Cannot edit a deleted message.")
        if not new_content.strip():
            raise ValidationError("Edited message content cannot be empty.")

        message.content = new_content.strip()
        message.is_edited = True
        message.save(update_fields=['content', 'is_edited'])
        AuditService.log_message_edited(actor, message)
        return message

    @classmethod
    def delete_message(cls, actor, message, delete_for_everyone=False):
        if message.sender_id != actor.pk and actor.role != 'ADMIN':
            raise PermissionDenied("You do not have permission to delete this message.")
        
        message.is_deleted = True
        if delete_for_everyone:
            message.content = "This message was deleted."
            if message.attachment:
                message.attachment.delete(save=False)
                message.attachment_name = ""
                message.attachment_size = 0
        message.save(update_fields=['is_deleted', 'content', 'attachment_name', 'attachment_size'])
        AuditService.log_message_deleted(actor, message)
        return message

    @classmethod
    def toggle_reaction(cls, actor, message, emoji):
        if not emoji:
            raise ValidationError("Emoji symbol is required.")
        meta = message.metadata or {}
        reactions = meta.get('reactions', {})
        users_list = reactions.get(emoji, [])
        
        if actor.pk in users_list:
            users_list.remove(actor.pk)
            if not users_list:
                reactions.pop(emoji, None)
        else:
            users_list.append(actor.pk)
            reactions[emoji] = users_list
            
        meta['reactions'] = reactions
        message.metadata = meta
        message.save(update_fields=['metadata'])
        return message

    @classmethod
    def toggle_star(cls, actor, message):
        if message.starred_by.filter(pk=actor.pk).exists():
            message.starred_by.remove(actor)
            starred = False
        else:
            message.starred_by.add(actor)
            starred = True
        return starred

    @classmethod
    def mark_read(cls, actor, message):
        if message.sender_id == actor.pk:
            return
        MessageReadReceipt.objects.get_or_create(message=message, user=actor)
        if not message.is_read:
            message.is_read = True
            message.status = PrivateMessage.Status.READ
            message.save(update_fields=['is_read', 'status'])
