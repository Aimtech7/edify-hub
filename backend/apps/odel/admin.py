from django.contrib import admin
from .models import (
    Course, Subject, Unit, Module, Lesson, Topic, Resource,
    StudentLessonProgress, RecordedLecture, DiscussionForum, ForumThread,
    ForumPost, Assignment, AssignmentSubmission, QuestionBank, Quiz,
    QuizQuestion, QuizAttempt, Gradebook
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
