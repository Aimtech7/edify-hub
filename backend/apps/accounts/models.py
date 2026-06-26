from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        TEACHER = "TEACHER", "Teacher"
        TUTOR = "TUTOR", "Tutor"
        REGISTRAR = "REGISTRAR", "Registrar"
        ACCOUNTANT = "ACCOUNTANT", "Accountant"
        FINANCE = "FINANCE", "Finance"
        ADMISSIONS = "ADMISSIONS", "Admissions"
        HR = "HR", "HR"
        LIBRARY = "LIBRARY", "Library"
        ICT = "ICT", "ICT"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ADMIN
    )
    email = models.EmailField(unique=True, blank=True, null=True)
    is_2fa_enabled = models.BooleanField(default=False)
    otp_secret = models.CharField(max_length=100, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_device = models.CharField(max_length=255, blank=True)
    custom_permissions = models.JSONField(default=dict, blank=True)

    def save(self, *args, **kwargs):
        if not self.email:
            self.email = None
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"
