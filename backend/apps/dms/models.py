from django.db import models
from django.conf import settings

class DocumentMetadata(models.Model):
    class Category(models.TextChoices):
        LESSON_RESOURCES = "lesson-resources", "Lesson Resources"
        KNOWLEDGE_BASE = "knowledge-base", "Knowledge Base"
        ASSIGNMENTS = "assignments", "Assignments"
        ASSIGNMENT_SUBMISSIONS = "assignment-submissions", "Assignment Submissions"
        STUDENT_DOCUMENTS = "student-documents", "Student Documents"
        STAFF_DOCUMENTS = "staff-documents", "Staff Documents"
        INSTITUTION_POLICIES = "institution-policies", "Institution Policies"
        STUDENT_HANDBOOK = "student-handbook", "Student Handbook"
        STAFF_HANDBOOK = "staff-handbook", "Staff Handbook"
        BLOGS = "blogs", "Blogs"
        NEWS = "news", "News"
        ANNOUNCEMENTS = "announcements", "Announcements"
        DOWNLOADS = "downloads", "Downloads"
        CERTIFICATES = "certificates", "Certificates"
        RECEIPTS = "receipts", "Receipts"
        STUDENT_IDS = "student-ids", "Student IDs"
        EXAM_CARDS = "exam-cards", "Exam Cards"
        TRANSCRIPTS = "transcripts", "Transcripts"
        GALLERY = "gallery", "Gallery"
        SYSTEM_ASSETS = "system-assets", "System Assets"
        # Additional KB topics
        GERMANY_INFO = "germany-info", "Germany Information"
        VISA_INFO = "visa-info", "Visa Information"
        AUSBILDUNG = "ausbildung", "Ausbildung"
        AU_PAIR = "au-pair", "Au Pair"
        FAQS = "faqs", "FAQs"
        ACADEMIC_CALENDAR = "academic-calendar", "Academic Calendar"

    class FileType(models.TextChoices):
        PDF = "PDF", "PDF Document"
        PPT = "PPT", "PowerPoint Presentation"
        WORD = "WORD", "Word Document"
        IMAGE = "IMAGE", "Image File"
        AUDIO = "AUDIO", "Audio Recording"
        VIDEO = "VIDEO", "Video Recording"
        ZIP = "ZIP", "Compressed Archive"
        LINK = "LINK", "External / YouTube / Google Drive Link"

    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC", "Public (Anyone)"
        STUDENTS = "STUDENTS", "All Enrolled Students"
        TEACHERS = "TEACHERS", "Teachers Only"
        ADMIN = "ADMIN", "Administrators Only"
        COURSE_ONLY = "COURSE_ONLY", "Enrolled Course Students Only"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=60, choices=Category.choices, default=Category.KNOWLEDGE_BASE)
    folder_path = models.CharField(max_length=255, help_text="Logical folder path in Supabase Storage")
    file = models.FileField(upload_to="dms_storage/", null=True, blank=True)
    file_type = models.CharField(max_length=20, choices=FileType.choices, default=FileType.PDF)
    file_size = models.BigIntegerField(default=0, help_text="Size in bytes")
    external_link = models.URLField(max_length=500, blank=True, help_text="YouTube or Google Drive URL if applicable")

    tags = models.CharField(max_length=255, blank=True, help_text="Comma-separated tags")
    keywords = models.CharField(max_length=255, blank=True)

    # Context mappings
    course = models.CharField(max_length=100, blank=True, help_text="Course identifier or name")
    lesson = models.CharField(max_length=100, blank=True, help_text="Lesson title or ID")
    level = models.CharField(max_length=50, blank=True, help_text="CEFR band e.g. A1, B2")

    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    visibility = models.CharField(max_length=20, choices=Visibility.choices, default=Visibility.PUBLIC)
    version = models.IntegerField(default=1)

    # Document state
    is_archived = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False) # Soft delete

    # Analytics
    download_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)

    # Dates & Expiry
    effective_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # AI RAG Indexing
    ai_indexed = models.BooleanField(default=False)
    extracted_text = models.TextField(blank=True, help_text="Plain text extracted for AI semantic RAG search")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Document Metadata"
        verbose_name_plural = "Document Metadata"

    def __str__(self):
        return f"[{self.category}] {self.title} (v{self.version})"


class DocumentVersion(models.Model):
    document = models.ForeignKey(DocumentMetadata, on_delete=models.CASCADE, related_name="versions")
    version_number = models.IntegerField()
    file = models.FileField(upload_to="dms_archive/", null=True, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    change_summary = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number']

    def __str__(self):
        return f"{self.document.title} - v{self.version_number}"


class DMSAuditLog(models.Model):
    class Action(models.TextChoices):
        UPLOAD = "UPLOAD", "Upload"
        DOWNLOAD = "DOWNLOAD", "Download"
        VIEW = "VIEW", "View"
        EDIT = "EDIT", "Edit"
        DELETE = "DELETE", "Delete"
        RESTORE = "RESTORE", "Restore"
        AI_SEARCH = "AI_SEARCH", "AI Search"
        PERMISSION_CHANGE = "PERMISSION_CHANGE", "Permission Change"

    action = models.CharField(max_length=30, choices=Action.choices)
    document = models.ForeignKey(DocumentMetadata, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        actor = self.user.username if self.user else "System"
        return f"[{self.action}] {actor}: {self.details[:50]} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"
