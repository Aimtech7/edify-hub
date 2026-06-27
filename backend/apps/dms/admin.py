from django.contrib import admin
from .models import DocumentMetadata, DocumentVersion, DMSAuditLog

@admin.register(DocumentMetadata)
class DocumentMetadataAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'file_type', 'visibility', 'version', 'download_count', 'created_at')
    list_filter = ('category', 'file_type', 'visibility', 'is_archived', 'is_deleted')
    search_fields = ('title', 'description', 'tags', 'keywords')

@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ('document', 'version_number', 'uploaded_by', 'created_at')

@admin.register(DMSAuditLog)
class DMSAuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'document', 'user', 'timestamp')
    list_filter = ('action', 'timestamp')
