from ai_assistant.models import AIRequestLog

class ConversationMemoryService:
    """
    Manages short-term conversation memory by fetching recent QA turns from AIRequestLog.
    Enables follow-up questions to maintain continuity and context across user interactions.
    """

    @classmethod
    def get_conversation_history(cls, session=None, user=None, max_turns: int = 5) -> str:
        if not session and not user:
            return ""

        query = AIRequestLog.objects.filter(is_deleted=False)
        if session:
            query = query.filter(session=session)
        elif user and getattr(user, 'is_authenticated', False):
            # If no explicit session is given, fetch recent queries by user within last 2 hours
            query = query.filter(user=user)
        else:
            return ""

        recent_logs = list(query.order_by('-timestamp')[:max_turns])
        if not recent_logs:
            return ""

        # Reverse so chronological order is maintained (oldest to newest)
        recent_logs.reverse()

        history_lines = ["--- Prior Conversation Context ---"]
        for log in recent_logs:
            q_clean = (log.question or "").strip()
            r_clean = (log.response_text or "").strip()
            if len(r_clean) > 300:
                r_clean = r_clean[:300] + "..."
            if q_clean and r_clean:
                history_lines.append(f"User: {q_clean}")
                history_lines.append(f"Assistant: {r_clean}")

        history_lines.append("--- End Prior Context ---\n")
        return "\n".join(history_lines)
