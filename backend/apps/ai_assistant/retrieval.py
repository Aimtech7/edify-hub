import re
import math
from django.db.models import Q
from ai_assistant.models import KnowledgeDocument

def retrieve_rag_context(user, question: str) -> tuple[str, list[dict]]:
    """
    Retrieves role-aware structured ERP context and semantic knowledge documents.
    Returns (context_text, suggested_actions)
    """
    context_chunks = []
    actions = []
    q_lower = question.lower()

    # 1. Role-Aware Database RAG Retrieval
    if user and user.is_authenticated:
        role = getattr(user, 'role', 'STUDENT')
        
        # STUDENT queries
        if role == 'STUDENT' or hasattr(user, 'student_profile'):
            student = getattr(user, 'student_profile', None)
            if not student:
                # Try finding by user email/username
                from students.models import Student
                student = Student.objects.filter(Q(email=user.email) | Q(admission_number=user.username)).first()

            if student:
                context_chunks.append(f"Student Profile: {student.first_name} {student.last_name} (Adm: {student.admission_number}, Level: {student.current_level}, Campus: {student.campus}, Status: {student.status}).")
                
                # Check balance / fees
                if any(k in q_lower for k in ['balance', 'fee', 'pay', 'statement', 'receipt', 'money', 'cost']):
                    from finance.models import StudentLedger, PaymentPlan
                    plan = PaymentPlan.objects.filter(student=student).first()
                    if plan:
                        context_chunks.append(f"Fee Statement: Total Fee KES {plan.total_fee:,.2f}, Paid KES {plan.amount_paid:,.2f}, Outstanding Balance: KES {plan.balance:,.2f} (Status: {plan.status}).")
                    else:
                        ledgers = StudentLedger.objects.filter(student=student).order_by('-created_at')[:5]
                        latest_bal = ledgers.first().balance_after if ledgers.exists() else 0
                        context_chunks.append(f"Fee Statement Balance: KES {latest_bal:,.2f}.")
                    actions.append({"action": "NAVIGATE", "label": "Open Fee Statement & Payments", "url": "/app/payments"})

                # Check attendance
                if any(k in q_lower for k in ['attendance', 'absent', 'present', 'class', 'missed']):
                    from attendance.models import Attendance
                    atts = Attendance.objects.filter(student=student).order_by('-date')[:10]
                    present_cnt = atts.filter(status='Present').count()
                    total_cnt = atts.count() if atts.exists() else 1
                    rate = round((present_cnt / total_cnt) * 100, 1)
                    context_chunks.append(f"Recent Attendance Record: Present in {present_cnt} out of last {total_cnt} sessions ({rate}% rate).")
                    actions.append({"action": "NAVIGATE", "label": "View Full Attendance Log", "url": "/app/attendance"})

                # Check results / exams
                if any(k in q_lower for k in ['result', 'mark', 'grade', 'score', 'exam', 'pass']):
                    from results.models import Result
                    results = Result.objects.filter(student=student).order_by('-recorded_date')[:5]
                    res_str = ", ".join([f"{r.exam_name}: {r.score} ({r.grade})" for r in results]) if results.exists() else "No recent exam results published."
                    context_chunks.append(f"Academic Results: {res_str}")
                    actions.append({"action": "NAVIGATE", "label": "View Transcript & Results", "url": "/app/results"})

                # Check certificates
                if any(k in q_lower for k in ['certificate', 'cert', 'goethe', 'graduate']):
                    from certificates.models import Certificate
                    certs = Certificate.objects.filter(student=student)
                    cert_str = ", ".join([f"{c.course_name} ({c.certificate_number})" for c in certs]) if certs.exists() else "No issued certificates."
                    context_chunks.append(f"Certificates: {cert_str}")
                    actions.append({"action": "NAVIGATE", "label": "Download Verified Certificates", "url": "/app/certificates"})

        # TEACHER queries
        elif role == 'TEACHER':
            context_chunks.append(f"Instructor Profile: {user.first_name} {user.last_name} ({user.email}).")
            if any(k in q_lower for k in ['class', 'timetable', 'schedule', 'teach', 'lesson', 'student']):
                from academics.models import TimetableEvent
                events = TimetableEvent.objects.filter(teacher=user)[:5]
                ev_str = ", ".join([f"{e.subject} ({e.cohort.name} on {e.date})" for e in events]) if events.exists() else "No scheduled live timetable classes."
                context_chunks.append(f"Instructor Schedule: {ev_str}")
                actions.append({"action": "NAVIGATE", "label": "Open Instructor Timetable", "url": "/app/academics"})

        # ADMIN / FINANCE / ADMISSIONS queries
        elif role in ['ADMIN', 'FINANCE', 'ADMISSIONS', 'REGISTRAR']:
            context_chunks.append(f"Staff Authority: {user.username} ({role}). System wide metrics enabled.")
            if any(k in q_lower for k in ['student', 'count', 'total']):
                from students.models import Student
                context_chunks.append(f"System Metrics: Total Active Students = {Student.objects.count()}.")
            if any(k in q_lower for k in ['admission', 'applicant', 'queue', 'new']):
                from students.models import AdmissionApplication
                new_cnt = AdmissionApplication.objects.filter(status='New').count()
                context_chunks.append(f"Admissions Queue: {new_cnt} new unreviewed applications pending.")
                actions.append({"action": "NAVIGATE", "label": "Open Admissions Queue", "url": "/admin/students/admissionapplication/?status__exact=New"})
            if any(k in q_lower for k in ['revenue', 'money', 'payment', 'finance']):
                from finance.models import Payment
                context_chunks.append("Finance Overview: Revenue ledger active. Visit daily summary for exact real-time cashflow.")
                actions.append({"action": "NAVIGATE", "label": "Open Finance Dashboard", "url": "/app/finance"})

    # 2. 7-Tier Document Management System (DMS) Priority Search
    from dms.models import DocumentMetadata
    q_words = set(re.findall(r'\b\w{3,}\b', q_lower))

    def search_dms_category(cat_name, label):
        cat_docs = DocumentMetadata.objects.filter(category=cat_name, is_deleted=False)
        matches = []
        for d in cat_docs:
            d_text = f"{d.title} {d.description} {d.tags} {d.keywords} {d.extracted_text}".lower()
            d_words = set(re.findall(r'\b\w{3,}\b', d_text))
            overlap = len(q_words.intersection(d_words))
            if overlap > 0 or any(w in d_text for w in q_words if len(w) > 4):
                snippet = (d.extracted_text or d.description or d.title)[:350]
                matches.append((overlap, d.title, snippet, d))
        matches.sort(key=lambda x: x[0], reverse=True)
        return matches

    # Priority 2: Lesson Resources
    p2 = search_dms_category(DocumentMetadata.Category.LESSON_RESOURCES, "Lesson Resource")
    for score, title, snippet, doc in p2[:2]:
        context_chunks.append(f"Priority 2 [Lesson Resource - {title}]: {snippet}...")
        actions.append({"action": "NAVIGATE", "label": f"Open Lesson Resource ({title[:20]})", "url": "/app/lesson-resources"})

    # Priority 3: Knowledge Base
    p3 = search_dms_category(DocumentMetadata.Category.KNOWLEDGE_BASE, "Knowledge Base")
    for score, title, snippet, doc in p3[:2]:
        context_chunks.append(f"Priority 3 [Knowledge Base - {title}]: {snippet}...")
        actions.append({"action": "NAVIGATE", "label": f"Open Knowledge Base ({title[:20]})", "url": "/app/knowledge-base"})

    # Priority 4: Institution Policies
    p4 = search_dms_category(DocumentMetadata.Category.INSTITUTION_POLICIES, "Institution Policy")
    for score, title, snippet, doc in p4[:2]:
        context_chunks.append(f"Priority 4 [Policy - {title}]: {snippet}...")

    # Priority 5: Blogs
    p5 = search_dms_category(DocumentMetadata.Category.BLOGS, "Blog Article")
    for score, title, snippet, doc in p5[:1]:
        context_chunks.append(f"Priority 5 [Blog - {title}]: {snippet}...")

    # Priority 6: Announcements
    p6 = search_dms_category(DocumentMetadata.Category.ANNOUNCEMENTS, "Announcement")
    for score, title, snippet, doc in p6[:1]:
        context_chunks.append(f"Priority 6 [Announcement - {title}]: {snippet}...")

    # Priority 7: General AI Knowledge Base (Legacy / Seeded Articles)
    docs = KnowledgeDocument.objects.filter(is_active=True)
    best_matches = []
    for doc in docs:
        doc_text = f"{doc.title} {doc.content}".lower()
        doc_words = set(re.findall(r'\b\w{3,}\b', doc_text))
        overlap = len(q_words.intersection(doc_words))
        if overlap > 0 or any(w in doc_text for w in ['horizon', 'deutsch', 'fee', 'admission', 'course', 'goethe']):
            best_matches.append((overlap, doc.title, doc.content[:400]))

    best_matches.sort(key=lambda x: x[0], reverse=True)
    for score, title, snippet in best_matches[:2]:
        context_chunks.append(f"Priority 7 [General Knowledge - {title}]: {snippet}...")

    # Default institutional context if empty
    if not context_chunks:
        context_chunks.append("Horizon Deutsch Training Institute is premier German training and culture center offering CEFR A1 to C2 courses, Goethe-Zertifikat preparation, and Ausbildung pathways in Kenya.")

    return "\n\n".join(context_chunks), actions
