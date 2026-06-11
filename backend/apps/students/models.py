from django.db import models
from django.conf import settings

class Student(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        SUSPENDED = "Suspended", "Suspended"
        GRADUATED = "Graduated", "Graduated"
        INACTIVE = "Inactive", "Inactive"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    admission_number = models.CharField(max_length=20, unique=True) # e.g. DA-2024-1042
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    gender = models.CharField(max_length=10, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True, null=True)
    parent_name = models.CharField(max_length=100, blank=True)
    parent_phone = models.CharField(max_length=20, blank=True)
    national_id = models.CharField(max_length=20, blank=True)
    
    current_level = models.ForeignKey(
        'academics.Level',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    current_cohort = models.ForeignKey(
        'academics.Cohort',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    enrollment_date = models.DateField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    def __str__(self):
        return f"{self.admission_number}: {self.first_name} {self.last_name}"

class PlacementTest(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='placement_tests')
    score = models.IntegerField()
    recommended_level = models.ForeignKey('academics.Level', on_delete=models.PROTECT)
    examiner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'TEACHER'}
    )
    date_taken = models.DateField()
    remarks = models.TextField(blank=True)

    def __str__(self):
        return f"Test for {self.student.admission_number} - Score: {self.score}"
