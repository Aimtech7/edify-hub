from django.db.models.signals import post_save
from django.dispatch import receiver
from odel.models import Course
from academics.models import VirtualClass, Cohort
from communication.services import DiscussionService
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=Course)
def auto_create_course_discussions(sender, instance, created, **kwargs):
    if created:
        admin_user = User.objects.filter(role='ADMIN').first()
        if not admin_user and instance.instructor:
            admin_user = instance.instructor
            
        convs = DiscussionService.initialize_course_discussions(
            course_id=instance.pk,
            course_name=instance.code or instance.title,
            admin_user=admin_user
        )
        if instance.instructor:
            DiscussionService.sync_user_to_course(instance.instructor, instance.pk)


@receiver(post_save, sender=VirtualClass)
def auto_create_virtual_class_discussion(sender, instance, created, **kwargs):
    if created:
        from communication.models import Conversation
        conv, _ = Conversation.objects.get_or_create(
            type=Conversation.Type.COURSE,
            entity_id=str(instance.pk),
            entity_type='VIRTUAL_CLASS',
            defaults={
                'subject': f"Class: {instance.cohort.name} - {instance.date}",
                'created_by': instance.teacher
            }
        )
        conv.participants.add(instance.teacher)


@receiver(post_save, sender=Cohort)
def auto_create_cohort_discussion(sender, instance, created, **kwargs):
    if created:
        from communication.models import Conversation
        admin_user = User.objects.filter(role='ADMIN').first()
        conv, _ = Conversation.objects.get_or_create(
            type=Conversation.Type.GROUP,
            entity_id=str(instance.pk),
            entity_type='COHORT',
            defaults={
                'subject': f"Cohort: {instance.name}",
                'created_by': admin_user
            }
        )
        if admin_user:
            conv.participants.add(admin_user)
