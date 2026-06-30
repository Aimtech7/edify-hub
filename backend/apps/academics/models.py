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

class AcademicYear(models.Model):
    year = models.CharField(max_length=20, unique=True) # e.g. "2025/2026"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return self.year

class Semester(models.Model):
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='semesters')
    name = models.CharField(max_length=50) # e.g. "Semester 1"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.academic_year.year} - {self.name}"

class Term(models.Model):
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=50) # e.g. "Term 1"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.semester.name} - {self.name}"

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    head = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments'
    )
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Program(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='programs')
    duration_months = models.IntegerField(default=6)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.code}: {self.name}"

class Level(models.Model):
    code = models.CharField(max_length=10, unique=True) # A1.1, A1.2, A2.1, etc.
    name = models.CharField(max_length=50) # e.g. "Grundstufe A1.1"
    description = models.TextField(blank=True)
    duration_weeks = models.IntegerField(default=8)
    parent_level = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='sub_levels')
    cefr_category = models.CharField(max_length=10, blank=True) # A1, A2, B1, B2, C1, C2

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
    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        LIVE = "LIVE", "Live Now"
        ENDED = "ENDED", "Ended"

    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='virtual_classes')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    platform = models.CharField(max_length=50, choices=[('Zoom', 'Zoom'), ('BBB', 'BigBlueButton'), ('Google Meet', 'Google Meet'), ('Teams', 'Microsoft Teams')])
    meeting_link = models.URLField()
    host_link = models.URLField(blank=True, help_text="Host start URL for instructor")
    student_join_link = models.URLField(blank=True, help_text="Direct join link for enrolled students")
    recording_url = models.URLField(blank=True, help_text="Replay video recording URL")
    meeting_id = models.CharField(max_length=100, blank=True)
    passcode = models.CharField(max_length=50, blank=True)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    waiting_room = models.BooleanField(default=True)
    is_recurring = models.BooleanField(default=False)
    timezone = models.CharField(max_length=50, default="Africa/Nairobi")

    def __str__(self):
        return f"{self.cohort.name} - {self.platform} ({self.date})"


class VirtualAttendanceLog(models.Model):
    virtual_class = models.ForeignKey(VirtualClass, on_delete=models.CASCADE, related_name='attendance_logs')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='virtual_attendances')
    join_time = models.DateTimeField(auto_now_add=True)
    leave_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    is_late = models.BooleanField(default=False)
    connection_interruptions = models.PositiveIntegerField(default=0)
    attendance_percentage = models.FloatField(default=100.0)
    verified_by_teacher = models.BooleanField(default=True)

    class Meta:
        unique_together = ['virtual_class', 'student']
        ordering = ['-join_time']

    def __str__(self):
        return f"{self.student.admission_number} in {self.virtual_class} ({self.attendance_percentage}%)"

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

class ProgressionRule(models.Model):
    level = models.OneToOneField(Level, on_delete=models.CASCADE, related_name='progression_rule')
    min_attendance_percentage = models.FloatField(default=80.0)
    min_exam_score_percentage = models.FloatField(default=60.0)
    min_assignments_completed = models.IntegerField(default=5)
    allow_repeat_on_failure = models.BooleanField(default=True)
    max_repeat_attempts = models.IntegerField(default=2)

    def __str__(self):
        return f"Rule for {self.level.code}"

class GraduationRule(models.Model):
    program = models.OneToOneField(Program, on_delete=models.CASCADE, related_name='graduation_rule')
    required_level = models.ForeignKey(Level, on_delete=models.PROTECT) # e.g. B2.2 or C1.2
    min_total_credits = models.IntegerField(default=120)
    require_fee_clearance = models.BooleanField(default=True)
    require_library_clearance = models.BooleanField(default=True)

    def __str__(self):
        return f"Graduation Rule: {self.program.code}"

class StudentTimelineEvent(models.Model):
    class EventType(models.TextChoices):
        ENROLLMENT = "ENROLLMENT", "Enrollment"
        PROMOTION = "PROMOTION", "Promotion"
        REPEAT = "REPEAT", "Repeat"
        EXAM_PASSED = "EXAM_PASSED", "Exam Passed"
        EXAM_FAILED = "EXAM_FAILED", "Exam Failed"
        DISCIPLINARY = "DISCIPLINARY", "Disciplinary"
        ADVISING = "ADVISING", "Advising Session"
        FINANCIAL = "FINANCIAL", "Financial Event"
        GRADUATION = "GRADUATION", "Graduation"

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='timeline_events')
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.student.admission_number} - {self.title}"

class AdvisingSession(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='advising_sessions')
    advisor = models.ForeignKey(Advisor, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField()
    action_items = models.TextField(blank=True)
    next_followup_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Advising: {self.student.admission_number} by {self.advisor}"
