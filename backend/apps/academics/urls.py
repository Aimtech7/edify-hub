from django.urls import path, include
from rest_framework.routers import DefaultRouter
from academics.views import (
    CampusViewSet, AcademicYearViewSet, SemesterViewSet, TermViewSet,
    DepartmentViewSet, ProgramViewSet, LevelViewSet, ProgressionRuleViewSet,
    GraduationRuleViewSet, CohortViewSet, PromotionHistoryViewSet,
    CareerPathwayViewSet, AdvisorViewSet, IntakeViewSet, ExternalExamViewSet,
    ExternalExamRegistrationViewSet, TimetableEventViewSet, VirtualClassViewSet,
    LearningResourceViewSet, StudentTimelineEventViewSet, AdvisingSessionViewSet
)

router = DefaultRouter()
router.register('campuses', CampusViewSet, basename='campus')
router.register('academic-years', AcademicYearViewSet, basename='academic-year')
router.register('semesters', SemesterViewSet, basename='semester')
router.register('terms', TermViewSet, basename='term')
router.register('departments', DepartmentViewSet, basename='department')
router.register('programs', ProgramViewSet, basename='program')
router.register('levels', LevelViewSet, basename='level')
router.register('progression-rules', ProgressionRuleViewSet, basename='progression-rule')
router.register('graduation-rules', GraduationRuleViewSet, basename='graduation-rule')
router.register('cohorts', CohortViewSet, basename='cohort')
router.register('promotions', PromotionHistoryViewSet, basename='promotion')
router.register('career-pathways', CareerPathwayViewSet, basename='career-pathway')
router.register('advisors', AdvisorViewSet, basename='advisor')
router.register('intakes', IntakeViewSet, basename='intake')
router.register('external-exams', ExternalExamViewSet, basename='external-exam')
router.register('external-exam-registrations', ExternalExamRegistrationViewSet, basename='external-exam-registration')
router.register('timetable', TimetableEventViewSet, basename='timetable')
router.register('virtual-classes', VirtualClassViewSet, basename='virtual-class')
router.register('resources', LearningResourceViewSet, basename='resource')
router.register('timeline-events', StudentTimelineEventViewSet, basename='timeline-event')
router.register('advising-sessions', AdvisingSessionViewSet, basename='advising-session')

urlpatterns = [
    path('', include(router.urls)),
]
