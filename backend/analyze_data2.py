import pandas as pd
import json

students_file = '../UPDATED STUDENTS ALL LIST.xlsx'
receipts_file = '../Receipt_Entry_HORIZON_05.06.2026.xlsx'

report = {}

# 1. Students analysis (from FULL STUDENT LIST)
df_students = pd.read_excel(students_file, sheet_name='FULL STUDENT LIST')
# Clean columns
df_students.columns = df_students.columns.str.strip()

# Some Old student numbers are null, we might use "OLD STUDENT NO." or "NEW STUDENT NO"
# Wait, user wants to preserve existing student numbers. Let's look at "OLD STUDENT NO."
student_numbers = df_students['OLD STUDENT NO.'].dropna().unique().tolist()
student_count = len(df_students)

levels = df_students['CLASS'].dropna().unique().tolist()
campuses = df_students['LOCATION'].dropna().unique().tolist()
statuses = df_students['REMARKS'].dropna().unique().tolist()

report['student_count'] = student_count
report['existing_student_numbers_sample'] = student_numbers[:10]
report['existing_levels'] = levels
report['existing_campuses'] = campuses
report['existing_statuses'] = statuses

# Analyze Receipts
df_receipts_2026 = pd.read_excel(receipts_file, sheet_name='2026')
df_receipts_2025 = pd.read_excel(receipts_file, sheet_name='2025')
df_receipts = pd.concat([df_receipts_2026, df_receipts_2025], ignore_index=True)

receipt_count = len(df_receipts)
receipt_numbers = df_receipts['Receipt No.'].dropna().unique().tolist()
purposes = df_receipts['Purpose'].dropna().unique().tolist()

report['receipt_count'] = receipt_count
report['existing_receipt_numbers_sample'] = receipt_numbers[:10]
report['payment_purposes'] = purposes

with open('data_report.json', 'w') as f:
    json.dump(report, f, indent=4)
print("Analysis complete.")
