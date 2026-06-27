from django.db import models
from django.conf import settings

class EmployeeRecord(models.Model):
    class Department(models.TextChoices):
        ACADEMIC = "ACADEMIC", "Academic & Instruction"
        FINANCE = "FINANCE", "Finance & Accounting"
        ADMIN = "ADMIN", "Administration & HR"
        ICT = "ICT", "ICT & Systems"
        LIBRARY = "LIBRARY", "Library & Learning Resources"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="employee_record")
    employee_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=20, choices=Department.choices, default=Department.ACADEMIC)
    designation = models.CharField(max_length=100)
    date_joined = models.DateField()
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_no = models.CharField(max_length=50, blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name() or self.user.username}"


class LeaveType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    days_allowed = models.PositiveIntegerField(default=21)
    is_paid = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class LeaveRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Approval"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    employee = models.ForeignKey(EmployeeRecord, on_delete=models.CASCADE, related_name="leave_requests")
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="approved_leaves")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def total_days(self):
        return (self.end_date - self.start_date).days + 1

    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type.name} ({self.status})"


class StaffAttendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        ON_LEAVE = "ON_LEAVE", "On Leave"

    employee = models.ForeignKey(EmployeeRecord, on_delete=models.CASCADE, related_name="attendances")
    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PRESENT)
    clock_in = models.TimeField(null=True, blank=True)
    clock_out = models.TimeField(null=True, blank=True)

    class Meta:
        unique_together = ("employee", "date")
        ordering = ["-date", "-id"]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.date} ({self.status})"


class PayrollSlip(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PAID = "PAID", "Paid"

    employee = models.ForeignKey(EmployeeRecord, on_delete=models.CASCADE, related_name="payrolls")
    month = models.CharField(max_length=20)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    payment_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-id"]

    def save(self, *args, **kwargs):
        self.net_salary = self.basic_salary + self.allowances - self.deductions
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payroll {self.month} - {self.employee.employee_id}"


class EmploymentContract(models.Model):
    class ContractType(models.TextChoices):
        PERMANENT = "PERMANENT", "Permanent & Pensionable"
        CONTRACT = "CONTRACT", "Fixed Term Contract"
        PART_TIME = "PART_TIME", "Part Time / Adjunct"

    employee = models.ForeignKey(EmployeeRecord, on_delete=models.CASCADE, related_name="contracts")
    contract_type = models.CharField(max_length=20, choices=ContractType.choices, default=ContractType.PERMANENT)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    document_url = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-start_date", "-id"]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.contract_type}"


class PerformanceReview(models.Model):
    employee = models.ForeignKey(EmployeeRecord, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="conducted_reviews")
    review_date = models.DateField()
    rating = models.PositiveSmallIntegerField(default=5)  # 1 to 5 scale
    comments = models.TextField()
    goals = models.TextField(blank=True)

    class Meta:
        ordering = ["-review_date", "-id"]

    def __str__(self):
        return f"Review {self.review_date} - {self.employee.employee_id} ({self.rating}/5)"
