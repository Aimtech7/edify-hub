from django.db import models
from django.conf import settings
from django.db.models import Sum

class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

class Student(SoftDeleteModel):
    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        COMPLETED = "Completed", "Completed"
        DROPPED = "Dropped", "Dropped"
        SUSPENDED = "Suspended", "Suspended"
        INACTIVE = "Inactive", "Inactive"
        GRADUATED = "Graduated", "Graduated"
        TRANSFERRED = "Transferred", "Transferred"

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
    
    campus = models.ForeignKey(
        'academics.Campus',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    
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
    
    # New Extension Fields
    referral_source = models.CharField(
        max_length=50, 
        blank=True, 
        choices=[
            ('Facebook', 'Facebook'),
            ('TikTok', 'TikTok'),
            ('Instagram', 'Instagram'),
            ('Google', 'Google'),
            ('Referral', 'Referral'),
            ('Staff Referral', 'Staff Referral'),
            ('Career Fair', 'Career Fair'),
            ('Other', 'Other')
        ]
    )
    career_pathway = models.ForeignKey(
        'academics.CareerPathway',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    advisor = models.ForeignKey(
        'academics.Advisor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='advisees'
    )
    intake = models.ForeignKey(
        'academics.Intake',
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

    @property
    def total_paid(self):
        from finance.models import StudentLedger
        payments = self.ledger_entries.filter(
            transaction_type=StudentLedger.TransactionTypes.PAYMENT,
            is_deleted=False
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        
        refunds = self.ledger_entries.filter(
            transaction_type=StudentLedger.TransactionTypes.REFUND,
            is_deleted=False
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        
        return float(payments) - float(refunds)

    @property
    def total_fees(self):
        from finance.models import StudentLedger
        charges = self.ledger_entries.filter(
            transaction_type=StudentLedger.TransactionTypes.FEE_CHARGE,
            is_deleted=False
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        return float(charges)

    @property
    def outstanding_balance(self):
        bal = self.total_fees - self.total_paid
        return bal if bal > 0 else 0.00

    @property
    def credit_balance(self):
        cred = self.total_paid - self.total_fees
        return cred if cred > 0 else 0.00

    @property
    def balance(self):
        return self.outstanding_balance

    def delete(self, *args, **kwargs):
        self.status = self.Status.INACTIVE
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.admission_number}: {self.first_name} {self.last_name}"

class PlacementTest(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='placement_tests', null=True, blank=True)
    application = models.ForeignKey('AdmissionApplication', on_delete=models.SET_NULL, null=True, blank=True, related_name='placement_tests')
    listening = models.IntegerField(default=0)
    reading = models.IntegerField(default=0)
    writing = models.IntegerField(default=0)
    speaking = models.IntegerField(default=0)
    grammar = models.IntegerField(default=0)
    vocabulary = models.IntegerField(default=0)
    score = models.IntegerField(default=0)
    recommended_level = models.ForeignKey('academics.Level', on_delete=models.PROTECT, null=True, blank=True)
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
        target = self.student.admission_number if self.student else (f"App #{self.application.id}" if self.application else "Unknown")
        return f"Test for {target} - Score: {self.score}"

class AdmissionApplication(models.Model):
    class Status(models.TextChoices):
        NEW = "New", "New"
        ADMISSIONS_QUEUE = "Admissions Queue", "Admissions Queue"
        UNDER_REVIEW = "Under Review", "Under Review"
        DOCUMENTS_PENDING = "Documents Pending", "Documents Pending"
        PLACEMENT_TEST_PENDING = "Placement Test Pending", "Placement Test Pending"
        INTERVIEW_SCHEDULED = "Interview Scheduled", "Interview Scheduled"
        APPROVED = "Approved", "Approved"
        REJECTED = "Rejected", "Rejected"
        DEFERRED = "Deferred", "Deferred"
        CONVERTED_TO_STUDENT = "Converted to Student", "Converted to Student"

    # Step 1: Personal Info
    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50)
    gender = models.CharField(max_length=10, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=50, blank=True)
    national_id = models.CharField(max_length=50, blank=True)

    # Step 2: Contact Info
    phone = models.CharField(max_length=20)
    alt_phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField()
    county = models.CharField(max_length=50, blank=True)
    town = models.CharField(max_length=50, blank=True)
    postal_address = models.TextField(blank=True)

    # Step 3: Education & Professional
    highest_education = models.CharField(max_length=100, blank=True)
    current_occupation = models.CharField(max_length=100, blank=True)
    employer = models.CharField(max_length=100, blank=True)
    professional_background = models.TextField(blank=True)

    # Step 4: German Language Background
    previous_experience = models.BooleanField(default=False)
    current_german_level = models.CharField(max_length=50, blank=True)

    # Step 5: Study Preferences
    preferred_campus = models.CharField(max_length=100, blank=True)
    study_mode = models.CharField(max_length=50, blank=True)
    preferred_intake = models.CharField(max_length=50, blank=True)
    preferred_schedule = models.CharField(max_length=50, blank=True)

    # Step 6: Career Pathway & Referral
    career_pathway = models.CharField(max_length=100, blank=True)
    referral_source = models.CharField(max_length=50, blank=True)

    # Step 7: Document Uploads
    id_passport_document = models.FileField(upload_to='admissions/ids/', blank=True, null=True)
    passport_photo = models.FileField(upload_to='admissions/photos/', blank=True, null=True)
    academic_certificates = models.FileField(upload_to='admissions/certificates/', blank=True, null=True)
    additional_documents = models.FileField(upload_to='admissions/misc/', blank=True, null=True)

    # Workflow tracking & Officer Management
    documents_verified = models.BooleanField(default=False)
    placement_test_score = models.IntegerField(null=True, blank=True)
    recommended_level = models.ForeignKey('academics.Level', on_delete=models.SET_NULL, null=True, blank=True)
    
    assigned_officer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_applications')
    priority = models.CharField(max_length=20, choices=[('Low', 'Low'), ('Normal', 'Normal'), ('High', 'High'), ('Urgent', 'Urgent')], default='Normal')
    internal_notes = models.TextField(blank=True)
    
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.NEW)
    student_profile = models.OneToOneField('Student', on_delete=models.SET_NULL, null=True, blank=True, related_name='application')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"App #{self.id}: {self.first_name} {self.last_name} ({self.status})"

class AdmissionsActivityLog(models.Model):
    application = models.ForeignKey(AdmissionApplication, on_delete=models.CASCADE, related_name='activity_logs')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    old_status = models.CharField(max_length=50, blank=True)
    new_status = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Log #{self.id} for App #{self.application.id}"

class ParentGuardian(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='parent_profile')
    phone_number = models.CharField(max_length=20, blank=True)
    relationship = models.CharField(max_length=50, default="Parent")
    students = models.ManyToManyField(Student, related_name='guardians')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.relationship})"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Student)
def student_post_save(sender, instance, created, **kwargs):
    from finance.services import LedgerService
    from finance.models import FeeStructure
    if instance.current_level:
        fee_struct = FeeStructure.objects.filter(level=instance.current_level).order_by('-academic_year').first()
        if fee_struct:
            LedgerService.charge_fee(instance, fee_struct)
