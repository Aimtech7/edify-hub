from django.db import models
from django.conf import settings

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

    class Meta:
        verbose_name_plural = "Promotion Histories"

    def __str__(self):
        return f"{self.student.admission_number}: {self.previous_level.code} -> {self.new_level.code}"
