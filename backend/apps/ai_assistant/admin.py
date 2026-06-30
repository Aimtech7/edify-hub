from django.contrib import admin
from .models import AISetting, KnowledgeDocument, AIRequestLog, KnowledgeIndexingJob, AIConversationSession

@admin.register(AISetting)
class AISettingAdmin(admin.ModelAdmin):
    list_display = ('provider', 'model_name', 'temperature', 'max_tokens', 'updated_at')
    fieldsets = (
        ('Provider Configuration', {'fields': ('provider', 'huggingface_api_key', 'openai_api_key', 'gemini_api_key')}),
        ('Model Parameters', {'fields': ('model_name', 'temperature', 'max_tokens', 'embedding_model')}),
        ('System Persona', {'fields': ('system_prompt',)}),
    )

@admin.register(KnowledgeDocument)
class KnowledgeDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'indexing_status', 'is_active', 'updated_at')
    list_filter = ('category', 'indexing_status', 'is_active')
    search_fields = ('title', 'content')

@admin.register(KnowledgeIndexingJob)
class KnowledgeIndexingJobAdmin(admin.ModelAdmin):
    list_display = ('id', 'source_name', 'source_type', 'status', 'retry_count', 'started_at')
    list_filter = ('status', 'source_type')
    search_fields = ('source_name', 'error_log')

@admin.register(AIConversationSession)
class AIConversationSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'is_deleted', 'updated_at')
    list_filter = ('is_deleted',)
    search_fields = ('title', 'user__username')

@admin.register(AIRequestLog)
class AIRequestLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'user_role', 'question_summary', 'model_used', 'response_time_ms', 'feedback', 'timestamp')
    list_filter = ('feedback', 'user_role', 'model_used', 'timestamp')
    search_fields = ('question', 'response_text', 'user__username')
    readonly_fields = ('user', 'user_role', 'question', 'retrieved_context', 'model_used', 'response_text', 'response_time_ms', 'feedback', 'timestamp')

    def question_summary(self, obj):
        return obj.question[:50] + "..." if len(obj.question) > 50 else obj.question
    question_summary.short_description = "Question"
