from django.db import migrations

def populate_ledger(apps, schema_editor):
    Student = apps.get_model('students', 'Student')
    FeeStructure = apps.get_model('finance', 'FeeStructure')
    Payment = apps.get_model('finance', 'Payment')
    StudentLedger = apps.get_model('finance', 'StudentLedger')
    
    # Iterate over all students to generate their ledger entries
    for student in Student.objects.all():
        # 1. Create FEE_CHARGE entries
        levels = set()
        if student.current_level:
            levels.add(student.current_level)
            
        for promo in student.promotions.all():
            levels.add(promo.previous_level)
            levels.add(promo.new_level)
            
        for level in levels:
            fee_struct = FeeStructure.objects.filter(level=level).order_by('-academic_year').first()
            if fee_struct:
                total_fee = (
                    fee_struct.tuition_fee +
                    fee_struct.exam_fee +
                    fee_struct.materials_fee +
                    fee_struct.certificate_fee +
                    fee_struct.tech_fee +
                    fee_struct.other_fee
                )
                if total_fee > 0:
                    StudentLedger.objects.create(
                        student=student,
                        transaction_type="Fee Charge",
                        amount=total_fee,
                        description=f"Initial fee charge for level {level.code}",
                        reference_id=f"FEE-{fee_struct.id}"
                    )
                    
        # 2. Create PAYMENT entries
        for payment in Payment.objects.filter(student=student).exclude(status='CANCELLED'):
            StudentLedger.objects.create(
                student=student,
                transaction_type="Payment",
                amount=payment.amount,
                description=f"Payment via {payment.payment_method}",
                reference_id=payment.receipt_number or payment.transaction_id
            )

def reverse_ledger(apps, schema_editor):
    StudentLedger = apps.get_model('finance', 'StudentLedger')
    StudentLedger.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0005_studentledger'),
        ('students', '0002_student_campus_student_deleted_at_student_is_deleted_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_ledger, reverse_ledger),
    ]
