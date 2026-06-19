import threading
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from finance.models import Payment, Allocation, Receipt
from results.models import Result
from certificates.models import Certificate
from students.models import Student
from academics.models import PromotionHistory
from audits.models import log_action

# Note: In a real system, you'd use a middleware to capture the current request/user
# For this implementation, signals will record action without a user if triggered outside a request context.

@receiver(post_save, sender=Payment)
def payment_saved(sender, instance, created, **kwargs):
    action = "PAYMENT_CREATED" if created else "PAYMENT_UPDATED"
    if instance.status == Payment.Status.CANCELLED:
        action = "PAYMENT_CANCELLED"
    log_action(None, action, entity="Payment", entity_id=instance.id)

@receiver(post_save, sender=Allocation)
def allocation_saved(sender, instance, created, **kwargs):
    action = "ALLOCATION_CREATED" if created else "ALLOCATION_UPDATED"
    log_action(None, action, entity="Allocation", entity_id=instance.id)

@receiver(post_save, sender=Receipt)
def receipt_saved(sender, instance, created, **kwargs):
    action = "RECEIPT_GENERATED" if created else "RECEIPT_UPDATED"
    if instance.status == Receipt.Status.VOID:
        action = "RECEIPT_VOIDED"
    log_action(None, action, entity="Receipt", entity_id=instance.id)

@receiver(post_save, sender=Result)
def result_saved(sender, instance, created, **kwargs):
    action = "RESULT_CREATED" if created else "RESULT_UPDATED"
    log_action(None, action, entity="Result", entity_id=instance.id)

@receiver(post_save, sender=Certificate)
def certificate_saved(sender, instance, created, **kwargs):
    if created:
        log_action(None, "CERTIFICATE_ISSUED", entity="Certificate", entity_id=instance.id)

@receiver(post_save, sender=Student)
def student_saved(sender, instance, created, **kwargs):
    action = "STUDENT_CREATED" if created else "STUDENT_UPDATED"
    log_action(None, action, entity="Student", entity_id=instance.id)

@receiver(post_save, sender=PromotionHistory)
def promotion_saved(sender, instance, created, **kwargs):
    if created:
        log_action(None, "STUDENT_PROMOTED", entity="PromotionHistory", entity_id=instance.id)
