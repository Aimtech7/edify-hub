import pandas as pd
import numpy as np
from datetime import datetime

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

students_file = '../UPDATED STUDENTS ALL LIST.xlsx'
df = pd.read_excel(students_file, sheet_name='FULL STUDENT LIST')

students_data = []

for _, row in df.iterrows():
    old_no = clean_val(row.get('OLD STUDENT NO.'))
    new_no = clean_val(row.get('NEW STUDENT NO'))
    
    # User said: "Student Number = Admission Number". Use existing.
    student_number = old_no or new_no
    if not student_number:
        continue # skip rows without student number
        
    name = clean_val(row.get('NAME')) or "Unknown"
    phone = clean_val(row.get('PHONE'))
    location = clean_val(row.get('LOCATION'))
    cls = clean_val(row.get('CLASS'))
    remarks = clean_val(row.get('REMARKS'))
    
    students_data.append({
        'number': student_number,
        'name': name,
        'level': map_level(cls),
        'campus': map_campus(location),
        'status': map_status(remarks, location)
    })

print(f"Total mapped students: {len(students_data)}")
import random
for s in random.sample(students_data, 5):
    print(s)
