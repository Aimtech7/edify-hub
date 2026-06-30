import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from certificates.models import Certificate, CertificateTemplate
from certificates.services.eligibility_service import CertificateEligibilityService
from certificates.services.generator_service import CertificateGeneratorService
from students.models import Student
from academics.models import Level

def verify_certificates():
    print("=== STARTING PHASE 7 ENTERPRISE CERTIFICATE SYSTEM AUDIT ===")
    
    # 1. Verify CertificateTemplate creation
    t, created = CertificateTemplate.objects.get_or_create(
        title="Verify Test Template",
        defaults={
            "certificate_type": "CEFR_LEVEL",
            "is_active": True,
            "header_text": "ZERTIFIKAT",
            "subtitle_text": "OFFICIAL COMPLETION",
            "body_template": "This confirms {student_name} completed {level_name}.",
            "footer_text": "Horizon Deutsch Institute",
            "signature_name": "Dr. Klaus Weber",
            "signature_title": "Academic Director"
        }
    )
    print(f"[OK] CertificateTemplate verified: {t.title} (Active: {t.is_active})")

    # 2. Verify Eligibility Service
    student = Student.objects.first()
    level = Level.objects.first()
    if student and level:
        result = CertificateEligibilityService.check_eligibility(student, level, "CEFR_LEVEL", check_finance=True)
        print(f"[OK] Eligibility Check executed for Student {student.admission_number} ({level.code}): Eligible={result['eligible']}")
        if not result['eligible']:
            print(f"     Reasons reported: {result['reasons']}")
    else:
        print("[WARN] Student or Level records not found in database for eligibility test.")

    # 3. Verify PDF generation helper
    cert = Certificate.objects.first()
    if cert:
        pdf_bytes = CertificateGeneratorService.generate_pdf_bytes(cert)
        print(f"[OK] ReportLab PDF Generation verified: Generated {len(pdf_bytes)} bytes for Serial {cert.certificate_number}")
    else:
        print("[WARN] No existing certificate record found for PDF generation test.")

    print("=== PHASE 7 ENTERPRISE CERTIFICATE SYSTEM AUDIT COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    verify_certificates()
