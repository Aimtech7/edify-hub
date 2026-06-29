from django.db.models import Q
from django.contrib.auth import get_user_model
from ..models import PrivateMessage, Announcement, UserCommunicationProfile
from dms.models import DocumentMetadata

User = get_user_model()

class SearchService:
    @classmethod
    def search_users(cls, query=""):
        q = query.strip()
        users = User.objects.filter(is_active=True).select_related('student_profile', 'employee_record')

        if q:
            users = users.filter(
                Q(username__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(email__icontains=q) |
                Q(role__icontains=q) |
                Q(student_profile__admission_number__icontains=q) |
                Q(student_profile__phone__icontains=q) |
                Q(employee_record__employee_id__icontains=q) |
                Q(employee_record__department__icontains=q) |
                Q(employee_record__designation__icontains=q)
            ).distinct()

        results = []
        for u in users[:50]:
            name = f"{u.first_name} {u.last_name}".strip() or u.username
            subtitle = u.role
            identifier = ""

            if hasattr(u, 'student_profile') and u.student_profile:
                identifier = f"Adm: {u.student_profile.admission_number}"
                if u.student_profile.current_level:
                    subtitle += f" • {u.student_profile.current_level}"
            elif hasattr(u, 'employee_record') and u.employee_record:
                identifier = f"Emp: {u.employee_record.employee_id} ({u.employee_record.get_department_display()})"

            # Check presence
            presence = "ONLINE"
            try:
                presence = u.comm_profile.presence_status
            except UserCommunicationProfile.DoesNotExist:
                pass

            results.append({
                'id': u.pk,
                'username': u.username,
                'name': name,
                'role': u.role,
                'subtitle': subtitle,
                'identifier': identifier,
                'presence': presence,
                'email': u.email or ""
            })
        return results

    @classmethod
    def global_search(cls, user, query="", category="ALL"):
        q = query.strip()
        if not q:
            return {'users': [], 'messages': [], 'announcements': [], 'documents': []}

        output = {'users': [], 'messages': [], 'announcements': [], 'documents': []}

        if category in ["ALL", "USERS"]:
            output['users'] = cls.search_users(q)[:10]

        if category in ["ALL", "MESSAGES"]:
            # Only search messages in conversations the user is a participant of
            msgs = PrivateMessage.objects.filter(
                conversation__participants=user,
                is_deleted=False,
                content__icontains=q
            ).select_related('sender', 'conversation')[:20]
            
            output['messages'] = [{
                'id': m.pk,
                'conversation_id': m.conversation_id,
                'conversation_subject': m.conversation.subject or str(m.conversation.type),
                'sender': m.sender.username,
                'content': m.content[:200],
                'created_at': m.created_at.isoformat()
            } for m in msgs]

        if category in ["ALL", "ANNOUNCEMENTS"]:
            anns = Announcement.objects.filter(
                Q(title__icontains=q) | Q(content__icontains=q)
            )[:15]
            output['announcements'] = [{
                'id': a.pk,
                'title': a.title,
                'priority': a.priority,
                'created_at': a.created_at.isoformat()
            } for a in anns]

        if category in ["ALL", "DOCUMENTS"]:
            docs = DocumentMetadata.objects.filter(
                Q(title__icontains=q) | Q(description__icontains=q) | Q(keywords__icontains=q)
            )[:15]
            output['documents'] = [{
                'id': d.pk,
                'title': d.title,
                'category': d.category,
                'file_type': d.file_type,
                'url': d.file.url if d.file else d.external_link
            } for d in docs]

        return output
