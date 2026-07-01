from django.db import models
from django.conf import settings
import json
import os

class AISetting(models.Model):
    class Provider(models.TextChoices):
        HUGGINGFACE = "HUGGINGFACE", "Hugging Face Inference API"
        OPENAI = "OPENAI", "OpenAI API"
        GEMINI = "GEMINI", "Google Gemini"
        OLLAMA = "OLLAMA", "Local Ollama"

    provider = models.CharField(max_length=50, choices=Provider.choices, default=Provider.HUGGINGFACE)
    huggingface_api_key = models.CharField(max_length=255, blank=True, help_text="API Key or Token for Hugging Face Inference API")
    openai_api_key = models.CharField(max_length=255, blank=True)
    gemini_api_key = models.CharField(max_length=255, blank=True)
    
    model_name = models.CharField(max_length=150, default="mistralai/Mistral-7B-Instruct-v0.3", help_text="Primary LLM Model Name")
    temperature = models.FloatField(default=0.7)
    max_tokens = models.IntegerField(default=768)
    system_prompt = models.TextField(
        default="You are Antigravity AI, the official intelligent RAG chatbot for Horizon Deutsch Training Institute ERP. Answer strictly based on the retrieved context and institutional knowledge provided. If unsure, advise contacting support."
    )
    embedding_model = models.CharField(max_length=150, default="sentence-transformers/all-MiniLM-L6-v2")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "AI System Configuration"
        verbose_name_plural = "AI System Configuration"

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(id=1)
        changed = False
        env_openai = os.getenv("OPENAI_API_KEY", "").strip()
        env_hf = os.getenv("HUGGINGFACE_API_KEY", "").strip()
        if env_openai and not obj.openai_api_key:
            obj.openai_api_key = env_openai
            changed = True
        if env_hf and not obj.huggingface_api_key:
            obj.huggingface_api_key = env_hf
            changed = True
        if changed:
            obj.save()
        return obj

    def __str__(self):
        return f"AI Settings ({self.provider} - {self.model_name})"


class KnowledgeDocument(models.Model):
    class Category(models.TextChoices):
        FAQ = "FAQ", "Frequently Asked Questions"
        POLICY = "POLICY", "Institution Policy & Rules"
        COURSE_NOTE = "COURSE_NOTE", "Course / Syllabus Note"
        ANNOUNCEMENT = "ANNOUNCEMENT", "Public Announcement"
        GENERAL = "GENERAL", "General Knowledge"
        LESSON_PDF = "LESSON_PDF", "Lesson PDF"
        LESSON_DOCX = "LESSON_DOCX", "Lesson DOCX"
        PPT = "PPT", "PowerPoint Presentation"
        TEACHER_NOTE = "TEACHER_NOTE", "Teacher Notes"
        HANDBOOK = "HANDBOOK", "Student Handbook"
        REGULATION = "REGULATION", "Academic Regulations"
        BLOG = "BLOG", "Institutional Blog"
        MEMO = "MEMO", "Memorandum"
        FORM = "FORM", "Institutional Form"

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=Category.choices, default=Category.GENERAL)
    content = models.TextField(help_text="Full text content indexed for semantic search")
    file = models.FileField(upload_to="knowledge_base/", null=True, blank=True, help_text="Optional source PDF/Word document")
    file_size = models.BigIntegerField(default=0)
    embedding_vector = models.JSONField(default=list, blank=True, help_text="Stored float vector array for cosine similarity")
    indexing_status = models.CharField(max_length=30, default="INDEXED", help_text="INDEXED, PENDING, FAILED")
    error_message = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"[{self.category}] {self.title}"


class KnowledgeIndexingJob(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    document = models.ForeignKey(KnowledgeDocument, on_delete=models.CASCADE, related_name="indexing_jobs", null=True, blank=True)
    source_name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=50, default="PDF")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    error_log = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Job #{self.id} [{self.status}] {self.source_name}"


class AIConversationSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_sessions")
    title = models.CharField(max_length=255, default="New Conversation")
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username}: {self.title}"


class AIRequestLog(models.Model):
    class Feedback(models.TextChoices):
        HELPFUL = "HELPFUL", "👍 Helpful"
        NOT_HELPFUL = "NOT_HELPFUL", "👎 Not Helpful"
        NONE = "NONE", "None"

    session = models.ForeignKey(AIConversationSession, on_delete=models.CASCADE, related_name="messages", null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    user_role = models.CharField(max_length=50, blank=True)
    question = models.TextField()
    retrieved_context = models.TextField(blank=True)
    model_used = models.CharField(max_length=150)
    response_text = models.TextField()
    response_time_ms = models.IntegerField(default=0)
    feedback = models.CharField(max_length=20, choices=Feedback.choices, default=Feedback.NONE)
    is_deleted = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        actor = self.user.username if self.user else "Anonymous"
        return f"{actor} ({self.user_role}): {self.question[:40]}... ({self.response_time_ms}ms)"
