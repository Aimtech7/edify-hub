from django.db import models
from django.conf import settings

class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "Present", "Present"
        ABSENT = "Absent", "Absent"
        LATE = "Late", "Late"

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendances')
    cohort = models.ForeignKey('academics.Cohort', on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PRESENT)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'cohort', 'date')
        verbose_name_plural = "Attendance Records"

    def __str__(self):
        return f"{self.student.admission_number} - {self.date} - {self.status}"
