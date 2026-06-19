import logging
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_in_app_notification(user, title, message):
        """Creates an in-app notification for the user."""
        return Notification.objects.create(
            user=user,
            title=title,
            message=message
        )

    @staticmethod
    def send_email_notification(user, subject, message):
        """Sends an email notification."""
        if not user.email:
            logger.warning(f"User {user.username} has no email address. Cannot send email.")
            return False
            
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'info@horizondti.com'),
                recipient_list=[user.email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_sms_notification(phone_number, message):
        """
        Sends an SMS notification via Africa's Talking (or equivalent provider).
        Mocked for development unless credentials exist.
        """
        if not phone_number:
            return False
            
        # In a real implementation, you would use africastalking package:
        # import africastalking
        # africastalking.initialize(username, api_key)
        # sms = africastalking.SMS
        # sms.send(message, [phone_number])
        
        logger.info(f"Mock SMS sent to {phone_number}: {message}")
        return True

    @staticmethod
    def notify_user(user, title, message, send_email=False, send_sms=False, phone_number=None):
        """
        Main orchestration function to notify a user via selected channels.
        """
        # Always send in-app
        NotificationService.send_in_app_notification(user, title, message)
        
        if send_email:
            NotificationService.send_email_notification(user, title, message)
            
        if send_sms and phone_number:
            NotificationService.send_sms_notification(phone_number, message)
