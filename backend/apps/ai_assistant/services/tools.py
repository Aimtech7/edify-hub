import re
from django.db.models import Q

class FinanceTool:
    @staticmethod
    def run(user, role, query: str) -> tuple[str, list[dict]]:
        actions = []
        if not user or not getattr(user, 'is_authenticated', False):
            return "Finance Ledger: Guest user (Authentication required to view confidential billing records).", []

        if role == 'STUDENT' or hasattr(user, 'student_profile'):
            student = getattr(user, 'student_profile', None)
            if not student:
                from students.models import Student
                student = Student.objects.filter(Q(email=user.email) | Q(admission_number=user.username)).first()
            if student:
                from finance.models import PaymentPlan
                plan = PaymentPlan.objects.filter(student=student).first()
                if plan:
                    data = f"Student Billing Record for {student.first_name} {student.last_name}: Total Course Fee KES {plan.total_fee:,.2f}, Amount Paid KES {plan.amount_paid:,.2f}, Current Outstanding Balance KES {plan.outstanding_balance:,.2f}. Account Status: {plan.status}."
                else:
                    bal = getattr(student, 'outstanding_balance', 0)
                    data = f"Student Fee Balance for {student.first_name} {student.last_name}: KES {bal:,.2f}."
                actions.append({"action": "NAVIGATE", "label": "View Fee Statement & Payment Portal", "url": "/app/payments"})
                return data, actions

        if role in ['ADMIN', 'FINANCE', 'REGISTRAR']:
            return "Enterprise Finance Overview: Real-time revenue ledger active. Visit daily summary for cashflow breakdown.", [{"action": "NAVIGATE", "label": "Open Finance Dashboard", "url": "/app/finance"}]

        return "", []


class AttendanceTool:
    @staticmethod
    def run(user, role, query: str) -> tuple[str, list[dict]]:
        actions = []
        if not user or not getattr(user, 'is_authenticated', False):
            return "", []

        if role == 'STUDENT' or hasattr(user, 'student_profile'):
            student = getattr(user, 'student_profile', None)
            if not student:
                from students.models import Student
                student = Student.objects.filter(Q(email=user.email) | Q(admission_number=user.username)).first()
            if student:
                from attendance.models import Attendance
                atts = Attendance.objects.filter(student=student).order_by('-date')[:15]
                present_cnt = atts.filter(status='Present').count()
                total_cnt = atts.count() if atts.exists() else 1
                rate = round((present_cnt / total_cnt) * 100, 1)
                data = f"Attendance Register for {student.first_name}: Attended {present_cnt} out of recent {total_cnt} sessions ({rate}% attendance rate)."
                actions.append({"action": "NAVIGATE", "label": "Open Classroom Register Log", "url": "/app/attendance"})
                return data, actions
        return "", []


class CertificateTool:
    @staticmethod
    def run(user, role, query: str) -> tuple[str, list[dict]]:
        actions = []
        if not user or not getattr(user, 'is_authenticated', False):
            return "", []
        if role == 'STUDENT' or hasattr(user, 'student_profile'):
            student = getattr(user, 'student_profile', None)
            if not student:
                from students.models import Student
                student = Student.objects.filter(Q(email=user.email) | Q(admission_number=user.username)).first()
            if student:
                from certificates.models import Certificate
                from results.models import Result
                certs = Certificate.objects.filter(student=student).order_by('-issue_date')
                results = Result.objects.filter(student=student).order_by('-created_at')[:5]
                c_list = ", ".join([f"{c.level.code} {c.get_certificate_type_display()} (Serial: {c.certificate_number})" for c in certs]) if certs.exists() else "No issued certificates on file."
                r_list = ", ".join([f"{r.level.code}: Score {r.average_score} ({r.grade})" for r in results]) if results.exists() else "No recent exam marks logged."
                actions.append({"action": "NAVIGATE", "label": "Download Official Certificates", "url": "/app/certificates"})
                return f"Verified Credentials: {c_list}\nRecent Exam Results: {r_list}", actions
        return "", []


class TimetableTool:
    @staticmethod
    def run(user, role, query: str) -> tuple[str, list[dict]]:
        actions = []
        if user and getattr(user, 'is_authenticated', False):
            if role == 'TEACHER':
                from academics.models import TimetableEvent
                events = TimetableEvent.objects.filter(teacher=user)[:5]
                e_str = ", ".join([f"{e.subject} ({e.cohort.name} on {e.date})" for e in events]) if events.exists() else "No immediate live classes scheduled."
                actions.append({"action": "NAVIGATE", "label": "Open Teaching Timetable", "url": "/app/academics"})
                return f"Instructor Schedule: {e_str}", actions
            actions.append({"action": "NAVIGATE", "label": "Open Timetable & Zoom Portal", "url": "/app/timetable"})
            return "ODEL & Class Schedule: Live Zoom classroom links and timetable schedules are active in your academic portal.", actions
        return "", []


class AdmissionsTool:
    @staticmethod
    def run(user, role, query: str) -> tuple[str, list[dict]]:
        actions = []
        if role in ['ADMIN', 'REGISTRAR', 'ADMISSIONS']:
            from students.models import AdmissionApplication
            new_cnt = AdmissionApplication.objects.filter(status='New').count()
            actions.append({"action": "NAVIGATE", "label": "Review Admissions Queue", "url": "/admin/students/admissionapplication/?status__exact=New"})
            return f"Admissions Queue Report: {new_cnt} new applications awaiting registrar verification.", actions
        return "Horizon Admissions: CEFR levels A1 through C2 intakes are open. Applicants can verify requirements or enroll via the student registration portal.", []


class KnowledgeSearchTool:
    @staticmethod
    def run(query: str) -> tuple[str, list[dict]]:
        actions = []
        from dms.models import DocumentMetadata
        q_words = set(re.findall(r'\b\w{3,}\b', query.lower()))
        docs = DocumentMetadata.objects.filter(is_deleted=False)[:30]
        matches = []
        for d in docs:
            d_text = f"{d.title} {d.description} {d.extracted_text}".lower()
            d_words = set(re.findall(r'\b\w{3,}\b', d_text))
            overlap = len(q_words.intersection(d_words))
            if overlap > 0 or any(w in d_text for w in q_words if len(w) > 4):
                snippet = (d.extracted_text or d.description or d.title)[:300]
                matches.append((overlap, d.title, snippet))
        matches.sort(key=lambda x: x[0], reverse=True)
        
        if not matches:
            from ai_assistant.services.search_service import AISearchService
            kb_matches = AISearchService.semantic_search(query, limit=2)
            results = [f"Institutional Note on '{m['title']}': {m['snippet']}" for m in kb_matches]
        else:
            results = [f"Reference ({m[1]}): {m[2]}" for m in matches[:2]]
            actions.append({"action": "NAVIGATE", "label": f"Open Digital Library ({matches[0][1][:18]})", "url": "/app/library"})
        
        return "\n".join(results), actions


class EnterpriseToolOrchestrator:
    """
    Evaluates query intent and triggers modular ERP tools to gather grounding data.
    """
    @classmethod
    def execute_tools(cls, user, role: str, query: str, intent: str) -> tuple[str, list[dict], list[str]]:
        tools_called = []
        contexts = []
        all_actions = []

        if intent == "FINANCE" or any(w in query.lower() for w in ['balance', 'fee', 'pay', 'statement', 'receipt']):
            tools_called.append("FinanceTool")
            c, a = FinanceTool.run(user, role, query)
            if c: contexts.append(c)
            all_actions.extend(a)

        if intent == "ATTENDANCE" or any(w in query.lower() for w in ['attendance', 'absent', 'present', 'class register']):
            tools_called.append("AttendanceTool")
            c, a = AttendanceTool.run(user, role, query)
            if c: contexts.append(c)
            all_actions.extend(a)

        if intent == "CERTIFICATES" or any(w in query.lower() for w in ['certificate', 'result', 'grade', 'goethe', 'mark']):
            tools_called.append("CertificateTool")
            c, a = CertificateTool.run(user, role, query)
            if c: contexts.append(c)
            all_actions.extend(a)

        if intent == "ODEL" or any(w in query.lower() for w in ['zoom', 'timetable', 'schedule', 'online']):
            tools_called.append("TimetableTool")
            c, a = TimetableTool.run(user, role, query)
            if c: contexts.append(c)
            all_actions.extend(a)

        if intent == "ADMISSIONS" or any(w in query.lower() for w in ['admission', 'intake', 'enroll', 'apply']):
            tools_called.append("AdmissionsTool")
            c, a = AdmissionsTool.run(user, role, query)
            if c: contexts.append(c)
            all_actions.extend(a)

        # If no specialized ERP tool matched or if query requires policy / library lookup
        if not contexts or intent in ["SYSTEM_HELP", "GENERAL_CONVERSATION"]:
            tools_called.append("KnowledgeSearchTool")
            c, a = KnowledgeSearchTool.run(query)
            if c: contexts.append(c)
            all_actions.extend(a)

        # Deduplicate actions
        unique_actions = []
        seen_urls = set()
        for act in all_actions:
            if act["url"] not in seen_urls:
                seen_urls.add(act["url"])
                unique_actions.append(act)

        return "\n\n".join(contexts), unique_actions, tools_called
