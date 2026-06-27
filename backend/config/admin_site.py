"""
Horizon Enterprise AdminSite
Provides real-time dashboard statistics from the database with defensive error handling.
Every widget fails gracefully — never exposes stack traces to the admin user.
"""
from django.contrib.admin import AdminSite
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class HorizonAdminSite(AdminSite):
    site_header = "HORIZON ERP"
    site_title = "Horizon Deutsch Training Institute ERP"
    index_title = "Site administration"

    def each_context(self, request):
        context = super().each_context(request)
        context.update(self._get_dashboard_stats())
        return context

    def _get_dashboard_stats(self):
        """Gather all dashboard KPI data with full defensive error handling."""
        stats = {}
        now = timezone.now()

        # --- Students ---
        try:
            from students.models import Student, AdmissionApplication
            stats['total_students'] = Student.objects.count()
            stats['active_students'] = Student.objects.filter(status='Active').count()
            month_ago = now - timedelta(days=30)
            students_last_month = Student.objects.filter(enrollment_date__gte=month_ago).count()
            if stats['total_students'] > 0:
                stats['student_growth'] = round((students_last_month / max(stats['total_students'], 1)) * 100, 1)
            else:
                stats['student_growth'] = 0
            stats['total_applicants'] = AdmissionApplication.objects.filter(status='New').count()
            stats['total_applications'] = AdmissionApplication.objects.count()
        except Exception as e:
            logger.warning(f"Student stats failed: {e}")
            stats.update({'total_students': 0, 'active_students': 0, 'student_growth': 0, 'total_applicants': 0, 'total_applications': 0})

        # --- Staff / Teachers ---
        try:
            from accounts.models import User
            stats['total_teachers'] = User.objects.filter(role='TEACHER', is_active=True).count()
            stats['total_staff'] = User.objects.filter(is_staff=True, is_active=True).count()
        except Exception as e:
            logger.warning(f"Staff stats failed: {e}")
            stats.update({'total_teachers': 0, 'total_staff': 0})

        # --- Finance ---
        try:
            from finance.models import Payment, Receipt
            from django.db.models import Sum
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_revenue = Payment.objects.filter(
                payment_date__gte=today_start
            ).aggregate(total=Sum('amount'))['total'] or 0
            stats['revenue_today'] = f"{today_revenue:,.0f}"
            stats['total_receipts'] = Receipt.objects.count()
        except Exception as e:
            logger.warning(f"Finance stats failed: {e}")
            stats.update({'revenue_today': '0', 'total_receipts': 0})

        # --- Academics ---
        try:
            from academics.models import Campus, Program, Level
            stats['total_campuses'] = Campus.objects.count()
            stats['total_programs'] = Program.objects.count()
            stats['total_levels'] = Level.objects.count()
        except Exception as e:
            logger.warning(f"Academic stats failed: {e}")
            stats.update({'total_campuses': 0, 'total_programs': 0, 'total_levels': 0})

        # --- Certificates ---
        try:
            from certificates.models import Certificate
            stats['total_certificates'] = Certificate.objects.count()
        except Exception as e:
            logger.warning(f"Certificate stats failed: {e}")
            stats.setdefault('total_certificates', 0)

        # --- Attendance ---
        try:
            from attendance.models import Attendance
            week_ago = now - timedelta(days=7)
            total_records = Attendance.objects.filter(date__gte=week_ago).count()
            present_records = Attendance.objects.filter(date__gte=week_ago, status='present').count()
            stats['attendance_rate'] = round((present_records / max(total_records, 1)) * 100, 1)
        except Exception as e:
            logger.warning(f"Attendance stats failed: {e}")
            stats.setdefault('attendance_rate', 0)

        # --- ODEL Courses ---
        try:
            from odel.models import Course as OdelCourse
            stats['total_odel_courses'] = OdelCourse.objects.count()
        except Exception as e:
            logger.warning(f"ODEL stats failed: {e}")
            stats.setdefault('total_odel_courses', 0)

        # --- HR ---
        try:
            from hr.models import EmployeeRecord
            stats['total_employees'] = EmployeeRecord.objects.count()
        except Exception as e:
            logger.warning(f"HR stats failed: {e}")
            stats.setdefault('total_employees', 0)

        # --- Enrollment by Level (for chart data) ---
        try:
            from students.models import Student
            from academics.models import Level
            levels = Level.objects.all().order_by('order')
            chart_labels = []
            chart_data = []
            for lv in levels:
                chart_labels.append(lv.code if hasattr(lv, 'code') else str(lv))
                chart_data.append(Student.objects.filter(current_level=lv).count())
            stats['chart_enrollment_labels'] = chart_labels
            stats['chart_enrollment_data'] = chart_data
        except Exception as e:
            logger.warning(f"Enrollment chart failed: {e}")
            stats.update({'chart_enrollment_labels': [], 'chart_enrollment_data': []})

        # --- Recent activity (audit log) ---
        try:
            from audits.models import AuditLog
            stats['recent_logs'] = list(
                AuditLog.objects.order_by('-timestamp')[:5].values('action', 'model_name', 'timestamp', 'user__username')
            )
        except Exception as e:
            logger.warning(f"Audit log stats failed: {e}")
            stats.setdefault('recent_logs', [])

        return stats
