from django.db import models
from django.conf import settings

class Campus(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    location = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name_plural = "Campuses"

    def __str__(self):
        return self.name

class Level(models.Model):
    code = models.CharField(max_length=10, unique=True) # A1, A2, B1, B2, C1, C2
    name = models.CharField(max_length=50) # e.g. "Grundstufe A1"
    description = models.TextField(blank=True)
    duration_weeks = models.IntegerField(default=8)

    def __str__(self):
        return self.code

class Cohort(models.Model):
    name = models.CharField(max_length=50) # e.g. "A1-Batch-2025-01"
    level = models.ForeignKey(Level, on_delete=models.PROTECT, related_name='cohorts')
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'TEACHER'},
        related_name='cohorts'
    )
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"{self.name} ({self.level.code})"

class PromotionHistory(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='promotions')
    previous_level = models.ForeignKey(Level, on_delete=models.PROTECT, related_name='demotions_from')
    new_level = models.ForeignKey(Level, on_delete=models.PROTECT, related_name='promotions_to')
    promoted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='promotions_made'
    )
    promotion_date = models.DateField(auto_now_add=True)
    remarks = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Promotion Histories"

    def __str__(self):
        return f"{self.student.admission_number}: {self.previous_level.code} -> {self.new_level.code}"

class CareerPathway(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Advisor(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='advisor_profile')
    department = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Intake(models.Model):
    name = models.CharField(max_length=100, unique=True) # e.g. January 2026 Intake
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name

class ExternalExam(models.Model):
    name = models.CharField(max_length=100) # Goethe, OSD, TELC
    level = models.ForeignKey(Level, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} - {self.level.code}"

class ExternalExamRegistration(models.Model):
    class Status(models.TextChoices):
        REGISTERED = "Registered", "Registered"
        PASSED = "Passed", "Passed"
        FAILED = "Failed", "Failed"

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='external_exams')
    exam = models.ForeignKey(ExternalExam, on_delete=models.CASCADE)
    registration_date = models.DateField(auto_now_add=True)
    exam_date = models.DateField()
    exam_center = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REGISTERED)
    result_score = models.CharField(max_length=50, blank=True)
    certificate_file = models.FileField(upload_to='external_certs/', null=True, blank=True)

    def __str__(self):
        return f"{self.student.admission_number} - {self.exam}"

class TimetableEvent(models.Model):
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE)
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.cohort.name} - {self.subject} ({self.date})"

class VirtualClass(models.Model):
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='virtual_classes')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    platform = models.CharField(max_length=50, choices=[('Zoom', 'Zoom'), ('Google Meet', 'Google Meet'), ('Teams', 'Microsoft Teams')])
    meeting_link = models.URLField()
    meeting_id = models.CharField(max_length=100, blank=True)
    passcode = models.CharField(max_length=50, blank=True)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.cohort.name} - {self.platform} ({self.date})"

class LearningResource(models.Model):
    class Type(models.TextChoices):
        PDF = "PDF", "PDF"
        VIDEO = "Video", "Video"
        AUDIO = "Audio", "Audio"
        LINK = "Link", "Link"
        ASSIGNMENT = "Assignment", "Assignment"

    title = models.CharField(max_length=200)
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='resources')
    resource_type = models.CharField(max_length=20, choices=Type.choices)
    file = models.FileField(upload_to='learning_resources/', null=True, blank=True)
    url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.level.code})"
