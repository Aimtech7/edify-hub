import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), 'apps'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from academics.models import Level
from finance.models import FeeStructure

def seed_cefr_fees():
    print("Seeding standard CEFR Fee Structures for academic year 2026...")
    
    # Standard tuition fee mapping based on sample-data fixtures
    fees_mapping = {
        'A1': {'tuition': 35000.00, 'exam': 2000.00, 'materials': 3000.00, 'cert': 1500.00},
        'A2': {'tuition': 38000.00, 'exam': 2500.00, 'materials': 3000.00, 'cert': 1500.00},
        'B1': {'tuition': 42000.00, 'exam': 3000.00, 'materials': 3500.00, 'cert': 2000.00},
        'B2': {'tuition': 50000.00, 'exam': 4000.00, 'materials': 4000.00, 'cert': 2500.00},
        'C1': {'tuition': 55000.00, 'exam': 5000.00, 'materials': 4500.00, 'cert': 3000.00},
        'C2': {'tuition': 60000.00, 'exam': 6000.00, 'materials': 5000.00, 'cert': 3500.00},
    }
    
    for code, data in fees_mapping.items():
        level = Level.objects.filter(code=code).first()
        if not level:
            level = Level.objects.create(code=code, name=f"CEFR {code}", cefr_category=code[:2])
            print(f"Created missing level: {level}")
            
        fs, created = FeeStructure.objects.get_or_create(
            level=level,
            academic_year='2026',
            defaults={
                'tuition_fee': data['tuition'],
                'exam_fee': data['exam'],
                'materials_fee': data['materials'],
                'certificate_fee': data['cert'],
                'tech_fee': 1000.00,
                'other_fee': 0.00
            }
        )
        if created:
            print(f"Created Fee Structure for {code}: KES {fs.total_fee}")
        else:
            print(f"Fee Structure for {code} already exists: KES {fs.total_fee}")
            
    print("CEFR Fee seeding completed successfully.")

if __name__ == '__main__':
    seed_cefr_fees()
