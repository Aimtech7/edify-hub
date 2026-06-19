from django.contrib import admin

# Register your models here.

from .models import CareerPathway, Advisor, Intake, ExternalExam, ExternalExamRegistration, TimetableEvent, VirtualClass, LearningResource

@admin.register(CareerPathway)
class CareerPathwayAdmin(admin.ModelAdmin):
    pass

@admin.register(Advisor)
class AdvisorAdmin(admin.ModelAdmin):
    pass

@admin.register(Intake)
class IntakeAdmin(admin.ModelAdmin):
    pass

@admin.register(ExternalExam)
class ExternalExamAdmin(admin.ModelAdmin):
    pass

@admin.register(ExternalExamRegistration)
class ExternalExamRegistrationAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam', 'exam_date', 'status')

@admin.register(TimetableEvent)
class TimetableEventAdmin(admin.ModelAdmin):
    list_display = ('cohort', 'subject', 'teacher', 'date', 'start_time')

@admin.register(VirtualClass)
class VirtualClassAdmin(admin.ModelAdmin):
    list_display = ('cohort', 'teacher', 'platform', 'date')

@admin.register(LearningResource)
class LearningResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'level', 'resource_type')
