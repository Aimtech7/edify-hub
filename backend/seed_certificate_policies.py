import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_assistant.models import KnowledgeDocument

def seed_certificate_policies():
    policies = [
        {
            "title": "Horizon Deutsch Institute Certification Eligibility Policy",
            "category": KnowledgeDocument.Category.POLICY,
            "content": """
OFFICIAL CERTIFICATION ELIGIBILITY REQUIREMENTS (HORIZON DEUTSCH TRAINING INSTITUTE):
To be issued an official CEFR Level Completion Certificate or Course Completion Certificate, a student must meet all of the following criteria:
1. Active Status: The student must be enrolled and in Active, Completed, or Graduated status. Suspended or Dropped students cannot receive official certificates.
2. Academic Competency: The student must achieve a passing grade in the official examination or module assessment for the target level (minimum 60.0% average score across Listening, Reading, Writing, Speaking, Grammar, and Vocabulary). Grades below 60% (Nicht Bestanden) do not qualify.
3. Attendance Requirement: The student must maintain a minimum attendance rate of 75.0% across all scheduled instructional sessions (physical or virtual).
4. Finance Clearance: If financial clearance rules are enabled, the student must have no outstanding tuition or examination fee balance (outstanding balance must be KES 0.00).
5. Duplicate Issuance: Only one active certificate of a given type may be issued per CEFR level for each student. If a certificate needs correction, it must be reissued through official administrative channels.
IMPORTANT NOTE FOR AI ASSISTANT: You may explain these criteria clearly to students or staff, but you do NOT have the authority to issue certificates, override eligibility rules, or modify student records.
            """.strip()
        },
        {
            "title": "Certificate Public Verification Guide and Authenticity Checks",
            "category": KnowledgeDocument.Category.FAQ,
            "content": """
PUBLIC VERIFICATION PROCEDURES:
Anyone holding a Horizon Deutsch Training Institute certificate can verify its authenticity using our Public Verification Portal.
1. QR Code Verification: Scan the encrypted QR code printed on the bottom right of the official certificate PDF. This will direct you to the verification portal.
2. Serial Number & UUID Lookup: Enter the exact certificate serial number (e.g. HZD-A1-2026-000001) or the unique 36-character verification UUID on the verification portal.
3. Status Display: If valid, the portal will confirm the student name, CEFR level achieved, completion date, and verify status as Active/Valid. If a certificate has been revoked due to academic misconduct or administrative cancellation, the portal will display status as REVOKED / INVALID along with the revocation timestamp.
            """.strip()
        }
    ]

    for item in policies:
        doc, created = KnowledgeDocument.objects.update_or_create(
            title=item["title"],
            defaults={
                "category": item["category"],
                "content": item["content"],
                "is_active": True
            }
        )
        print(f"Indexed KB Doc: {doc.title} (Created: {created})")

if __name__ == "__main__":
    seed_certificate_policies()
