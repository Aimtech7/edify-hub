import os
from rest_framework.exceptions import ValidationError
from django.core.files.storage import default_storage
from .audit_service import AuditService

class AttachmentService:
    MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit

    ALLOWED_EXTENSIONS = {
        '.pdf': 'PDF Document',
        '.doc': 'Word Document', '.docx': 'Word Document',
        '.ppt': 'PowerPoint Presentation', '.pptx': 'PowerPoint Presentation',
        '.xls': 'Excel Spreadsheet', '.xlsx': 'Excel Spreadsheet',
        '.zip': 'ZIP Archive', '.rar': 'RAR Archive', '.7z': '7z Archive',
        '.jpg': 'Image', '.jpeg': 'Image', '.png': 'Image', '.gif': 'Image', '.webp': 'Image',
        '.mp3': 'Audio / Voice Note', '.wav': 'Audio / Voice Note', '.ogg': 'Audio / Voice Note', '.m4a': 'Audio / Voice Note',
        '.mp4': 'Video File', '.mov': 'Video File', '.webm': 'Video File'
    }

    @classmethod
    def validate_attachment(cls, file_obj):
        if not file_obj:
            return None, "", 0, ""
        
        if file_obj.size > cls.MAX_SIZE_BYTES:
            raise ValidationError(f"File size ({file_obj.size / (1024*1024):.1f} MB) exceeds maximum allowed size of 50 MB.")

        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise ValidationError(f"File format '{ext}' is not supported for security reasons.")

        file_type = cls.ALLOWED_EXTENSIONS[ext]
        return file_obj, file_obj.name, file_obj.size, file_type

    @classmethod
    def save_attachment(cls, message, file_obj, uploader):
        _, name, size, ftype = cls.validate_attachment(file_obj)
        if not file_obj:
            return

        message.attachment = file_obj
        message.attachment_name = name[:255]
        message.attachment_size = size
        message.attachment_type = ftype[:100]
        message.save(update_fields=['attachment', 'attachment_name', 'attachment_size', 'attachment_type'])

        AuditService.log_attachment_uploaded(uploader, message, name)
