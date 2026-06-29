from rest_framework.exceptions import ValidationError, PermissionDenied
from ..models import Conversation
from .permission_service import PermissionService
from .audit_service import AuditService

class ConversationService:
    @classmethod
    def create_conversation(cls, creator, conv_type, subject="", participant_ids=None, course_channel="", entity_id="", entity_type=""):
        valid_types = [c[0] for c in Conversation.Type.choices]
        if conv_type not in valid_types:
            raise ValidationError(f"Invalid conversation type: '{conv_type}'.")

        # Resolve participants
        resolved_users = PermissionService.validate_participant_list(creator, participant_ids or [])

        # If Direct chat, check if conversation between the two users already exists
        if conv_type == Conversation.Type.DIRECT and len(resolved_users) == 1:
            target = resolved_users[0]
            existing = Conversation.objects.filter(type=Conversation.Type.DIRECT, participants=creator).filter(participants=target).first()
            if existing:
                return existing

        conv = Conversation.objects.create(
            type=conv_type,
            subject=subject[:255].strip(),
            course_channel=course_channel[:50].strip() if conv_type == Conversation.Type.COURSE else "",
            entity_id=str(entity_id)[:100],
            entity_type=str(entity_type)[:100],
            created_by=creator
        )

        conv.participants.add(creator, *resolved_users)
        AuditService.log_conversation_created(creator, conv)
        return conv

    @classmethod
    def add_participants(cls, actor, conversation, participant_ids):
        if actor not in conversation.participants.all() and actor.role != 'ADMIN':
            raise PermissionDenied("You must be a participant or admin to add new members.")
        
        resolved_users = PermissionService.validate_participant_list(actor, participant_ids)
        conversation.participants.add(*resolved_users)
        AuditService.log(actor, "EDITED", conversation=conversation, details=f"Added {len(resolved_users)} participants")
        return conversation

    @classmethod
    def remove_participant(cls, actor, conversation, target_user):
        if actor not in conversation.participants.all() and actor.role != 'ADMIN':
            raise PermissionDenied("You must be a participant or admin to remove members.")
        if target_user.pk == conversation.created_by_id and actor.role != 'ADMIN':
            raise PermissionDenied("Cannot remove the creator of the conversation.")

        conversation.participants.remove(target_user)
        AuditService.log(actor, "EDITED", conversation=conversation, details=f"Removed user {target_user.username}")
        return conversation

    @classmethod
    def toggle_pin(cls, actor, conversation):
        if actor not in conversation.participants.all() and actor.role != 'ADMIN':
            raise PermissionDenied("Access denied.")
        conversation.is_pinned = not conversation.is_pinned
        conversation.save(update_fields=['is_pinned'])
        return conversation.is_pinned

    @classmethod
    def toggle_archive(cls, actor, conversation):
        if actor not in conversation.participants.all() and actor.role != 'ADMIN':
            raise PermissionDenied("Access denied.")
        conversation.is_archived = not conversation.is_archived
        conversation.save(update_fields=['is_archived'])
        return conversation.is_archived
