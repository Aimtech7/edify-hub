import logging
from django.db import models
from certificates.models import Certificate
from results.models import Result
from attendance.models import Attendance

logger = logging.getLogger(__name__)

class CertificateEligibilityService:
    @classmethod
    def check_eligibility(cls, student, level, certificate_type="CEFR_LEVEL", check_finance=True):
        """
        Validates student eligibility before certificate issuance.
        Returns detailed status, reasons for failure (if any), final score, and attendance metrics.
        """
        reasons = []
        score = 0.0
        attendance_pct = 100.0

        # 1. Verify Student Exists & Active Status
        if not student or student.is_deleted:
            return {
                "eligible": False,
                "reasons": ["Student record does not exist or has been deleted."],
                "final_score": 0.0,
                "attendance_pct": 0.0,
                "finance_cleared": False
            }

        if student.status in ['Suspended', 'Dropped', 'Inactive']:
            reasons.append(f"Student status is currently '{student.status}'. Must be Active, Completed, or Graduated.")

        # 2. Check if Certificate Already Issued
        duplicate_exists = Certificate.objects.filter(
            student=student,
            level=level,
            certificate_type=certificate_type,
            status=Certificate.Status.ACTIVE
        ).exists()
        if duplicate_exists:
            reasons.append(f"An active certificate of type '{certificate_type}' has already been issued for level {level.code}.")

        # 3. Check Examination / Programme Results
        if certificate_type in ["CEFR_LEVEL", "COURSE_COMPLETION"]:
            # Check physical SIS Results ledger
            sis_result = Result.objects.filter(
                student=student,
                level=level,
                is_deleted=False
            ).order_by('-created_at').first()

            # Also check digital ODEL Exam Submissions
            from odel.models import ExamSubmission
            odel_submission = ExamSubmission.objects.filter(
                student=student,
                examination__level=level,
                marking_status='PUBLISHED'
            ).order_by('-marks_obtained').first()

            has_passed_sis = sis_result and sis_result.grade != Result.Grades.NICHT_BESTANDEN
            
            odel_pct = 0.0
            if odel_submission and odel_submission.marks_obtained is not None and odel_submission.examination.maximum_marks > 0:
                odel_pct = float((odel_submission.marks_obtained / odel_submission.examination.maximum_marks) * 100)
            
            has_passed_odel = odel_submission and odel_pct >= 60.0

            if sis_result and sis_result.average_score:
                score = float(sis_result.average_score)
            elif odel_submission and odel_pct > 0:
                score = round(odel_pct, 1)

            if not (has_passed_sis or has_passed_odel):
                reasons.append(f"Required examinations for CEFR Level {level.code} not passed or results not published.")

        # 4. Check Attendance Requirement
        attendance_records = Attendance.objects.filter(student=student)
        total_att = attendance_records.count()
        if total_att > 0:
            present_att = attendance_records.filter(status__in=[Attendance.Status.PRESENT, Attendance.Status.LATE]).count()
            attendance_pct = round((present_att / total_att) * 100.0, 1)
            if attendance_pct < 75.0 and certificate_type != "PARTICIPATION":
                reasons.append(f"Required attendance not achieved (Current: {attendance_pct:.1f}%, Minimum Required: 75.0%).")
        else:
            # If no physical attendance records exist, check virtual attendance logs if available
            try:
                from odel.models import VirtualAttendanceLog
                v_logs = VirtualAttendanceLog.objects.filter(student=student)
                v_count = v_logs.count()
                if v_count > 0:
                    v_present = v_logs.filter(status='PRESENT').count()
                    attendance_pct = round((v_present / v_count) * 100.0, 1)
                    if attendance_pct < 75.0 and certificate_type != "PARTICIPATION":
                        reasons.append(f"Required virtual attendance not achieved (Current: {attendance_pct:.1f}%, Minimum: 75.0%).")
            except Exception:
                pass

        # 5. Check Finance Clearance (if enabled)
        finance_cleared = True
        if check_finance:
            outstanding = student.outstanding_balance
            if outstanding > 0:
                finance_cleared = False
                reasons.append(f"Finance clearance pending. Outstanding tuition/exam balance: KES {outstanding:,.2f}.")

        # Audit log eligibility failure if any
        if reasons:
            logger.info(f"Certificate eligibility validation failed for Student {student.admission_number} ({level.code}): {reasons}")

        return {
            "eligible": len(reasons) == 0,
            "reasons": reasons,
            "final_score": score,
            "attendance_pct": attendance_pct,
            "finance_cleared": finance_cleared,
            "student_id": student.id,
            "student_name": f"{student.first_name} {student.last_name}",
            "admission_number": student.admission_number,
            "level_code": level.code,
            "level_name": level.name,
        }
