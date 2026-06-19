import uuid
import datetime
from django.db import models
from django.conf import settings
from students.models import SoftDeleteModel

class Certificate(SoftDeleteModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        REVOKED = "REVOKED", "Revoked"

    certificate_number = models.CharField(max_length=50, unique=True, blank=True)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='certificates')
    level = models.ForeignKey('academics.Level', on_delete=models.PROTECT, related_name='certificates')
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-issue_date']
        unique_together = ('student', 'level')

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
                if len(parts) == 4:
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
