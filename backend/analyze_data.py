import pandas as pd
import os

students_file = '../UPDATED STUDENTS ALL LIST.xlsx'
receipts_file = '../Receipt_Entry_HORIZON_05.06.2026.xlsx'

print("=== STUDENTS FILE ===")
xls_students = pd.ExcelFile(students_file)
for sheet in xls_students.sheet_names:
    print(f"\nSheet: {sheet}")
    df = pd.read_excel(students_file, sheet_name=sheet, nrows=3)
    print(df.columns.tolist())
    print(df.head(1).to_dict('records'))

print("\n=== RECEIPTS FILE ===")
xls_receipts = pd.ExcelFile(receipts_file)
for sheet in xls_receipts.sheet_names:
    print(f"\nSheet: {sheet}")
    df = pd.read_excel(receipts_file, sheet_name=sheet, nrows=3)
    print(df.columns.tolist())
    print(df.head(1).to_dict('records'))
