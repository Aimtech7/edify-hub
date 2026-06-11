import datetime
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class FeeStructure(models.Model):
    level = models.ForeignKey('academics.Level', on_delete=models.PROTECT, related_name='fee_structures')
    academic_year = models.CharField(max_length=10) # e.g. "2025"
    
    # Configurable fee components
    tuition_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    exam_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    materials_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    certificate_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tech_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    other_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    class Meta:
        unique_together = ('level', 'academic_year')
        verbose_name_plural = "Fee Structures"

    @property
    def total_fee(self):
        return (
            self.tuition_fee +
            self.exam_fee +
            self.materials_fee +
            self.certificate_fee +
            self.tech_fee +
            self.other_fee
        )

    def __str__(self):
        return f"{self.level.code} Fees ({self.academic_year}) - Total: {self.total_fee}"

class Payment(models.Model):
    class Methods(models.TextChoices):
        MPESA = "M-Pesa", "M-Pesa"
        CHEQUE = "Cheque", "Cheque"
        BANK = "Bank Transfer", "Bank Transfer"
        CASH = "Cash", "Cash"

    class Status(models.TextChoices):
        PENDING = "PENDING_ALLOCATION", "Pending Allocation"
        ALLOCATED = "ALLOCATED", "Allocated"
        CANCELLED = "CANCELLED", "Cancelled"

    transaction_id = models.CharField(max_length=50, unique=True, blank=True)
    receipt_number = models.CharField(max_length=50, unique=True, blank=True)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='payments')
    payer_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    national_id = models.CharField(max_length=20, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=Methods.choices, default=Methods.MPESA)
    
    # Method references
    mpesa_reference = models.CharField(max_length=50, blank=True, null=True)
    cheque_number = models.CharField(max_length=50, blank=True, null=True)
    
    payment_date = models.DateField(default=datetime.date.today)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments_recorded'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Generate receipt number: RCT-000001
        if not self.receipt_number:
            last_pay = Payment.objects.exclude(receipt_number='').order_by('id').last()
            next_id = 1
            if last_pay and last_pay.receipt_number:
                parts = last_pay.receipt_number.split('-')
                if len(parts) == 2:
                    try:
                        next_id = int(parts[1]) + 1
                    except ValueError:
                        pass
            self.receipt_number = f"RCT-{next_id:06d}"
            
        # Generate generic transaction_id if none specified
        if not self.transaction_id:
            self.transaction_id = f"TXN-{datetime.datetime.now().strftime('%y%m%d%H%M%S%f')}"
            
        super().save(*args, **kwargs)
        
        # Auto-create Draft Receipt
        if not hasattr(self, 'receipt'):
            Receipt.objects.create(
                payment=self,
                receipt_number=self.receipt_number,
                issue_date=self.payment_date,
                status=Receipt.Status.DRAFT
            )

    def __str__(self):
        return f"{self.receipt_number} - {self.student.admission_number} - {self.amount}"

class Allocation(models.Model):
    class Categories(models.TextChoices):
        TUITION = "Tuition", "Course Tuition"
        EXAMINATION = "Examination", "Exam Registration"
        LIBRARY = "Library", "Study Materials"
        ACTIVITY = "Activity", "Activity/Lab Fee"
        REGISTRATION = "Registration", "Certificate Fee"
        OTHER = "Other", "Other Admin Fees"

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='allocations')
    category = models.CharField(max_length=30, choices=Categories.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.payment.receipt_number} - {self.category}: {self.amount}"

class Receipt(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        FINAL = "FINAL", "Final"

    receipt_number = models.CharField(max_length=50, unique=True)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='receipt')
    issue_date = models.DateField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.receipt_number} ({self.status})"
