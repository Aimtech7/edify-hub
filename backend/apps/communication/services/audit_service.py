from ..models import CommunicationAuditLog

class AuditService:
    @classmethod
    def log(cls, actor, action, conversation=None, message=None, details=""):
        try:
            # Ensure action string fits choice max length or fallback
            action_str = str(action).upper()
            if len(action_str) > 20:
                action_str = action_str[:20]
            CommunicationAuditLog.objects.create(
                actor=actor if (actor and actor.is_authenticated) else None,
                action=action_str,
                conversation=conversation,
                message=message,
                details=str(details)
            )
        except Exception:
            # Audit logging should never break core transaction flows
            pass

    @classmethod
    def log_conversation_created(cls, actor, conversation):
        cls.log(actor, "CREATED", conversation=conversation, details=f"Created conversation '{conversation.subject}' ({conversation.type})")

    @classmethod
    def log_message_sent(cls, actor, message):
        cls.log(actor, "CREATED", conversation=message.conversation, message=message, details="Sent private message")

    @classmethod
    def log_message_edited(cls, actor, message):
        cls.log(actor, "EDITED", conversation=message.conversation, message=message, details="Edited private message")

    @classmethod
    def log_message_deleted(cls, actor, message):
        cls.log(actor, "DELETED", conversation=message.conversation, message=message, details="Deleted private message")

    @classmethod
    def log_attachment_uploaded(cls, actor, message, file_name):
        cls.log(actor, "CREATED", conversation=message.conversation, message=message, details=f"Uploaded attachment '{file_name}'")

    @classmethod
    def log_ai_request(cls, actor, conversation, query):
        cls.log(actor, "AI_REQUEST", conversation=conversation, details=f"AI query: {query[:100]}")

    @classmethod
    def log_announcement_published(cls, actor, title):
        cls.log(actor, "CREATED", details=f"Published announcement '{title}'")
