from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from ..models import PrivateMessage
from .audit_service import AuditService

User = get_user_model()

try:
    from ai_assistant.models import AISetting
    from ai_assistant.retrieval import retrieve_rag_context
    from ai_assistant.providers import get_llm_provider
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False

class AIConversationService:
    @classmethod
    def process_ai_request(cls, actor, conversation, prompt="", action_type="QUERY"):
        if not prompt.strip() and action_type == "QUERY":
            raise ValidationError("Prompt cannot be empty.")

        # Record prompt as user message if custom query
        user_msg = None
        display_prompt = prompt
        if action_type != "QUERY":
            display_prompt = f"[{action_type}] {prompt}"

        user_msg = PrivateMessage.objects.create(
            conversation=conversation,
            sender=actor,
            content=f"🤖 AI Inquiry: {display_prompt}",
            status=PrivateMessage.Status.READ
        )

        reply_content = "AI Assistant is currently offline or unconfigured."
        if AI_AVAILABLE:
            try:
                # Gather recent conversation history for context
                recent_msgs = conversation.messages.order_by('-created_at')[:20]
                history_text = "\n".join([f"{m.sender.username}: {m.content}" for m in reversed(recent_msgs)])
                
                system_instruction = "You are Horizon AI Assistant inside an educational enterprise collaboration platform."
                if action_type == "SUMMARIZE":
                    full_query = f"Please summarize key decisions, action items, and main points from this conversation:\n\n{history_text}"
                elif action_type == "GRAMMAR":
                    full_query = f"Please analyze and correct German/English grammar and provide learning feedback on the following text:\n{prompt}"
                elif action_type == "TRANSLATE":
                    full_query = f"Please translate the following text accurately between German and English:\n{prompt}"
                elif action_type == "REWRITE":
                    full_query = f"Please rewrite the following text professionally and clearly for institutional communication:\n{prompt}"
                elif action_type == "MINUTES":
                    full_query = f"Please generate formal Meeting Minutes with attendees, agenda topics discussed, and action points assigned based on this thread:\n\n{history_text}"
                else:
                    full_query = f"Thread Context:\n{history_text}\n\nUser Request: {prompt}"

                context_text, _ = retrieve_rag_context(actor, full_query)
                config = AISetting.get_settings()
                provider = get_llm_provider(config)
                reply_content = provider.generate(
                    system_prompt=config.system_prompt + "\n" + system_instruction,
                    user_prompt=full_query,
                    context=context_text,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
            except Exception as e:
                reply_content = f"Horizon AI encountered an issue: {str(e)}"

        # Find or create virtual AI Bot user
        ai_user, _ = User.objects.get_or_create(username='Horizon-AI', defaults={'email': 'ai@deutschakademie.co.ke', 'role': 'STAFF'})

        ai_msg = PrivateMessage.objects.create(
            conversation=conversation,
            sender=ai_user,
            content=reply_content,
            status=PrivateMessage.Status.READ,
            reply_to=user_msg
        )
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        AuditService.log_ai_request(actor, conversation, display_prompt)
        return ai_msg
