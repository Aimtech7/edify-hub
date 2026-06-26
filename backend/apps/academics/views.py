from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from academics.models import (
    Campus, AcademicYear, Semester, Term, Department, Program,
    Level, Cohort, PromotionHistory, CareerPathway, Advisor,
    Intake, ExternalExam, ExternalExamRegistration, TimetableEvent,
    VirtualClass, LearningResource, ProgressionRule, GraduationRule,
    StudentTimelineEvent, AdvisingSession
)
from academics.serializers import (
    CampusSerializer, AcademicYearSerializer, SemesterSerializer, TermSerializer,
    DepartmentSerializer, ProgramSerializer, LevelSerializer, CohortSerializer,
    PromotionHistorySerializer, CareerPathwaySerializer, AdvisorSerializer,
    IntakeSerializer, ExternalExamSerializer, ExternalExamRegistrationSerializer,
    TimetableEventSerializer, VirtualClassSerializer, LearningResourceSerializer,
    ProgressionRuleSerializer, GraduationRuleSerializer, StudentTimelineEventSerializer,
    AdvisingSessionSerializer
)
from accounts.permissions import IsAdminUser, IsTeacher, IsStaffUser, IsRegistrar, IsAdminOrReadOnly, IsStaffOrReadOnly

class CampusViewSet(viewsets.ModelViewSet):
    queryset = Campus.objects.all().order_by('name')
    serializer_class = CampusSerializer
    permission_classes = [IsAdminOrReadOnly]

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all().order_by('-start_date')
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAdminOrReadOnly]

class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all().order_by('-start_date')
    serializer_class = SemesterSerializer
    permission_classes = [IsAdminOrReadOnly]

class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.all().order_by('-start_date')
    serializer_class = TermSerializer
    permission_classes = [IsAdminOrReadOnly]

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all().order_by('code')
    serializer_class = ProgramSerializer
    permission_classes = [IsAdminOrReadOnly]

class LevelViewSet(viewsets.ModelViewSet):
    queryset = Level.objects.all().order_by('code')
    serializer_class = LevelSerializer
    permission_classes = [IsAdminOrReadOnly]

class ProgressionRuleViewSet(viewsets.ModelViewSet):
    queryset = ProgressionRule.objects.all()
    serializer_class = ProgressionRuleSerializer
    permission_classes = [IsStaffOrReadOnly]

class GraduationRuleViewSet(viewsets.ModelViewSet):
    queryset = GraduationRule.objects.all()
    serializer_class = GraduationRuleSerializer
    permission_classes = [IsStaffOrReadOnly]

class CohortViewSet(viewsets.ModelViewSet):
    queryset = Cohort.objects.all().order_by('-start_date')
    serializer_class = CohortSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return Cohort.objects.filter(instructor=user).order_by('-start_date')
        return super().get_queryset()

class PromotionHistoryViewSet(viewsets.ModelViewSet):
    queryset = PromotionHistory.objects.all().order_by('-promotion_date')
    serializer_class = PromotionHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        promotion = serializer.save()
        from audits.models import log_action
        log_action(
            self.request.user,
            f"Promoted {promotion.student.admission_number} from {promotion.previous_level.code} to {promotion.new_level.code}",
            self.request
        )
        from notifications.services import NotificationService
        NotificationService.notify_user(
            user=promotion.student.user,
            title="Level Promotion",
            message=f"Congratulations! You have been promoted to Level {promotion.new_level.code}.",
            send_email=True
        )

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return PromotionHistory.objects.filter(student__user=user).order_by('-promotion_date')
        return super().get_queryset()

class CareerPathwayViewSet(viewsets.ModelViewSet):
    queryset = CareerPathway.objects.all()
    serializer_class = CareerPathwaySerializer
    permission_classes = [IsAdminOrReadOnly]

class AdvisorViewSet(viewsets.ModelViewSet):
    queryset = Advisor.objects.all()
    serializer_class = AdvisorSerializer
    permission_classes = [IsAdminOrReadOnly]

class IntakeViewSet(viewsets.ModelViewSet):
    queryset = Intake.objects.all().order_by('-start_date')
    serializer_class = IntakeSerializer
    permission_classes = [IsAdminOrReadOnly]

class ExternalExamViewSet(viewsets.ModelViewSet):
    queryset = ExternalExam.objects.all()
    serializer_class = ExternalExamSerializer
    permission_classes = [IsStaffOrReadOnly]

class ExternalExamRegistrationViewSet(viewsets.ModelViewSet):
    queryset = ExternalExamRegistration.objects.all().order_by('-exam_date')
    serializer_class = ExternalExamRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

class TimetableEventViewSet(viewsets.ModelViewSet):
    queryset = TimetableEvent.objects.all().order_by('date', 'start_time')
    serializer_class = TimetableEventSerializer
    permission_classes = [IsStaffOrReadOnly]

class VirtualClassViewSet(viewsets.ModelViewSet):
    queryset = VirtualClass.objects.all().order_by('-date')
    serializer_class = VirtualClassSerializer
    permission_classes = [IsStaffOrReadOnly]

class LearningResourceViewSet(viewsets.ModelViewSet):
    queryset = LearningResource.objects.all().order_by('-uploaded_at')
    serializer_class = LearningResourceSerializer
    permission_classes = [IsStaffOrReadOnly]

class StudentTimelineEventViewSet(viewsets.ModelViewSet):
    queryset = StudentTimelineEvent.objects.all().order_by('-created_at')
    serializer_class = StudentTimelineEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return StudentTimelineEvent.objects.filter(student__user=user).order_by('-created_at')
        student_id = self.request.query_params.get('student_id')
        if student_id:
            return StudentTimelineEvent.objects.filter(student_id=student_id).order_by('-created_at')
        return super().get_queryset()

class AdvisingSessionViewSet(viewsets.ModelViewSet):
    queryset = AdvisingSession.objects.all().order_by('-date')
    serializer_class = AdvisingSessionSerializer
    permission_classes = [IsStaffUser]
