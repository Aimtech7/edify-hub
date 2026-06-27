import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), 'apps'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_assistant.models import AISetting, KnowledgeDocument
from dms.models import DocumentMetadata

def train_and_link_ai():
    print("=================================================================")
    print("HORIZON AI CHATBOT TRAINING & HUGGINGFACE LINKING MODULE")
    print("=================================================================")

    # 1. Update AI Settings with HuggingFace API Key
    config = AISetting.get_settings()
    config.provider = AISetting.Provider.HUGGINGFACE
    config.huggingface_api_key = "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"
    config.model_name = "mistralai/Mistral-7B-Instruct-v0.3"
    config.system_prompt = (
        "You are Antigravity AI, the official intelligent RAG chatbot for Horizon Deutsch Training Institute ERP. "
        "Answer questions accurately, professionally, and warmly based strictly on the institutional knowledge and student records provided in the context. "
        "Highlight fees in KES, explain CEFR levels clearly, and guide students on admissions and Ausbildung pathways."
    )
    config.save()
    print(f"[SUCCESS] Linked Hugging Face API Key ({config.huggingface_api_key[:8]}...) to AISetting ID {config.id}.")

    # 2. Curate Local Knowledge Base Documents
    knowledge_articles = [
        {
            "title": "Horizon Deutsch Training Institute Overview & Contact Info",
            "category": KnowledgeDocument.Category.GENERAL,
            "content": (
                "Horizon Deutsch Training Institute is premier German training and cultural immersion center in Kenya. "
                "We specialize in CEFR German language courses (A1 to C2), Goethe-Zertifikat exam preparation, and German career integration pathways. "
                "Main Campus: Horizon Tower, 4th Floor, Nairobi, Kenya. Mombasa Branch: Nyali Executive Suites. "
                "Official Email: info@horizondeutsch.com | Admissions Phone: +254 700 123456 / +254 722 000111. "
                "Office Hours: Monday to Friday 8:00 AM - 6:00 PM, Saturday 9:00 AM - 1:00 PM."
            )
        },
        {
            "title": "CEFR Course Structure & Tuition Fee Schedule 2026",
            "category": KnowledgeDocument.Category.COURSE_NOTE,
            "content": (
                "Horizon Deutsch offers intensive and super-intensive German language courses formatted to Common European Framework of Reference (CEFR) standards:\n"
                "- Level A1 (Beginner): Tuition KES 35,000 | Materials KES 3,000 | Exam Fee KES 2,000 | Total KES 41,000. Duration: 8 weeks.\n"
                "- Level A2 (Elementary): Tuition KES 38,000 | Materials KES 3,000 | Exam Fee KES 2,500 | Total KES 44,500. Duration: 8 weeks.\n"
                "- Level B1 (Intermediate): Tuition KES 42,000 | Materials KES 3,500 | Exam Fee KES 3,000 | Total KES 49,500. Duration: 10 weeks.\n"
                "- Level B2 (Upper Intermediate): Tuition KES 50,000 | Materials KES 4,000 | Exam Fee KES 4,000 | Total KES 59,000. Duration: 12 weeks.\n"
                "- Level C1 (Advanced): Tuition KES 55,000 | Materials KES 4,500 | Exam Fee KES 5,000 | Total KES 65,500. Duration: 12 weeks.\n"
                "- Level C2 (Mastery): Tuition KES 60,000 | Materials KES 5,000 | Exam Fee KES 6,000 | Total KES 72,000. Duration: 14 weeks.\n"
                "Payment Methods: M-Pesa Paybill 174379 (Account: Student Admission Number) or Bank Transfer to Equity Bank."
            )
        },
        {
            "title": "Admissions Procedure & Enrollment Guidelines",
            "category": KnowledgeDocument.Category.POLICY,
            "content": (
                "New prospective students must complete the online application via the Admissions Portal. "
                "Requirements: Copy of National ID/Passport, 2 passport photos, and registration fee of KES 2,000. "
                "Students with prior German language knowledge must book a Placement Test (KES 1,500) to accurately determine their CEFR starting band. "
                "Intakes occur monthly (January, February, March, April, May, June, July, August, September, October, November, December intakes)."
            )
        },
        {
            "title": "Goethe-Zertifikat Examination Preparation & Exam Cards",
            "category": KnowledgeDocument.Category.COURSE_NOTE,
            "content": (
                "Horizon conducts rigorous mock examinations simulated under real Goethe-Institut testing conditions. "
                "To sit for official exams, students must attain at least 75% average in continuous internal assessments. "
                "Exam Cards are generated via the Student Portal and must be presented alongside National ID on exam day. "
                "Modules tested: Lesen (Reading), Hören (Listening), Schreiben (Writing), and Sprechen (Speaking)."
            )
        },
        {
            "title": "Ausbildung & Career Integration Pathways in Germany",
            "category": KnowledgeDocument.Category.GENERAL,
            "content": (
                "Horizon integrates language training with German vocational training (Ausbildung) placement assistance. "
                "Popular fields: Nursing (Pflegefachkraft), IT & Software Development, Hospitality & Hotel Management, and Mechatronics. "
                "Minimum requirement for Ausbildung placement: B1 or B2 Goethe Certificate, high school diploma (KCSE C+ and above), and recognized translation of academic certificates. "
                "Our dedicated Academic Advisors assist qualified students with interview prep, motivation letter writing, and embassy visa application support."
            )
        },
        {
            "title": "Student Code of Conduct & Attendance Policy",
            "category": KnowledgeDocument.Category.POLICY,
            "content": (
                "Attendance Policy: Students must maintain a minimum class attendance rate of 80% per CEFR module. "
                "Students falling below 80% attendance without documented medical or emergency justification will not be issued a completion certificate or exam recommendation. "
                "Library Rules: Borrowed physical books and audio readers must be returned within 14 days. Late returns incur a fee of KES 50 per day."
            )
        },
        {
            "title": "Au Pair & German Language Visa Requirements",
            "category": KnowledgeDocument.Category.FAQ,
            "content": (
                "For individuals seeking Au Pair placement in Germany, the German Embassy requires an official A1 language certificate (Goethe-Zertifikat A1). "
                "Applicants must be between 18 and 26 years old. Horizon provides tailored 8-week A1 fast-track training specifically designed for Au Pair candidates."
            )
        }
    ]

    count = 0
    for art in knowledge_articles:
        doc, created = KnowledgeDocument.objects.update_or_create(
            title=art["title"],
            defaults={
                "category": art["category"],
                "content": art["content"],
                "is_active": True
            }
        )
        count += 1
        status_str = "Created" if created else "Updated"
        print(f"[{status_str}] Knowledge Base Article: {doc.title}")

    # Also index into DocumentMetadata for DMS semantic RAG search compatibility
    for art in knowledge_articles:
        DocumentMetadata.objects.update_or_create(
            title=art["title"],
            category=DocumentMetadata.Category.KNOWLEDGE_BASE,
            defaults={
                "description": art["content"][:200] + "...",
                "extracted_text": art["content"],
                "ai_indexed": True,
                "visibility": DocumentMetadata.Visibility.PUBLIC,
                "folder_path": f"knowledge-base/{art['title'].replace(' ', '_')}.txt"
            }
        )

    print("=================================================================")
    print(f"[COMPLETED] Successfully trained chatbot with {count} local knowledge modules!")
    print("=================================================================")

if __name__ == '__main__':
    train_and_link_ai()
