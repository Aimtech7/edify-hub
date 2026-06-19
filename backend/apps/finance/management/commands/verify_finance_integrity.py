from django.core.management.base import BaseCommand
from students.models import Student
from finance.models import Payment, StudentLedger
from django.db.models import Sum

class Command(BaseCommand):
    help = 'Verifies the financial integrity of the ledger and student balances.'

    def handle(self, *args, **options):
        self.stdout.write("Starting Finance Integrity Check...")
        
        discrepancies = 0
        students = Student.objects.filter(is_deleted=False)

        for student in students:
            # 1. Total Paid via Payments table
            actual_payments = Payment.objects.filter(
                student=student, 
                status=Payment.Status.ALLOCATED, # Assuming we want to check allocated or pending
                is_deleted=False
            ).aggregate(total=Sum('amount'))['total'] or 0.00
            
            # 2. Total Paid via Ledger
            ledger_payments = StudentLedger.objects.filter(
                student=student,
                transaction_type=StudentLedger.TransactionTypes.PAYMENT,
                is_deleted=False
            ).aggregate(total=Sum('amount'))['total'] or 0.00

            # It's possible status is PENDING_ALLOCATION but still in ledger. 
            # We'll check total payments regardless of allocation.
            total_payments_any_status = Payment.objects.filter(
                student=student,
                status__in=[Payment.Status.PENDING, Payment.Status.ALLOCATED],
                is_deleted=False
            ).aggregate(total=Sum('amount'))['total'] or 0.00

            if float(total_payments_any_status) != float(ledger_payments):
                discrepancies += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"Discrepancy for Student {student.admission_number}: "
                        f"Payments Table = {total_payments_any_status}, Ledger = {ledger_payments}"
                    )
                )

            # 3. Check outstanding balance math
            derived_balance = student.total_fees - student.total_paid
            expected_balance = derived_balance if derived_balance > 0 else 0.00
            if float(student.outstanding_balance) != float(expected_balance):
                discrepancies += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"Balance Discrepancy for Student {student.admission_number}: "
                        f"Reported = {student.outstanding_balance}, Expected = {expected_balance}"
                    )
                )

        if discrepancies == 0:
            self.stdout.write(self.style.SUCCESS("Success! 0 discrepancies found. The ledger is perfectly balanced."))
        else:
            self.stdout.write(self.style.WARNING(f"Finished with {discrepancies} discrepancies."))
