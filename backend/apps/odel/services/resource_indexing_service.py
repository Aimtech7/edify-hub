import logging
from django.db import transaction
from ai_assistant.models import KnowledgeDocument
from odel.models import Lesson, Resource

logger = logging.getLogger(__name__)

class ResourceIndexingService:
    """
    Service to automatically index ODEL Lessons and uploaded Resources into the
    Horizon AI Assistant Knowledge Base (KnowledgeDocument) with RBAC context.
    """

    @classmethod
    def index_lesson(cls, lesson: Lesson) -> KnowledgeDocument:
        """
        Indexes or updates a lesson's textual content into KnowledgeDocument.
        """
        doc_title = f"[Lesson {lesson.module.course.code} L{lesson.order}] {lesson.title}"
        
        # Build text content with objectives and description
        content_parts = [
            f"Course: {lesson.module.course.code} - {lesson.module.course.title}",
            f"Module: {lesson.module.title}",
            f"Lesson Title: {lesson.title}",
            f"Objectives: {lesson.objectives}",
            f"Description: {lesson.description}",
            f"Content Body: {lesson.body_html}",
        ]
        if lesson.code_snippet:
            content_parts.append(f"Code Snippet:\n{lesson.code_snippet}")
            
        full_content = "\n\n".join([p for p in content_parts if p.strip()])

        with transaction.atomic():
            doc, created = KnowledgeDocument.objects.update_or_create(
                title=doc_title,
                defaults={
                    "category": KnowledgeDocument.Category.COURSE_NOTE,
                    "content": full_content,
                    "is_active": lesson.is_published and lesson.status == 'PUBLISHED'
                }
            )
            logger.info(f"Indexed lesson L{lesson.id} into KnowledgeDocument ID {doc.id} (created={created})")
            return doc

    @classmethod
    def index_resource(cls, resource: Resource) -> KnowledgeDocument:
        """
        Indexes metadata and available text of a lesson resource into KnowledgeDocument.
        """
        lesson = resource.lesson
        doc_title = f"[Resource {lesson.module.course.code}] {resource.title}"
        
        content_parts = [
            f"Resource Title: {resource.title}",
            f"Course: {lesson.module.course.code} - {lesson.module.course.title}",
            f"Associated Lesson: {lesson.title}",
            f"File Type: {resource.file_type.upper() if resource.file_type else 'Document'}",
            f"Downloadable: {'Yes' if resource.is_downloadable else 'No'}",
            f"External URL: {resource.external_url if resource.external_url else 'None'}"
        ]
        full_content = "\n\n".join(content_parts)

        with transaction.atomic():
            doc, created = KnowledgeDocument.objects.update_or_create(
                title=doc_title,
                defaults={
                    "category": KnowledgeDocument.Category.COURSE_NOTE,
                    "content": full_content,
                    "is_active": True
                }
            )
            logger.info(f"Indexed resource R{resource.id} into KnowledgeDocument ID {doc.id} (created={created})")
            return doc

    @classmethod
    def unindex_lesson(cls, lesson: Lesson):
        """
        Deactivates KnowledgeDocument when lesson is unpublished or archived.
        """
        doc_title = f"[Lesson {lesson.module.course.code} L{lesson.order}] {lesson.title}"
        KnowledgeDocument.objects.filter(title=doc_title).update(is_active=False)
