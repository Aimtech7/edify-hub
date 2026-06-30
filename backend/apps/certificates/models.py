import uuid
import datetime
from django.db import models
from django.conf import settings
from students.models import SoftDeleteModel

class CertificateTemplate(SoftDeleteModel):
    class CertificateType(models.TextChoices):
        COURSE_COMPLETION = "COURSE_COMPLETION", "Course Completion Certificate"
        CEFR_LEVEL = "CEFR_LEVEL", "CEFR Level Completion Certificate"
        PARTICIPATION = "PARTICIPATION", "Participation Certificate"
        ACHIEVEMENT = "ACHIEVEMENT", "Achievement Certificate"

    title = models.CharField(max_length=150)
    certificate_type = models.CharField(
        max_length=30,
        choices=CertificateType.choices,
        default=CertificateType.CEFR_LEVEL
    )
    is_active = models.BooleanField(default=True)
    institution_name = models.CharField(max_length=200, default="Horizon Deutsch Training Institute")
    header_text = models.CharField(max_length=255, default="ZERTIFIKAT")
    subtitle_text = models.CharField(max_length=255, default="CERTIFICATE OF COMPLETION")
    body_template = models.TextField(
        default="This is to certify that {student_name} has successfully completed the German Language Course and met all examination requirements for level {level_name} ({level_code})."
    )
    footer_text = models.CharField(max_length=255, default="Authorized by Horizon Deutsch Institute Board")
    logo_url = models.CharField(max_length=500, blank=True, null=True)
    seal_url = models.CharField(max_length=500, blank=True, null=True)
    signature_name = models.CharField(max_length=100, default="Dr. Klaus Weber")
    signature_title = models.CharField(max_length=100, default="Academic Director")
    signature_image_url = models.CharField(max_length=500, blank=True, null=True)
    background_style = models.CharField(max_length=50, default="CLASSIC_BORDER")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_active', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_certificate_type_display()})"


class Certificate(SoftDeleteModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        REVOKED = "REVOKED", "Revoked"

    class CertificateType(models.TextChoices):
        COURSE_COMPLETION = "COURSE_COMPLETION", "Course Completion Certificate"
        CEFR_LEVEL = "CEFR_LEVEL", "CEFR Level Completion Certificate"
        PARTICIPATION = "PARTICIPATION", "Participation Certificate"
        ACHIEVEMENT = "ACHIEVEMENT", "Achievement Certificate"

    certificate_number = models.CharField(max_length=50, unique=True, blank=True)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='certificates')
    level = models.ForeignKey('academics.Level', on_delete=models.PROTECT, related_name='certificates')
    certificate_type = models.CharField(
        max_length=30,
        choices=CertificateType.choices,
        default=CertificateType.CEFR_LEVEL
    )
    template = models.ForeignKey(
        CertificateTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issued_certificates'
    )
    issue_date = models.DateField(default=datetime.date.today)
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificates_issued'
    )
    verification_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ACTIVE)
    
    # Reissue & Revocation tracking
    revocation_reason = models.TextField(blank=True, null=True)
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revoked_certificates'
    )
    revoked_at = models.DateTimeField(null=True, blank=True)
    
    reissue_reason = models.TextField(blank=True, null=True)
    reissued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reissued_certificates'
    )
    reissued_at = models.DateTimeField(null=True, blank=True)
    
    pdf_file = models.FileField(upload_to='certificates/pdfs/', null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-issue_date']
        unique_together = ('student', 'level', 'certificate_type')

    def save(self, *args, **kwargs):
        if isinstance(self.issue_date, str):
            try:
                self.issue_date = datetime.datetime.strptime(self.issue_date, "%Y-%m-%d").date()
            except ValueError:
                self.issue_date = datetime.date.today()

        if not self.certificate_number:
            # Generate serialized certificate number: HZD-[Level]-[Year]-[ID]
            # e.g., HZD-A1-2026-000001
            year = self.issue_date.year if self.issue_date else datetime.date.today().year
            level_code = self.level.code
            
            # Find the last certificate number created for this level and year
            last_cert = Certificate.objects.filter(
                level=self.level,
                issue_date__year=year
            ).exclude(certificate_number='').order_by('id').last()
            
            next_id = 1
            if last_cert and last_cert.certificate_number:
                parts = last_cert.certificate_number.split('-')
                if len(parts) >= 4:
                    try:
                        next_id = int(parts[3]) + 1
                    except ValueError:
                        pass
            
            self.certificate_number = f"HZD-{level_code}-{year}-{next_id:06d}"
            
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        self.status = self.Status.REVOKED
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.certificate_number} - {self.student.admission_number}"
