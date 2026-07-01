import re
from ai_assistant.models import AIRequestLog

class ConversationMemoryService:
    """
    Manages short-term conversation memory and active entity tracking across QA turns.
    Ensures follow-up questions (e.g. pronouns, previous amounts, student names) resolve seamlessly.
    """

    @classmethod
    def get_conversation_history(cls, session=None, user=None, max_turns: int = 5) -> tuple[str, dict]:
        if not session and not user:
            return "", {}

        query = AIRequestLog.objects.filter(is_deleted=False)
        if session:
            query = query.filter(session=session)
        elif user and getattr(user, 'is_authenticated', False):
            query = query.filter(user=user)
        else:
            return "", {}

        recent_logs = list(query.order_by('-timestamp')[:max_turns])
        if not recent_logs:
            return "", {}

        recent_logs.reverse()

        history_lines = []
        entities = {"names": set(), "amounts": set(), "topics": set()}

        for log in recent_logs:
            q_clean = (log.question or "").strip()
            r_clean = (log.response_text or "").strip()

            # Extract figures and names for active entity tracking
            amounts = re.findall(r'KES\s*[\d,]+(?:\.\d{2})?', r_clean)
            for a in amounts:
                entities["amounts"].add(a)

            if len(r_clean) > 350:
                r_clean = r_clean[:350] + "..."

            if q_clean and r_clean:
                history_lines.append(f"User: {q_clean}")
                history_lines.append(f"Assistant: {r_clean}")

        summary_entities = ""
        if entities["amounts"]:
            summary_entities = f"Active Figures in Context: {', '.join(sorted(list(entities['amounts']))[:4])}."

        mem_packet = "\n".join(history_lines)
        if summary_entities:
            mem_packet = f"{summary_entities}\n\n{mem_packet}"

        return mem_packet, entities
