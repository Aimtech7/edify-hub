import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_assistant.models import AISetting, KnowledgeDocument

def seed():
    AISetting.get_settings()
    
    docs = [
        {
            "title": "Admissions & Application Process",
            "category": "FAQ",
            "content": "To join Horizon Deutsch Training Institute, applicants submit an online application form via our portal. Required documents include ID/Passport, academic certificates, and a passport photo. After document verification, applicants take a German language placement test to determine their CEFR level (A1 to C2). Upon approval by an admissions officer, the applicant converts to an enrolled student."
        },
        {
            "title": "Tuition Fees & Payment Plans",
            "category": "POLICY",
            "content": "Tuition fees depend on the CEFR level. A1 tuition is KES 25,000; A2 is KES 28,000; B1 is KES 32,000; B2 is KES 35,000; C1 is KES 40,000. Payments can be made via M-Pesa Paybill or Bank Transfer. Students can enroll in flexible payment plans with scheduled installments."
        },
        {
            "title": "Goethe-Zertifikat & Exam Preparation",
            "category": "COURSE_NOTE",
            "content": "Horizon offers specialized intensive preparation courses for official Goethe-Institut examinations. We provide mock exams covering reading, listening, writing, and speaking modules."
        },
        {
            "title": "Ausbildung Pathways in Germany",
            "category": "GENERAL",
            "content": "Our Ausbildung guidance program connects certified B1/B2 German language graduates with vocational training opportunities in Germany, particularly in nursing, hospitality, mechatronics, and IT."
        }
    ]
    
    for d in docs:
        KnowledgeDocument.objects.get_or_create(title=d["title"], defaults={
            "category": d["category"],
            "content": d["content"]
        })
    print("AI Knowledge Base seeded successfully!")

if __name__ == "__main__":
    seed()
