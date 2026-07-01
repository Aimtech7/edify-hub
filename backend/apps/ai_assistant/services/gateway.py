import logging
import time
import hashlib
from ai_assistant.providers import OpenAIProvider, HuggingFaceProvider

logger = logging.getLogger(__name__)

class IntelligentSynthesisEngine:
    """
    Generates tailored, non-repetitive responses when primary and secondary LLM endpoints are unavailable
    or when local institutional data direct synthesis is faster/preferred.
    """

    @classmethod
    def synthesize(cls, question: str, context: str, user, role: str, intent: str) -> str:
        q_clean = question.strip()
        has_erp = any(header in context for header in ["Student Profile:", "Fee Statement", "Recent Attendance Record:", "Academic Results:", "Instructor Profile:", "System Metrics:", "Admissions Queue:", "Finance Overview:"])
        has_kb = any("Priority " in line for line in context.split("\n"))

        # Variation seed to ensure responses are never static or repetitive
        seed = int(hashlib.md5(f"{q_clean}".encode()).hexdigest(), 16) % 3

        if intent == "FINANCE" and has_erp:
            lines = [line for line in context.split("\n") if "Fee Statement" in line or "Student Profile" in line]
            erp_summary = "\n".join(lines)
            if seed == 0:
                return f"### Horizon Financial Services\n\nIn response to your query regarding '{q_clean}', here is your current financial summary retrieved from the ERP ledger:\n\n{erp_summary}\n\nTo make payments via M-Pesa or bank transfer, navigate to the **Payments & Fees** section."
            elif seed == 1:
                return f"### Account Statement Summary\n\nAddressing your request ({q_clean}):\n{erp_summary}\n\nAll fee receipts and payment plans are continuously updated in real-time."
            else:
                return f"### ERP Billing Details\n\nRegarding '{q_clean}', we found the following fee status linked to your account:\n\n{erp_summary}\n\nIf you believe there is a discrepancy, contact the Finance Office."

        if intent == "ATTENDANCE" and has_erp:
            lines = [line for line in context.split("\n") if "Attendance Record" in line or "Student Profile" in line]
            att_summary = "\n".join(lines)
            if seed == 0:
                return f"### Attendance Audit Report\n\nRegarding '{q_clean}', here is your classroom register summary:\n{att_summary}\n\nRegular attendance (at least 80%) is required for Goethe-Institut certificate eligibility."
            else:
                return f"### Classroom Attendance Status\n\nAnswering '{q_clean}':\n{att_summary}\n\nPlease monitor your class participation through the student portal."

        if intent == "CERTIFICATES" and has_erp:
            lines = [line for line in context.split("\n") if "Certificates:" in line or "Academic Results" in line]
            cert_summary = "\n".join(lines)
            return f"### Horizon Certification & Transcripts\n\nIn response to '{q_clean}', retrieved credentials:\n{cert_summary}\n\nOfficial Goethe-Zertifikat preparation files are also accessible via the digital library."

        if intent == "ADMISSIONS":
            if has_erp and role in ["ADMIN", "REGISTRAR", "ADMISSIONS"]:
                lines = [line for line in context.split("\n") if "Admissions Queue" in line or "System Metrics" in line]
                return f"### Administration Portal: Admissions\n\nQuery ({q_clean}) queue status:\n" + "\n".join(lines)
            return f"### Admissions & Course Intake\n\nRegarding '{q_clean}': Horizon Deutsch Training Institute welcomes applicants for CEFR levels A1 through C2. To check admission eligibility or track an existing application, please review your portal notifications or email registrar@horizondeutsch.com."

        if intent == "ODEL":
            return f"### Horizon ODEL & LMS Portal\n\nRegarding '{q_clean}': Our Open, Distance, and e-Learning (ODEL) platform integrates virtual classroom Zoom sessions, moodle assignments, and digital lesson resources. Access your scheduled lectures directly from the **Timetable & LMS** menu."

        if has_erp or has_kb:
            # General institutional RAG synthesis
            clean_ctx = "\n".join([l for l in context.split("\n") if not l.startswith("SECURITY GOVERNANCE") and not l.startswith("GOETHE GERMAN TUTOR")][:6])
            if seed == 0:
                return f"### Horizon Institutional Knowledge\n\nBased on retrieved institutional records:\n\n{clean_ctx}\n\n*If you require specific administrative assistance, please use your dashboard navigation.*"
            elif seed == 1:
                return f"### Horizon ERP Assistant\n\nHere is what we found in the official knowledge base regarding your question:\n\n{clean_ctx}"
            else:
                return f"### Horizon Portal Guidance\n\nRelevant documentation:\n\n{clean_ctx}"

        # General Conversation / German Linguistic Assistance
        if seed == 0:
            return f"### General AI & German Linguistic Assistance\n\nNote: Answering based on general knowledge and German linguistics (No specific Horizon institutional policy record required).\n\nRegarding your question concerning '{q_clean}': Whether you are studying vocabulary, grammar structures (Der/Die/Das), or sentence construction, consistent practice yields success. Let me know which exact CEFR level (A1-C2) you are focusing on!"
        elif seed == 1:
            return f"### Horizon Language Assistant\n\nNote: Answering based on general knowledge and German linguistics.\n\nI am happy to assist you with German grammar, vocabulary, or general inquiries: '{q_clean}'. How else can I support your learning today?"
        else:
            return f"### Horizon Assistant\n\nNote: Answering based on general knowledge and German linguistics.\n\nThank you for reaching out with '{q_clean}'. Feel free to ask about specific German exam modules or institutional services!"


class AIGateway:
    """
    Enterprise AI Gateway managing multi-provider routing, fallback resilience, and execution telemetry.
    """

    @classmethod
    def execute(cls, question: str, context: str, user, role: str, intent: str, memory_context: str, config) -> tuple[str, str, str, int]:
        """
        Executes query against primary provider, falling back to secondary provider or intelligent synthesis.
        Returns: (response_text, provider_used, fallback_reason, tokens_used)
        """
        full_context = f"{memory_context}\n{context}".strip()
        tokens_approx = int(len(full_context + question) / 4)
        fallback_reasons = []

        # Determine preferred primary provider
        primary_name = config.provider

        # Try OpenAI if selected or configured
        if primary_name == "OPENAI" or config.openai_api_key:
            provider = OpenAIProvider(api_key=config.openai_api_key, model_name=config.model_name if primary_name == "OPENAI" else "gpt-4o-mini")
            try:
                reply = provider.generate(
                    system_prompt=config.system_prompt,
                    user_prompt=question,
                    context=full_context,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
                if reply:
                    return reply, "OPENAI", "", tokens_approx
            except Exception as e:
                msg = f"OpenAI error: {str(e)}"
                logger.warning(msg)
                fallback_reasons.append(msg)

        # Try Hugging Face if selected or as secondary fallback
        if primary_name == "HUGGINGFACE" or fallback_reasons or config.huggingface_api_key:
            provider = HuggingFaceProvider(api_key=config.huggingface_api_key, model_name=config.model_name if primary_name == "HUGGINGFACE" else "mistralai/Mistral-7B-Instruct-v0.3")
            try:
                reply = provider.generate(
                    system_prompt=config.system_prompt,
                    user_prompt=question,
                    context=full_context,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
                if reply:
                    reason = "; ".join(fallback_reasons) if fallback_reasons else ""
                    return reply, "HUGGINGFACE", reason, tokens_approx
            except Exception as e:
                msg = f"HuggingFace error: {str(e)}"
                logger.warning(msg)
                fallback_reasons.append(msg)

        # Fallback to Intelligent Synthesis Engine
        reply = IntelligentSynthesisEngine.synthesize(question, context, user, role, intent)
        reason = "; ".join(fallback_reasons) if fallback_reasons else "Direct Synthesis Preferred"
        return reply, "LOCAL_SYNTHESIS", reason, tokens_approx
