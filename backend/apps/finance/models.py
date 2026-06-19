import datetime
from django.db import models, transaction
from django.conf import settings
from django.core.exceptions import ValidationError
from students.models import SoftDeleteModel

class FeeStructure(SoftDeleteModel):
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

class Payment(SoftDeleteModel):
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
    payer_relationship = models.CharField(max_length=50, blank=True)
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
        with transaction.atomic():
            current_year = datetime.date.today().year
            
            # Generate transaction_id: TXN-YYYY-000001
            if not self.transaction_id:
                prefix = f"TXN-{current_year}-"
                # Lock row if exists to prevent race condition
                last_txn = Payment.objects.filter(transaction_id__startswith=prefix).select_for_update().order_by('-id').first()
                next_id = 1
                if last_txn and last_txn.transaction_id:
                    parts = last_txn.transaction_id.split('-')
                    if len(parts) == 3:
                        try:
                            next_id = int(parts[2]) + 1
                        except ValueError:
                            pass
                self.transaction_id = f"{prefix}{next_id:06d}"

            # Generate receipt number: RCP-YYYY-000001
            if not self.receipt_number:
                prefix = f"RCP-{current_year}-"
                last_pay = Payment.objects.filter(receipt_number__startswith=prefix).select_for_update().order_by('-id').first()
                next_id = 1
                if last_pay and last_pay.receipt_number:
                    parts = last_pay.receipt_number.split('-')
                    if len(parts) == 3:
                        try:
                            next_id = int(parts[2]) + 1
                        except ValueError:
                            pass
                self.receipt_number = f"{prefix}{next_id:06d}"
                
            super().save(*args, **kwargs)
            
            # Auto-create Draft Receipt
            if not hasattr(self, 'receipt'):
                Receipt.objects.create(
                    payment=self,
                    receipt_number=self.receipt_number,
                    issue_date=self.payment_date,
                    status=Receipt.Status.DRAFT
                )

    def delete(self, *args, **kwargs):
        self.status = self.Status.CANCELLED
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.receipt_number} - {self.student.admission_number} - {self.amount}"

class Allocation(SoftDeleteModel):
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

class Receipt(SoftDeleteModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        FINAL = "FINAL", "Final"
        VOID = "VOID", "Void"

    receipt_number = models.CharField(max_length=50, unique=True)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='receipt')
    issue_date = models.DateField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_fees(self):
        return self.payment.student.total_fees

    @property
    def total_paid(self):
        return self.payment.student.total_paid

    @property
    def outstanding_balance(self):
        return self.payment.student.outstanding_balance

    @property
    def current_payment(self):
        return self.payment.amount

    def delete(self, *args, **kwargs):
        self.status = self.Status.VOID
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.receipt_number} ({self.status})"

class MpesaTransaction(SoftDeleteModel):
    checkout_request_id = models.CharField(max_length=100, unique=True)
    merchant_request_id = models.CharField(max_length=100, unique=True)
    student = models.ForeignKey('students.Student', on_delete=models.SET_NULL, null=True, blank=True, related_name='mpesa_transactions')
    mpesa_reference = models.CharField(max_length=50, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    phone = models.CharField(max_length=20)
    status = models.CharField(max_length=50, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.checkout_request_id} - {self.status}"

class StudentLedger(SoftDeleteModel):
    class TransactionTypes(models.TextChoices):
        FEE_CHARGE = "Fee Charge", "Fee Charge"
        PAYMENT = "Payment", "Payment"
        ALLOCATION = "Allocation", "Allocation"
        ADJUSTMENT = "Adjustment", "Adjustment"
        REFUND = "Refund", "Refund"
        CREDIT = "Credit", "Credit"

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='ledger_entries')
    transaction_type = models.CharField(max_length=50, choices=TransactionTypes.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2) # Always positive, logic determines effect on balance
    transaction_date = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    reference_id = models.CharField(max_length=100, blank=True) # Could be receipt number, allocation id, fee structure id

    def __str__(self):
        return f"{self.student.admission_number} - {self.transaction_type} - {self.amount}"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Payment)
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

class Payment(SoftDeleteModel):
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
    payer_relationship = models.CharField(max_length=50, blank=True)
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
        with transaction.atomic():
            current_year = datetime.date.today().year
            
            # Generate transaction_id: TXN-YYYY-000001
            if not self.transaction_id:
                prefix = f"TXN-{current_year}-"
                # Lock row if exists to prevent race condition
                last_txn = Payment.objects.filter(transaction_id__startswith=prefix).select_for_update().order_by('-id').first()
                next_id = 1
                if last_txn and last_txn.transaction_id:
                    parts = last_txn.transaction_id.split('-')
                    if len(parts) == 3:
                        try:
                            next_id = int(parts[2]) + 1
                        except ValueError:
                            pass
                self.transaction_id = f"{prefix}{next_id:06d}"

            # Generate receipt number: RCP-YYYY-000001
            if not self.receipt_number:
                prefix = f"RCP-{current_year}-"
                last_pay = Payment.objects.filter(receipt_number__startswith=prefix).select_for_update().order_by('-id').first()
                next_id = 1
                if last_pay and last_pay.receipt_number:
                    parts = last_pay.receipt_number.split('-')
                    if len(parts) == 3:
                        try:
                            next_id = int(parts[2]) + 1
                        except ValueError:
                            pass
                self.receipt_number = f"{prefix}{next_id:06d}"
                
            super().save(*args, **kwargs)
            
            # Auto-create Draft Receipt
            if not hasattr(self, 'receipt'):
                Receipt.objects.create(
                    payment=self,
                    receipt_number=self.receipt_number,
                    issue_date=self.payment_date,
                    status=Receipt.Status.DRAFT
                )

    def delete(self, *args, **kwargs):
        self.status = self.Status.CANCELLED
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.receipt_number} - {self.student.admission_number} - {self.amount}"

class Allocation(SoftDeleteModel):
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

class Receipt(SoftDeleteModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        FINAL = "FINAL", "Final"
        VOID = "VOID", "Void"

    receipt_number = models.CharField(max_length=50, unique=True)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='receipt')
    issue_date = models.DateField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_fees(self):
        return self.payment.student.total_fees

    @property
    def total_paid(self):
        return self.payment.student.total_paid

    @property
    def outstanding_balance(self):
        return self.payment.student.outstanding_balance

    @property
    def current_payment(self):
        return self.payment.amount

    def delete(self, *args, **kwargs):
        self.status = self.Status.VOID
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.receipt_number} ({self.status})"

class MpesaTransaction(SoftDeleteModel):
    checkout_request_id = models.CharField(max_length=100, unique=True)
    merchant_request_id = models.CharField(max_length=100, unique=True)
    student = models.ForeignKey('students.Student', on_delete=models.SET_NULL, null=True, blank=True, related_name='mpesa_transactions')
    mpesa_reference = models.CharField(max_length=50, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    phone = models.CharField(max_length=20)
    status = models.CharField(max_length=50, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.checkout_request_id} - {self.status}"

class StudentLedger(SoftDeleteModel):
    class TransactionTypes(models.TextChoices):
        FEE_CHARGE = "Fee Charge", "Fee Charge"
        PAYMENT = "Payment", "Payment"
        ALLOCATION = "Allocation", "Allocation"
        ADJUSTMENT = "Adjustment", "Adjustment"
        REFUND = "Refund", "Refund"
        CREDIT = "Credit", "Credit"

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='ledger_entries')
    transaction_type = models.CharField(max_length=50, choices=TransactionTypes.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2) # Always positive, logic determines effect on balance
    transaction_date = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    reference_id = models.CharField(max_length=100, blank=True) # Could be receipt number, allocation id, fee structure id

    def __str__(self):
        return f"{self.student.admission_number} - {self.transaction_type} - {self.amount}"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Payment)
def payment_post_save(sender, instance, created, **kwargs):
    from finance.services import LedgerService
    if instance.status != Payment.Status.CANCELLED:
        LedgerService.record_payment(instance)

@receiver(post_save, sender=FeeStructure)
def feestruct_post_save(sender, instance, created, **kwargs):
    from finance.services import LedgerService
    from students.models import Student
    # Apply to all students currently in this level
    for student in Student.objects.filter(current_level=instance.level):
        LedgerService.charge_fee(student, instance)

@receiver(post_save, sender=Allocation)
def allocation_post_save(sender, instance, created, **kwargs):
    from django.db.models import Sum
    from finance.models import StudentLedger
    
    payment = instance.payment
    
    if created:
        StudentLedger.objects.create(
            student=payment.student,
            transaction_type=StudentLedger.TransactionTypes.ALLOCATION,
            amount=instance.amount,
            description=f"Payment allocated to {instance.category}",
            reference_id=f"ALLOC-{instance.id}"
        )
        
    total_allocated = payment.allocations.aggregate(total=Sum('amount'))['total'] or 0.00
    
    if float(total_allocated) >= float(payment.amount):
        payment.status = payment.Status.ALLOCATED
        payment.save(update_fields=['status'])
        
        # Mark receipt as final
        if hasattr(payment, 'receipt'):
            payment.receipt.status = Receipt.Status.FINAL
            payment.receipt.save(update_fields=['status'])

class PaymentPlan(SoftDeleteModel):
    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        COMPLETED = "Completed", "Completed"
        DEFAULTED = "Defaulted", "Defaulted"

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='payment_plans')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE)
    total_fee = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def outstanding_balance(self):
        return self.total_fee - self.amount_paid

    def __str__(self):
        return f"{self.student.admission_number} - {self.fee_structure.level.code} ({self.status})"

class PaymentPlanInstallment(models.Model):
    plan = models.ForeignKey(PaymentPlan, on_delete=models.CASCADE, related_name='installments')
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.plan.student.admission_number} - {self.amount_due} due {self.due_date}"
