from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Result(models.Model):
    class Grades(models.TextChoices):
        SEHR_GUT = "Sehr Gut", "Sehr Gut (Very Good)"
        GUT = "Gut", "Gut (Good)"
        BEFRIEDIGEND = "Befriedigend", "Befriedigend (Satisfactory)"
        AUSREICHEND = "Ausreichend", "Ausreichend (Sufficient)"
        NICHT_BESTANDEN = "Nicht Bestanden", "Nicht Bestanden (Fail)"

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='results')
    level = models.ForeignKey('academics.Level', on_delete=models.PROTECT, related_name='results')
    term = models.CharField(max_length=50) # e.g. "Module 1 2025"
    
    # CEFR German assessment categories (0 to 100)
    listening = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    reading = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    writing = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    speaking = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    grammar = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    vocabulary = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    
    average_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    grade = models.CharField(max_length=20, choices=Grades.choices, blank=True)
    remarks = models.TextField(blank=True) # Teacher comments (usually in German)
    is_published = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'level', 'term')
        ordering = ['-created_at']

    def calculate_average_and_grade(self):
        scores = [self.listening, self.reading, self.writing, self.speaking, self.grammar, self.vocabulary]
        avg = sum(scores) / len(scores)
        self.average_score = round(avg, 2)
        
        # CEFR standard score bands
        if avg >= 90.0:
            self.grade = self.Grades.SEHR_GUT
        elif avg >= 80.0:
            self.grade = self.Grades.GUT
        elif avg >= 70.0:
            self.grade = self.Grades.BEFRIEDIGEND
        elif avg >= 60.0:
            self.grade = self.Grades.AUSREICHEND
        else:
            self.grade = self.Grades.NICHT_BESTANDEN

    def save(self, *args, **kwargs):
        self.calculate_average_and_grade()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.admission_number} - {self.level.code} - Avg: {self.average_score}"
