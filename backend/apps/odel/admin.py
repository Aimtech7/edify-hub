from django.contrib import admin
from .models import (
    Course, Subject, Unit, Module, Lesson, Topic, Resource,
    StudentLessonProgress, RecordedLecture, DiscussionForum, ForumThread,
    ForumPost, Assignment, AssignmentSubmission, QuestionBank, Quiz,
    QuizQuestion, QuizAttempt, Gradebook,
    OfficialExamination, ExamSessionLog, ExamSubmission
)

for model in [
    Course, Subject, Unit, Module, Lesson, Topic, Resource,
    StudentLessonProgress, RecordedLecture, DiscussionForum, ForumThread,
    ForumPost, Assignment, AssignmentSubmission, QuestionBank, Quiz,
    QuizQuestion, QuizAttempt, Gradebook
]:
    @admin.register(model)
    class GenericOdelAdmin(admin.ModelAdmin):
        list_display = [f.name for f in model._meta.fields[:6]]


@admin.register(OfficialExamination)
class OfficialExaminationAdmin(admin.ModelAdmin):
    list_display = ('title', 'exam_code', 'level', 'duration_minutes', 'publish_status', 'start_datetime')
    list_filter = ('publish_status', 'level', 'exam_type')
    search_fields = ('title', 'exam_code')
    date_hierarchy = 'start_datetime'


@admin.register(ExamSessionLog)
class ExamSessionLogAdmin(admin.ModelAdmin):
    list_display = ('examination', 'student', 'started_at', 'focus_change_count', 'flagged_for_review')
    list_filter = ('flagged_for_review', 'started_at')
    search_fields = ('student__admission_number', 'examination__exam_code')
    readonly_fields = ('started_at', 'opened_at', 'pdf_viewed_at', 'downloaded_at', 'submitted_at', 'ip_address', 'browser_info')


@admin.register(ExamSubmission)
class ExamSubmissionAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'examination', 'student', 'marking_status', 'marks_obtained', 'grade', 'submitted_at')
    list_filter = ('marking_status', 'is_late')
    search_fields = ('receipt_number', 'student__admission_number', 'examination__exam_code')
    readonly_fields = ('receipt_number', 'submitted_at')
    date_hierarchy = 'submitted_at'

