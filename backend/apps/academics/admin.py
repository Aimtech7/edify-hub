from django.contrib import admin
from .models import (
    Campus, AcademicYear, Semester, Term, Department, Program, Level, Cohort,
    PromotionHistory, CareerPathway, Advisor, Intake, ExternalExam,
    ExternalExamRegistration, TimetableEvent, VirtualClass, LearningResource,
    ProgressionRule, GraduationRule, StudentTimelineEvent, AdvisingSession
)

for model in [
    Campus, AcademicYear, Semester, Term, Department, Program, Level, Cohort,
    PromotionHistory, CareerPathway, Advisor, Intake, ExternalExam,
    ExternalExamRegistration, TimetableEvent, VirtualClass, LearningResource,
    ProgressionRule, GraduationRule, StudentTimelineEvent, AdvisingSession
]:
    @admin.register(model)
    class GenericAcadAdmin(admin.ModelAdmin):
        list_display = [f.name for f in model._meta.fields[:6]]
