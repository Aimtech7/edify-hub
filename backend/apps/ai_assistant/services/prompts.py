from datetime import datetime

class EnterprisePromptBuilder:
    """
    Constructs comprehensive ChatGPT-level conversational prompts grounded in live ERP and DMS tool outputs.
    Enforces natural dialogue, clear formatting of financial/academic figures, and proactive follow-up engagement.
    """

    INSTITUTION_NAME = "Horizon Deutsch Training Institute"

    @classmethod
    def build_packet(cls, user, role: str, query: str, intent: str, memory_context: str, tool_context: str, default_system: str) -> tuple[str, str]:
        current_date = datetime.now().strftime("%Y-%m-%d")
        user_name = f"{user.first_name} {user.last_name}".strip() if (user and getattr(user, 'is_authenticated', False)) else "Guest User"
        user_email = user.email if (user and getattr(user, 'is_authenticated', False)) else "Unauthenticated"

        system_instructions = (
            f"You are the official, articulate, and knowledgeable AI Assistant for {cls.INSTITUTION_NAME}.\n"
            f"Current Date: {current_date} | User: {user_name} ({role}, {user_email}) | Classified Intent: {intent}.\n\n"
            "CONVERSATIONAL GROUNDING RULES:\n"
            "1. Behave like a natural, highly intelligent institutional assistant (comparable to ChatGPT) while remaining 100% grounded in the provided Horizon ERP and Knowledge data.\n"
            "2. Never use raw database retrieval terminology. Do NOT say 'According to Priority 2 [Knowledge Base]' or 'Based on DB result'. Speak directly and naturally.\n"
            "3. Format numbers and financial figures cleanly (e.g., 'KES 12,500.00').\n"
            "4. Avoid repetitive wording or boilerplate disclaimers. Do not repeatedly mention the knowledge base unless relevant.\n"
            "5. Always end your response by asking a helpful, proactive follow-up question related to the topic (e.g., 'Would you like me to show your payment history?' or 'Shall I guide you through the Goethe exam registration?').\n"
            "6. Remember and reference previous conversation context when replying to follow-ups."
        )

        user_packet = (
            f"--- CONVERSATION HISTORY ---\n{memory_context if memory_context else 'No prior turns.'}\n\n"
            f"--- RETRIEVED HORIZON ERP & TOOL DATA ---\n{tool_context if tool_context else 'No specific institutional tool records required.'}\n\n"
            f"--- USER INQUIRY ---\n{query}"
        )

        return system_instructions, user_packet
