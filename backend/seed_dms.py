import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from dms.models import DocumentMetadata, DocumentVersion, DMSAuditLog
from django.contrib.auth import get_user_model

User = get_user_model()

def seed_dms():
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.first()

    docs = [
        {
            "title": "A1 Grammar Intensive Workbook 2026",
            "description": "Comprehensive exercises covering German article declension, verb conjugation, and modal verbs.",
            "category": "lesson-resources",
            "file_type": "PDF",
            "file_size": 2450000,
            "tags": "grammar,A1,workbook,exercises",
            "keywords": "declension conjugation verbs",
            "course": "German A1 Intensive",
            "lesson": "Module 2 - Grammar Basics",
            "level": "A1",
            "visibility": "PUBLIC",
            "external_link": "https://www.goethe.de/resources/a1_grammar_sample.pdf"
        },
        {
            "title": "Goethe-Zertifikat B1 Speaking Module Practice Cards",
            "description": "Official speaking presentation topics and collaborative task prompts for exam preparation.",
            "category": "lesson-resources",
            "file_type": "PDF",
            "file_size": 1800000,
            "tags": "exam,B1,speaking,goethe",
            "keywords": "sprechen teil 1 teil 2 exam",
            "course": "Goethe Exam Prep B1",
            "lesson": "Speaking Practice",
            "level": "B1",
            "visibility": "STUDENTS",
            "external_link": "https://www.goethe.de/resources/b1_speaking_cards.pdf"
        },
        {
            "title": "German Pronunciation & Phonetics Audio Guide",
            "description": "MP3 recordings of native speakers pronouncing umlauts (ä, ö, ü) and diphthongs.",
            "category": "lesson-resources",
            "file_type": "AUDIO",
            "file_size": 5200000,
            "tags": "audio,pronunciation,phonetics,A1,A2",
            "keywords": "aussprache umlaut phonetics",
            "course": "General German",
            "lesson": "Phonetics Lab",
            "level": "All Levels",
            "visibility": "PUBLIC",
            "external_link": "https://www.goethe.de/resources/phonetics_audio.mp3"
        },
        {
            "title": "Student Handbook & Code of Conduct 2026",
            "description": "Official rules, campus operating hours, library rules, and academic integrity policies.",
            "category": "knowledge-base",
            "file_type": "PDF",
            "file_size": 1200000,
            "tags": "handbook,policy,rules,campus",
            "keywords": "rules conduct library operating hours",
            "course": "General",
            "lesson": "",
            "level": "All Levels",
            "visibility": "PUBLIC",
            "external_link": "https://horizon-deutsch.com/docs/student_handbook_2026.pdf"
        },
        {
            "title": "Ausbildung Nursing Application Checklist",
            "description": "Required translation documents, B2 certificate verification, and embassy interview tips.",
            "category": "knowledge-base",
            "file_type": "PDF",
            "file_size": 890000,
            "tags": "ausbildung,nursing,germany,visa",
            "keywords": "nursing ausbildung interview visa recognition",
            "course": "Ausbildung Preparation",
            "lesson": "",
            "level": "B1/B2",
            "visibility": "PUBLIC",
            "external_link": "https://horizon-deutsch.com/docs/ausbildung_checklist.pdf"
        },
        {
            "title": "Tuition Refund & Deferral Policy",
            "description": "Guidelines on course postponements, medical deferrals, and fee refund schedules.",
            "category": "institution-policies",
            "file_type": "PDF",
            "file_size": 540000,
            "tags": "finance,refund,policy,fees",
            "keywords": "refund postpone fee deferral",
            "course": "General",
            "lesson": "",
            "level": "All Levels",
            "visibility": "PUBLIC",
            "external_link": "https://horizon-deutsch.com/docs/refund_policy.pdf"
        }
    ]

    for d in docs:
        doc, created = DocumentMetadata.objects.get_or_create(
            title=d["title"],
            defaults={
                "description": d["description"],
                "category": d["category"],
                "file_type": d["file_type"],
                "file_size": d["file_size"],
                "tags": d["tags"],
                "keywords": d["keywords"],
                "course": d["course"],
                "lesson": d["lesson"],
                "level": d["level"],
                "visibility": d["visibility"],
                "external_link": d["external_link"],
                "uploaded_by": admin_user,
                "ai_indexed": True,
                "extracted_text": f"{d['title']} - {d['description']} - Keywords: {d['keywords']}"
            }
        )
        if created:
            DocumentVersion.objects.create(
                document=doc,
                version_number=1,
                uploaded_by=admin_user,
                change_summary="Initial system seed"
            )
    print("DMS Seed documents added successfully!")

if __name__ == "__main__":
    seed_dms()
