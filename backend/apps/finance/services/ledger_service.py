from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from finance.models import StudentLedger, Payment, FeeStructure

class LedgerService:
    @staticmethod
    @transaction.atomic
    def record_payment(payment: Payment):
        """Record a payment in the ledger"""
        # Check if already recorded to avoid duplicate ledger entries on save
        if StudentLedger.objects.filter(
            student=payment.student,
            transaction_type=StudentLedger.TransactionTypes.PAYMENT,
            reference_id=payment.receipt_number
        ).exists():
            return

        # Create ledger entry for the payment
        StudentLedger.objects.create(
            student=payment.student,
            transaction_type=StudentLedger.TransactionTypes.PAYMENT,
            amount=payment.amount,
            description=f"Payment received via {payment.payment_method}",
            reference_id=payment.receipt_number
        )

        # Update student balances
        student = payment.student
        outstanding_dec = Decimal(str(student.outstanding_balance))
        payment_amount_dec = Decimal(str(payment.amount))
        
        # Calculate overpayment if applicable
        if outstanding_dec < payment_amount_dec:
            credit_amount = payment_amount_dec - outstanding_dec
            # Record credit entry
            if credit_amount > 0:
                StudentLedger.objects.create(
                    student=student,
                    transaction_type=StudentLedger.TransactionTypes.CREDIT,
                    amount=credit_amount,
                    description=f"Credit balance generated from payment overage",
                    reference_id=payment.receipt_number
                )
        
        LedgerService.recalculate_student_balances(student)

    @staticmethod
    @transaction.atomic
    def charge_fee(student, fee_structure: FeeStructure):
        """Record a fee charge in the ledger"""
        # Check if already charged to avoid duplicates
        existing = StudentLedger.objects.filter(
            student=student,
            transaction_type=StudentLedger.TransactionTypes.FEE_CHARGE,
            reference_id=f"FEE-{fee_structure.id}"
        ).exists()

        if not existing:
            StudentLedger.objects.create(
                student=student,
                transaction_type=StudentLedger.TransactionTypes.FEE_CHARGE,
                amount=fee_structure.total_fee,
                description=f"Fee charge for {fee_structure.level.code} - {fee_structure.academic_year}",
                reference_id=f"FEE-{fee_structure.id}"
            )
            LedgerService.recalculate_student_balances(student)

    @staticmethod
    def recalculate_student_balances(student):
        """
        Recalculate the student's total_fees, total_paid, outstanding_balance, and credit_balance
        based strictly on the ledger.
        """
        from django.db.models import Sum

        charges = StudentLedger.objects.filter(
            student=student, 
            transaction_type=StudentLedger.TransactionTypes.FEE_CHARGE
        ).aggregate(total=Sum('amount'))['total'] or 0

        payments = StudentLedger.objects.filter(
            student=student, 
            transaction_type=StudentLedger.TransactionTypes.PAYMENT
        ).aggregate(total=Sum('amount'))['total'] or 0

        credits = StudentLedger.objects.filter(
            student=student, 
            transaction_type=StudentLedger.TransactionTypes.CREDIT
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        refunds = StudentLedger.objects.filter(
            student=student, 
            transaction_type=StudentLedger.TransactionTypes.REFUND
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Total Paid is net of refunds
        total_paid = payments - refunds

        # Balance calculation
        # If paid is greater than charges, balance is 0, credit is the difference
        # But wait, credits are just recorded. The source of truth is:
        # outstanding_balance = max(0, charges - total_paid)
        # credit_balance = max(0, total_paid - charges)
        
        # Properties on Student model dynamically query StudentLedger, so no model fields need updating.
        pass
