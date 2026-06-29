from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from ..models import CommunicationPermissionPolicy

User = get_user_model()

class PermissionService:
    DEFAULT_MATRIX = {
        'STUDENT': ['TEACHER', 'TUTOR', 'ADMISSIONS', 'FINANCE', 'ACCOUNTANT', 'ICT', 'ADMIN', 'STAFF'],
        'PARENT': ['TEACHER', 'TUTOR', 'FINANCE', 'ACCOUNTANT', 'ADMISSIONS', 'ADMIN', 'STAFF'],
        'TEACHER': ['STUDENT', 'PARENT', 'TEACHER', 'TUTOR', 'REGISTRAR', 'ADMIN', 'HR', 'LIBRARY', 'STAFF'],
        'TUTOR': ['STUDENT', 'PARENT', 'TEACHER', 'TUTOR', 'REGISTRAR', 'ADMIN', 'STAFF'],
        'FINANCE': ['STUDENT', 'PARENT', 'ADMIN', 'ACCOUNTANT', 'REGISTRAR', 'STAFF'],
        'ACCOUNTANT': ['STUDENT', 'PARENT', 'ADMIN', 'FINANCE', 'REGISTRAR', 'STAFF'],
        'ADMISSIONS': ['STUDENT', 'PARENT', 'REGISTRAR', 'ADMIN', 'STAFF'],
        'HR': ['TEACHER', 'TUTOR', 'REGISTRAR', 'FINANCE', 'ACCOUNTANT', 'ADMISSIONS', 'ICT', 'LIBRARY', 'ADMIN', 'STAFF'],
        'ICT': ['STUDENT', 'TEACHER', 'TUTOR', 'REGISTRAR', 'FINANCE', 'ACCOUNTANT', 'ADMISSIONS', 'HR', 'LIBRARY', 'ADMIN', 'STAFF'],
        'LIBRARY': ['STUDENT', 'TEACHER', 'TUTOR', 'ADMIN', 'STAFF'],
        'REGISTRAR': ['STUDENT', 'PARENT', 'TEACHER', 'TUTOR', 'FINANCE', 'ACCOUNTANT', 'ADMISSIONS', 'ADMIN', 'STAFF'],
        'STAFF': ['STUDENT', 'PARENT', 'TEACHER', 'TUTOR', 'REGISTRAR', 'ACCOUNTANT', 'FINANCE', 'ADMISSIONS', 'HR', 'LIBRARY', 'ICT', 'ADMIN', 'STAFF'],
        'ADMIN': ['STUDENT', 'PARENT', 'TEACHER', 'TUTOR', 'REGISTRAR', 'ACCOUNTANT', 'FINANCE', 'ADMISSIONS', 'HR', 'LIBRARY', 'ICT', 'ADMIN', 'STAFF']
    }

    @classmethod
    def can_message(cls, sender, target_user):
        if not sender or not target_user:
            raise ValidationError("Sender and target user must be specified.")
        
        if sender.pk == target_user.pk:
            raise ValidationError("You cannot initiate a direct conversation with yourself.")

        if sender.role == 'ADMIN' or target_user.role == 'ADMIN':
            return True

        # Check configurable database policy first
        policy = CommunicationPermissionPolicy.objects.filter(
            sender_role=sender.role,
            target_role=target_user.role
        ).first()

        if policy is not None:
            if not policy.is_allowed:
                raise ValidationError(f"Institutional policy blocks direct messaging from {sender.role} to {target_user.role}.")
            return True

        # Fallback to default enterprise matrix
        allowed_targets = cls.DEFAULT_MATRIX.get(sender.role, [])
        if target_user.role not in allowed_targets:
            raise ValidationError(f"Your role ({sender.role}) does not have permission to message {target_user.role} directly.")
        
        return True

    @classmethod
    def validate_participant_list(cls, sender, participant_ids):
        if not participant_ids or not isinstance(participant_ids, (list, tuple)):
            raise ValidationError({"participants": ["At least one valid participant must be provided."]})

        unique_ids = set()
        resolved_users = []

        for pid in participant_ids:
            try:
                if isinstance(pid, int) or (isinstance(pid, str) and str(pid).isdigit()):
                    user = User.objects.get(pk=int(pid))
                else:
                    user = User.objects.get(username__iexact=str(pid).strip())
            except User.DoesNotExist:
                raise ValidationError({"participants": [f"User with identifier '{pid}' does not exist."]})

            if user.pk == sender.pk:
                raise ValidationError({"participants": ["Cannot add yourself as a target participant."]})

            if user.pk in unique_ids:
                raise ValidationError({"participants": [f"Duplicate participant detected: {user.username}."]})

            unique_ids.add(user.pk)
            cls.can_message(sender, user)
            resolved_users.append(user)

        return resolved_users
