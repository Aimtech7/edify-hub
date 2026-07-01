import logging
import time
import hashlib
import re
from ai_assistant.providers import OpenAIProvider, HuggingFaceProvider

logger = logging.getLogger(__name__)

class IntelligentSynthesisEngine:
    """
    Generates natural ChatGPT-level conversational responses when external LLM APIs are unavailable.
    Presents ERP figures cleanly and concludes with engaging, proactive follow-up questions.
    """

    @classmethod
    def synthesize(cls, question: str, tool_data: str, user, role: str, intent: str) -> str:
        q_clean = question.strip()
        seed = int(hashlib.md5(f"{q_clean}".encode()).hexdigest(), 16) % 3

        if intent == "FINANCE" or "Fee Balance" in tool_data or "Billing Record" in tool_data:
            # Extract figures cleanly
            bal_match = re.search(r'Outstanding Balance (?:is )?KES ([\d,]+(?:\.\d{2})?)', tool_data)
            paid_match = re.search(r'Amount Paid KES ([\d,]+(?:\.\d{2})?)', tool_data)
            total_match = re.search(r'Total Course Fee KES ([\d,]+(?:\.\d{2})?)', tool_data)
            
            bal_str = f"KES {bal_match.group(1)}" if bal_match else "KES 0.00"
            paid_str = f"KES {paid_match.group(1)}" if paid_match else "KES 0.00"
            
            if seed == 0:
                return f"I found your fee record in the ERP ledger. Your current outstanding balance is **{bal_str}**, with total payments to date amounting to {paid_str}.\n\nWould you like me to show your full payment history or generate an M-Pesa payment invoice?"
            elif seed == 1:
                return f"Reviewing your billing statement for '{q_clean}', your outstanding balance currently stands at **{bal_str}**.\n\nShall I guide you on how to submit your next installment via the payments portal?"
            else:
                return f"Your student account shows an active fee balance of **{bal_str}** (Amount settled: {paid_str}).\n\nWould you like me to display your detailed installment breakdown?"

        if intent == "ATTENDANCE" or "Attendance Register" in tool_data:
            rate_match = re.search(r'\((\d+(?:\.\d+)?)\%\s*attendance rate\)', tool_data)
            rate_str = f"{rate_match.group(1)}%" if rate_match else "recorded"
            if seed == 0:
                return f"I pulled up your classroom attendance log. You currently have an attendance rate of **{rate_str}** across your recent sessions.\n\nWould you like me to display the specific session dates or check your Goethe certificate eligibility?"
            else:
                return f"According to your class register regarding '{q_clean}', your overall attendance is standing at **{rate_str}**.\n\nShall I open your full attendance tracking history?"

        if intent == "CERTIFICATES" or "Verified Credentials" in tool_data:
            return f"I have verified your academic file for '{q_clean}'.\n\n{tool_data}\n\nWould you like me to generate an official downloadable copy of your certificate or exam transcript?"

        if intent == "TIMETABLE" or intent == "ODEL" or "Live Zoom" in tool_data or "Instructor Schedule" in tool_data:
            return f"Regarding your schedule inquiry ('{q_clean}'):\n\n{tool_data}\n\nWould you like me to open the live virtual classroom portal for you right now?"

        if intent == "ADMISSIONS" or "Admissions Queue" in tool_data:
            return f"Here is the latest update regarding admissions ('{q_clean}'):\n\n{tool_data}\n\nShall I navigate you to the admissions review queue?"

        # General / Knowledge search synthesis
        clean_info = "\n".join([line for line in tool_data.split("\n") if line.strip()][:4])
        if clean_info:
            if seed == 0:
                return f"Regarding '{q_clean}', here is what our institutional guidelines indicate:\n\n{clean_info}\n\nDo you need any further clarification on these policies?"
            else:
                return f"I looked into your request ('{q_clean}').\n\n{clean_info}\n\nWould you like me to connect you with an academic counselor or department advisor?"

        # German Language / General Conversation
        if seed == 0:
            return f"I would be delighted to help you with '{q_clean}'! Whether you are practicing noun genders (Der/Die/Das), sentence structures, or CEFR exam modules, consistent practice is key.\n\nWhich specific Goethe CEFR level (A1 to C2) are you currently preparing for?"
        elif seed == 1:
            return f"Thank you for reaching out regarding '{q_clean}'. As your Horizon assistant, I can explain German grammar rules, translate vocabulary, or check your student records.\n\nHow else can I assist your learning today?"
        else:
            return f"I'm here to support your German studies and answer any institutional questions about '{q_clean}'.\n\nWould you like to practice a grammar exercise or review past exam papers?"


class AIGateway:
    """
    Enterprise AI Gateway enforcing strict provider cascade:
    OpenAI GPT -> Hugging Face LLM -> Local Conversational Fallback Synthesis.
    """

    @classmethod
    def execute(cls, system_prompt: str, user_packet: str, question: str, tool_data: str, user, role: str, intent: str, config) -> tuple[str, str, str, int]:
        tokens_approx = int(len(system_prompt + user_packet) / 4)
        fallback_reasons = []

        # 1. STRICT PRIORITY 1: Attempt OpenAI GPT first whenever API key exists
        if config.openai_api_key or config.provider == "OPENAI":
            provider = OpenAIProvider(api_key=config.openai_api_key, model_name="gpt-4o-mini" if config.provider != "OPENAI" else config.model_name)
            try:
                reply = provider.generate(
                    system_prompt=system_prompt,
                    user_prompt=user_packet,
                    context="", # Context is already embedded in user_packet
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
                if reply:
                    return reply, "OPENAI", "", tokens_approx
            except Exception as e:
                msg = f"OpenAI unavailable ({str(e)[:90]})"
                logger.warning(msg)
                fallback_reasons.append(msg)

        # 2. STRICT PRIORITY 2: Attempt Hugging Face LLM if OpenAI fails
        if config.huggingface_api_key or config.provider == "HUGGINGFACE" or fallback_reasons:
            provider = HuggingFaceProvider(api_key=config.huggingface_api_key, model_name=config.model_name if config.provider == "HUGGINGFACE" else "mistralai/Mistral-7B-Instruct-v0.3")
            try:
                reply = provider.generate(
                    system_prompt=system_prompt,
                    user_prompt=user_packet,
                    context="",
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
                if reply:
                    reason = "; ".join(fallback_reasons) if fallback_reasons else ""
                    return reply, "HUGGINGFACE", reason, tokens_approx
            except Exception as e:
                msg = f"HuggingFace unavailable ({str(e)[:90]})"
                logger.warning(msg)
                fallback_reasons.append(msg)

        # 3. STRICT PRIORITY 3: Fallback Synthesis only if both external APIs fail
        reply = IntelligentSynthesisEngine.synthesize(question, tool_data, user, role, intent)
        reason = "; ".join(fallback_reasons) if fallback_reasons else "External APIs unavailable (Fallback Synthesis activated)"
        return reply, "LOCAL_SYNTHESIS", reason, tokens_approx
