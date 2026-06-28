import os
import logging
import urllib.request
import json

logger = logging.getLogger(__name__)

class WhatsAppService:
    """
    Service for dispatching WhatsApp notifications via Meta WhatsApp Cloud API or Twilio.
    Falls back to structured audit logging when live tokens are unconfigured.
    """
    @staticmethod
    def send_message(phone_number: str, message: str, template_name: str = None) -> bool:
        if not phone_number:
            logger.warning("WhatsApp dispatch aborted: No phone number provided.")
            return False

        # Clean phone number (e.g., format +254...)
        clean_phone = phone_number.replace(" ", "").replace("-", "")
        if clean_phone.startswith("07") or clean_phone.startswith("01"):
            clean_phone = "+254" + clean_phone[1:]

        token = os.environ.get("WHATSAPP_API_TOKEN")
        phone_id = os.environ.get("WHATSAPP_PHONE_ID")

        if token and phone_id:
            try:
                url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "messaging_product": "whatsapp",
                    "to": clean_phone,
                    "type": "text",
                    "text": {"body": message}
                }
                req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status in [200, 201]:
                        logger.info(f"[WHATSAPP LIVE] Sent successfully to {clean_phone}")
                        return True
            except Exception as e:
                logger.error(f"[WHATSAPP ERROR] Failed dispatch to {clean_phone}: {e}")
                return False
        else:
            # Audit Simulation mode
            logger.info(f"[WHATSAPP SIMULATION] Dispatch to {clean_phone}: '{message}' (Template: {template_name or 'Standard'})")
            print(f"\n[📱 WHATSAPP DISPATCH] -> {clean_phone}\nMessage: {message}\n")
            return True
