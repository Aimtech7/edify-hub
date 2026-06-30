import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)

# Connect signals non-intrusively
try:
    from finance.models import Payment
    @receiver(post_save, sender=Payment)
    def emit_payment_received(sender, instance, created, **kwargs):
        if created:
            try:
                from workflows.engine.event_bus import EventBus
                payload = {
                    "payment_id": instance.id,
                    "amount": float(instance.amount),
                    "receipt_number": instance.receipt_number,
                    "student_id": instance.student.id if instance.student else None,
                    "phone": instance.phone_number
                }
                EventBus.emit_event("Payment Received", payload, initiator="System (Signal)")
            except Exception as e:
                logger.error(f"[WorkflowSignal] Error emitting Payment Received: {e}")
except ImportError:
    pass

try:
    from students.models import Student
    @receiver(post_save, sender=Student)
    def emit_student_registered(sender, instance, created, **kwargs):
        if created:
            try:
                from workflows.engine.event_bus import EventBus
                payload = {
                    "student_id": instance.id,
                    "admission_number": instance.admission_number,
                    "first_name": instance.first_name,
                    "last_name": instance.last_name,
                    "email": instance.user.email if instance.user else ""
                }
                EventBus.emit_event("Student Registered", payload, initiator="System (Signal)")
            except Exception as e:
                logger.error(f"[WorkflowSignal] Error emitting Student Registered: {e}")
except ImportError:
    pass

try:
    from core.models import SupportTicket
    @receiver(post_save, sender=SupportTicket)
    def emit_ticket_opened(sender, instance, created, **kwargs):
        if created:
            try:
                from workflows.engine.event_bus import EventBus
                payload = {
                    "ticket_id": instance.id,
                    "subject": instance.subject,
                    "category": instance.category,
                    "status": instance.status,
                    "student_id": instance.student.id if instance.student else None
                }
                EventBus.emit_event("Support Ticket Opened", payload, initiator="System (Signal)")
            except Exception as e:
                logger.error(f"[WorkflowSignal] Error emitting Support Ticket Opened: {e}")
except ImportError:
    pass
