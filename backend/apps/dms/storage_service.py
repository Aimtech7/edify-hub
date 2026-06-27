import os
import io
from django.core.files.storage import default_storage
from dms.models import DocumentMetadata, DocumentVersion, DMSAuditLog
from notifications.models import Notification

class StorageService:
    @classmethod
    def upload_file(cls, file_obj, category, uploaded_by, title="", description="", tags="", keywords="", course="", lesson="", level="", visibility="PUBLIC", external_link=""):
        """
        Centralized Storage Gateway for Horizon ERP & ODEL.
        Handles folder routing, Supabase S3 storage persistence, metadata creation, AI indexing, audit logging, and notifications.
        """
        # Determine file type & size
        file_size = file_obj.size if file_obj else 0
        filename = file_obj.name if file_obj else "external_link"
        ext = os.path.splitext(filename)[1].lower() if file_obj else ".link"

        file_type = DocumentMetadata.FileType.LINK
        if ext in ['.pdf']: file_type = DocumentMetadata.FileType.PDF
        elif ext in ['.ppt', '.pptx']: file_type = DocumentMetadata.FileType.PPT
        elif ext in ['.doc', '.docx']: file_type = DocumentMetadata.FileType.WORD
        elif ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']: file_type = DocumentMetadata.FileType.IMAGE
        elif ext in ['.mp3', '.wav', '.ogg', '.m4a']: file_type = DocumentMetadata.FileType.AUDIO
        elif ext in ['.mp4', '.mov', '.avi', '.webm', '.mkv']: file_type = DocumentMetadata.FileType.VIDEO
        elif ext in ['.zip', '.rar', '.7z', '.tar', '.gz']: file_type = DocumentMetadata.FileType.ZIP

        # Organize into requested Supabase bucket folders
        folder_path = f"{category}/{filename}"

        # Save file to storage
        saved_file = None
        if file_obj:
            saved_path = default_storage.save(folder_path, file_obj)
            saved_file = saved_path

        # Create Metadata
        doc_title = title or filename
        doc = DocumentMetadata.objects.create(
            title=doc_title,
            description=description,
            category=category,
            folder_path=folder_path,
            file=saved_file,
            file_type=file_type,
            file_size=file_size,
            external_link=external_link,
            tags=tags,
            keywords=keywords,
            course=course,
            lesson=lesson,
            level=level,
            uploaded_by=uploaded_by,
            visibility=visibility
        )

        # Create Version 1 History
        DocumentVersion.objects.create(
            document=doc,
            version_number=1,
            file=saved_file,
            uploaded_by=uploaded_by,
            change_summary="Initial upload via StorageService"
        )

        # Trigger AI Background Indexing (Extract plain text)
        extracted = cls._extract_and_index_ai(doc, file_obj)
        if extracted:
            doc.extracted_text = extracted
            doc.ai_indexed = True
            doc.save(update_fields=['extracted_text', 'ai_indexed'])

            # Sync with AI Knowledge Base
            from ai_assistant.models import KnowledgeDocument
            KnowledgeDocument.objects.create(
                title=f"[{category}] {doc_title}",
                category="POLICY" if "policy" in category else "COURSE_NOTE" if "lesson" in category else "GENERAL",
                content=f"Title: {doc_title}\nDescription: {description}\nCourse: {course}\nLevel: {level}\nTags: {tags}\nExtracted Text:\n{extracted[:2500]}"
            )

        # Audit Log
        DMSAuditLog.objects.create(
            action=DMSAuditLog.Action.UPLOAD,
            document=doc,
            user=uploaded_by,
            details=f"Uploaded '{doc_title}' ({file_size} bytes) to category '{category}'"
        )

        # Send Notifications for key uploads
        if category in ['lesson-resources', 'assignments', 'institution-policies', 'student-handbook', 'announcements']:
            msg = f"New document published: {doc_title} ({category})"
            Notification.objects.create(
                recipient=uploaded_by if uploaded_by else None, # In broadcast scenario this notifies system cohorts
                title="New Document Available",
                message=msg,
                notification_type="SYSTEM"
            )

        return doc

    @staticmethod
    def _extract_and_index_ai(doc, file_obj) -> str:
        """Extracts text for RAG indexing."""
        text_content = f"{doc.title} {doc.description} {doc.keywords} {doc.tags}"
        if not file_obj:
            return text_content

        try:
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext in ['.txt', '.csv', '.md']:
                file_obj.seek(0)
                text_content += "\n" + file_obj.read().decode('utf-8', errors='ignore')[:3000]
        except Exception:
            pass
        return text_content
