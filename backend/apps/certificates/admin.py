from django.contrib import admin
from .models import Certificate, CertificateTemplate

@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(admin.ModelAdmin):
    list_display = ('title', 'certificate_type', 'is_active', 'created_at')

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_number', 'student', 'level', 'certificate_type', 'status', 'issue_date')
