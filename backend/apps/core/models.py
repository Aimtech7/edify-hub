from django.db import models

class InstitutionProfile(models.Model):
    name = models.CharField(max_length=200, default="Horizon Deutsch Training Institute")
    abbreviation = models.CharField(max_length=20, default="HDTI")
    tagline = models.CharField(max_length=255, blank=True)
    
    phone_primary = models.CharField(max_length=20, blank=True)
    phone_secondary = models.CharField(max_length=20, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    email_primary = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    
    postal_address = models.TextField(blank=True)
    physical_address = models.TextField(blank=True)
    
    facebook_link = models.URLField(blank=True)
    instagram_link = models.URLField(blank=True)
    tiktok_link = models.URLField(blank=True)
    twitter_link = models.URLField(blank=True)
    linkedin_link = models.URLField(blank=True)
    google_maps_link = models.URLField(blank=True)

    class Meta:
        verbose_name = "Institution Profile"
        verbose_name_plural = "Institution Profile"

    def __str__(self):
        return self.name

    @classmethod
    def get_solo(cls):
        obj, created = cls.objects.get_or_create(id=1)
        return obj

class SupportTicket(models.Model):
    class Category(models.TextChoices):
        ADMISSIONS = "Admissions", "Admissions"
        FINANCE = "Finance", "Finance"
        ACADEMIC = "Academic", "Academic"
        TECHNICAL = "Technical Support", "Technical Support"
        VISA = "Visa Guidance", "Visa Guidance"
        CAREER = "Career Guidance", "Career Guidance"

    class Status(models.TextChoices):
        OPEN = "Open", "Open"
        IN_PROGRESS = "In Progress", "In Progress"
        RESOLVED = "Resolved", "Resolved"
        CLOSED = "Closed", "Closed"

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='support_tickets')
    category = models.CharField(max_length=50, choices=Category.choices)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.admission_number} - {self.subject} ({self.status})"
