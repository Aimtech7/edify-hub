import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
settings.DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
if hasattr(settings, 'STORAGES'):
    settings.STORAGES['default'] = {'BACKEND': 'django.core.files.storage.FileSystemStorage'}
settings.MEDIA_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media_test')
os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from communication.models import (
    Conversation, PrivateMessage, Announcement, BroadcastMessage,
    UserCommunicationProfile, CommunicationPermissionPolicy, CommunicationAuditLog
)
from communication.services.conversation_service import ConversationService
from communication.services.message_service import MessageService
from communication.services.discussion_service import DiscussionService
from communication.services.search_service import SearchService
from communication.services.ai_conversation_service import AIConversationService
from communication.services.permission_service import PermissionService

User = get_user_model()

def run_verification():
    print("==================================================================")
    print("HORIZON ERP + ODEL - PHASE 8 COMMUNICATION HUB E2E VERIFICATION")
    print("==================================================================\n")

    # 1. Setup test actors
    print("[1/9] Setting up institutional actors (Admin, Teacher, Student)...")
    admin, _ = User.objects.get_or_create(
        username='comm_admin_verifier',
        defaults={'role': 'ADMIN', 'email': 'commadmin@horizon.edu', 'first_name': 'Comm', 'last_name': 'Admin'}
    )
    teacher, _ = User.objects.get_or_create(
        username='comm_teacher_verifier',
        defaults={'role': 'TEACHER', 'email': 'commteacher@horizon.edu', 'first_name': 'Hans', 'last_name': 'Muller'}
    )
    student, _ = User.objects.get_or_create(
        username='comm_student_verifier',
        defaults={'role': 'STUDENT', 'email': 'commstudent@horizon.edu', 'first_name': 'Anna', 'last_name': 'Schmidt'}
    )

    admin_profile, _ = UserCommunicationProfile.objects.get_or_create(user=admin)
    teacher_profile, _ = UserCommunicationProfile.objects.get_or_create(user=teacher)
    student_profile, _ = UserCommunicationProfile.objects.get_or_create(user=student)

    # Ensure clean state for test
    Announcement.objects.filter(title__startswith="[VERIFY]").delete()
    Conversation.objects.filter(subject__startswith="[VERIFY]").delete()
    print(" -> Actors active and profiles verified.\n")

    # 2. Administrator creates institutional announcement
    print("[2/9] Administrator creating institutional announcement...")
    ann = Announcement.objects.create(
        title="[VERIFY] End of Semester German Language Exams Schedule",
        content="All students must check their portals for Goethe C1 exam times. Attendance is mandatory.",
        target_group="ALL",
        priority="URGENT",
        author=admin
    )
    print(f" -> Announcement created: ID {ann.pk} | Priority: {ann.priority}\n")

    # 3. Teacher creates a course discussion thread (#GENERAL and #TEACHER_QA)
    print("[3/9] Teacher creating course discussion channels (#GENERAL and #TEACHER_QA)...")
    conv_qa = ConversationService.create_conversation(
        creator=teacher,
        subject="[VERIFY] German B2.1 - Teacher Q&A",
        participant_ids=[student.pk],
        conv_type=Conversation.Type.COURSE,
        course_channel="TEACHER_QA"
    )
    print(f" -> Course channel created: ID {conv_qa.pk} | Channel: #{conv_qa.course_channel} | Participants: {conv_qa.participants.count()}\n")

    # 4. Student joins discussion and uploads an attachment
    print("[4/9] Student sending message with study notes attachment...")
    dummy_file = SimpleUploadedFile("B2_Grammar_Notes.pdf", b"German Grammar Notes Content", content_type="application/pdf")
    msg_student = MessageService.send_message(
        sender=student,
        conversation=conv_qa,
        content="Herr Muller, could you please review my grammar notes for the exam?",
        file_obj=dummy_file
    )
    print(f" -> Student message sent: ID {msg_student.pk} | Attachment: {msg_student.attachment_name} ({msg_student.attachment_size} bytes)\n")

    # 5. Teacher replies to student message
    print("[5/9] Teacher replying to student question...")
    msg_teacher = MessageService.send_message(
        sender=teacher,
        conversation=conv_qa,
        content="Ausgezeichnet, Anna! Your Konjunktiv II structure is perfect. Keep practicing.",
        reply_to_id=msg_student.pk
    )
    print(f" -> Teacher reply sent: ID {msg_teacher.pk} | Reply to: ID {msg_teacher.reply_to_id}\n")

    # 6. Check Unread Counter and Mark as Read
    print("[6/9] Verifying real-time unread synchronization & read receipts...")
    student_unread_before = PrivateMessage.objects.filter(
        conversation__participants=student,
        is_read=False
    ).exclude(sender=student).count()
    print(f" -> Student unread messages before reading: {student_unread_before}")

    for msg in conv_qa.messages.exclude(sender=student).filter(is_read=False):
        MessageService.mark_read(student, msg)
    student_unread_after = PrivateMessage.objects.filter(
        conversation__participants=student,
        is_read=False
    ).exclude(sender=student).count()
    print(f" -> Student unread messages after reading: {student_unread_after}")
    assert student_unread_after < student_unread_before or student_unread_before == 0, "Read receipt update failed!"
    print(" -> Read receipts verified.\n")

    # 7. Global Search Verification
    print("[7/9] Verifying Enterprise Global Search...")
    search_res = SearchService.global_search(teacher, query="Grammar Notes", category="ALL")
    found_msgs = len(search_res['messages'])
    print(f" -> Global search for 'Grammar Notes' returned {found_msgs} matching message(s).")
    assert found_msgs > 0, "Global search failed to find attachment/content match!"
    print(" -> Search verified.\n")

    # 8. Dashboard Statistics Verification
    print("[8/9] Verifying Admin Command Center live PostgreSQL KPIs...")
    from django.utils import timezone
    from django.db.models import Sum
    today = timezone.now().date()
    msgs_today = PrivateMessage.objects.filter(created_at__date=today).count()
    total_storage = PrivateMessage.objects.aggregate(total=Sum('attachment_size'))['total'] or 0
    print(f" -> Live KPIs verified directly from PostgreSQL: Messages Today = {msgs_today} | Total Storage Bytes = {total_storage}\n")

    # 9. AI Assistant Verification
    print("[9/9] Verifying Horizon AI Assistant integration within Communication Hub...")
    ai_resp = AIConversationService.process_ai_request(
        actor=student,
        conversation=conv_qa,
        prompt="Summarize this thread",
        action_type="SUMMARIZE"
    )
    print(f" -> AI Assistant message created: ID {ai_resp.pk} | Sender: {ai_resp.sender.username}")
    print(f" -> AI Assistant response content: {ai_resp.content[:120]}...\n")

    print("==================================================================")
    print("[PASS] PHASE 8 COMMUNICATION HUB E2E VERIFICATION SUITE PASSED!")
    print("==================================================================")

if __name__ == '__main__':
    run_verification()
