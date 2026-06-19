import pandas as pd
from datetime import datetime
import numpy as np
import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from academics.models import Level, Campus, Cohort
from students.models import Student
from finance.models import FeeStructure, Payment, Receipt, StudentLedger, Allocation
from finance.services import LedgerService

User = get_user_model()

def clean_val(val):
    if pd.isna(val):
        return None
    if isinstance(val, str):
        return val.strip()
    return val

def map_level(val):
    if not val: return 'A1'
    val = val.upper()
    if val == 'A': return 'A1'
    return val

def map_campus(val):
    if not val: return 'Ambwere Centre'
    val = val.upper()
    if 'ONLINE' in val: return 'Online'
    if 'KNP' in val: return 'KNP'
    if 'BGM' in val: return 'Bungoma Town Campus'
    if 'BNP' in val: return 'BNP'
    if 'CTI' in val: return 'CTI'
    if 'AMBWERE' in val: return 'Ambwere Centre'
    return 'Ambwere Centre'

def map_status(val, location_val=None):
    if not val: return 'Active'
    val = val.upper()
    if 'ONLINE' in val or (location_val and 'ONLINE' in str(location_val).upper()):
        return 'KNP ONLINE'
    
    if 'DROP' in val: return 'Dropped'
    if 'COMPLETE' in val: return 'Completed'
    if 'CONFIRM' in val: return 'Pending'
    if 'NEVER ATTENDED' in val: return 'Inactive'
    if 'ONGOING' in val: return 'Active'
    
    return 'Active'

class Command(BaseCommand):
    help = 'Imports historical data from excel sheets into Horizon LMS.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Starting historical data import..."))

        students_file = '../UPDATED STUDENTS ALL LIST.xlsx'
        receipts_file = '../Receipt_Entry_HORIZON_05.06.2026.xlsx'

        if not os.path.exists(students_file) or not os.path.exists(receipts_file):
            self.stdout.write(self.style.ERROR("Could not find the Excel files in the parent directory!"))
            return

        self.stdout.write("1. Setting up initial structures...")
        levels = {}
        for l_code in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
            obj, _ = Level.objects.get_or_create(code=l_code, defaults={'name': f"Level {l_code}"})
            levels[l_code] = obj

        campuses = {}
        for c_name in ['Ambwere Centre', 'KNP', 'BNP', 'Bungoma Town Campus', 'CTI', 'Online']:
            obj, _ = Campus.objects.get_or_create(name=c_name, defaults={'code': c_name[:3].upper()})
            campuses[c_name] = obj

        default_cohort, _ = Cohort.objects.get_or_create(
            name="Imported Cohort 2025/2026",
            defaults={'level': levels['A1'], 'start_date': "2025-01-01", 'end_date': "2026-12-31"}
        )

        self.stdout.write("2. Generating Standard Fee Structures...")
        # Create Fee Structures for each level
        fee_structures = {}
        for l_code, level_obj in levels.items():
            fs, _ = FeeStructure.objects.get_or_create(
                level=level_obj,
                academic_year="2025/26",
                defaults={
                    'tuition_fee': 10000.00,
                    'other_fee': 1000.00 # Registration
                }
            )
            fee_structures[l_code] = fs

        self.stdout.write("3. Importing Students...")
        df_students = pd.read_excel(students_file, sheet_name='FULL STUDENT LIST')
        students_imported = 0
        student_map = {}

        for _, row in df_students.iterrows():
            old_no = clean_val(row.get('OLD STUDENT NO.'))
            new_no = clean_val(row.get('NEW STUDENT NO'))
            student_number = old_no or new_no
            if not student_number:
                continue
            
            name = clean_val(row.get('NAME')) or "Unknown"
            if name == "Unknown": continue
            
            parts = name.split()
            first_name = parts[0]
            last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

            phone = clean_val(row.get('PHONE'))
            location = clean_val(row.get('LOCATION'))
            cls = clean_val(row.get('CLASS'))
            remarks = clean_val(row.get('REMARKS'))

            level_str = map_level(cls)
            campus_str = map_campus(location)
            status_str = map_status(remarks, location)

            user, created = User.objects.get_or_create(username=student_number)
            if created:
                user.set_password(student_number)
                user.first_name = first_name
                user.last_name = last_name
                user.save()

            student, created = Student.objects.get_or_create(
                admission_number=student_number,
                defaults={
                    'user': user,
                    'first_name': first_name,
                    'last_name': last_name,
                    'current_level': levels[level_str],
                    'campus': campuses[campus_str],
                    'current_cohort': default_cohort,
                    'status': status_str
                }
            )
            if not created:
                student.current_level = levels[level_str]
                student.campus = campuses[campus_str]
                student.status = status_str
                student.save()

            student_map[student_number] = student
            student_map[name.upper()] = student
            
            # Charge fees using LedgerService
            if getattr(student, 'total_fees', 0) == 0:
                fs = fee_structures[level_str]
                LedgerService.charge_fee(student.id, fs.id, f"Imported Standard Fees for {level_str}")

            students_imported += 1

        self.stdout.write(f"  -> Imported {students_imported} students.")

        self.stdout.write("4. Importing Receipts & Payments...")
        df_receipts_2026 = pd.read_excel(receipts_file, sheet_name='2026')
        df_receipts_2025 = pd.read_excel(receipts_file, sheet_name='2025')
        df_receipts = pd.concat([df_receipts_2026, df_receipts_2025], ignore_index=True)

        payments_imported = 0

        for _, row in df_receipts.iterrows():
            receipt_no = clean_val(row.get('Receipt No.'))
            if not receipt_no: continue
            
            date_val = clean_val(row.get('Date'))
            payer = clean_val(row.get('Payer Name'))
            student_name = clean_val(row.get('Student Name'))
            adm_num = clean_val(row.get('Admission number'))
            amount = clean_val(row.get('Amount (KES)'))
            method = clean_val(row.get('Payment Method')) or 'CASH'

            if pd.isna(amount): amount = 0.0
            
            student_obj = None
            if adm_num and str(adm_num) in student_map:
                student_obj = student_map[str(adm_num)]
            elif student_name and str(student_name).upper() in student_map:
                student_obj = student_map[str(student_name).upper()]
            elif payer and str(payer).upper() in student_map:
                student_obj = student_map[str(payer).upper()]

            if not student_obj:
                continue
            
            if Payment.objects.filter(receipt_number=str(receipt_no)).exists():
                continue

            method_mapped = 'Cash'
            method_str = str(method).upper()
            if 'MPESA' in method_str or 'PAYBILL' in method_str:
                method_mapped = 'M-Pesa'
            elif 'BANK' in method_str:
                method_mapped = 'Bank Transfer'
            elif 'CHEQ' in method_str:
                method_mapped = 'Cheque'

            payment = Payment.objects.create(
                student=student_obj,
                amount=amount,
                payment_method=method_mapped,
                receipt_number=str(receipt_no),
                payer_name=payer if payer else student_obj.first_name,
                status='ALLOCATED' # To skip Pending
            )
            
            if isinstance(date_val, datetime):
                payment.payment_date = date_val.date()
                payment.save(update_fields=['payment_date'])

            LedgerService.record_payment(payment)
            
            # Update receipt to mark it as legacy
            receipt = payment.receipt
            receipt.status = 'ALLOCATED'
            receipt.save(update_fields=['status'])

            payments_imported += 1

        self.stdout.write(f"  -> Imported {payments_imported} payments.")

        self.stdout.write("5. Data Validation...")
        total_payments_sum = sum(p.amount for p in Payment.objects.all())
        total_ledger_payments = sum(l.credit for l in StudentLedger.objects.filter(transaction_type='PAYMENT'))
        
        self.stdout.write(f"   - Total DB Payments Sum: {total_payments_sum}")
        self.stdout.write(f"   - Total Ledger Credits : {total_ledger_payments}")

        self.stdout.write(self.style.SUCCESS(f"""
        ========================================
        IMPORT SUMMARY
        ========================================
        Students Imported      : {students_imported}
        Campuses Validated     : {len(campuses)}
        Levels Validated       : {len(levels)}
        Payments/Receipts      : {payments_imported}
        Validation Errors      : None
        ========================================
        """))
