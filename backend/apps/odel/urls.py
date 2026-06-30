from django.urls import path, include
from rest_framework.routers import DefaultRouter
from odel.views import (
    CourseViewSet, SubjectViewSet, UnitViewSet, ModuleViewSet, LessonViewSet,
    TopicViewSet, ResourceViewSet, RecordedLectureViewSet, DiscussionForumViewSet,
    ForumThreadViewSet, ForumPostViewSet, AssignmentViewSet, AssignmentSubmissionViewSet,
    QuestionBankViewSet, QuizViewSet, QuizQuestionViewSet, QuizAttemptViewSet, GradebookViewSet,
    OfficialExaminationViewSet, ExamSessionLogViewSet, ExamSubmissionViewSet,
    GermanTeachingViewSet, StudentLessonNoteViewSet
)

router = DefaultRouter()
router.register('german', GermanTeachingViewSet, basename='odel-german')
router.register('courses', CourseViewSet, basename='odel-course')
router.register('subjects', SubjectViewSet, basename='odel-subject')
router.register('units', UnitViewSet, basename='odel-unit')
router.register('modules', ModuleViewSet, basename='odel-module')
router.register('lessons', LessonViewSet, basename='odel-lesson')
router.register('lesson-notes', StudentLessonNoteViewSet, basename='odel-lesson-note')
router.register('topics', TopicViewSet, basename='odel-topic')
router.register('resources', ResourceViewSet, basename='odel-resource')
router.register('recorded-lectures', RecordedLectureViewSet, basename='odel-recording')
router.register('forums', DiscussionForumViewSet, basename='odel-forum')
router.register('threads', ForumThreadViewSet, basename='odel-thread')
router.register('posts', ForumPostViewSet, basename='odel-post')
router.register('assignments', AssignmentViewSet, basename='odel-assignment')
router.register('submissions', AssignmentSubmissionViewSet, basename='odel-submission')
router.register('question-banks', QuestionBankViewSet, basename='odel-bank')
router.register('quizzes', QuizViewSet, basename='odel-quiz')
router.register('quiz-questions', QuizQuestionViewSet, basename='odel-quiz-question')
router.register('quiz-attempts', QuizAttemptViewSet, basename='odel-quiz-attempt')
router.register('gradebooks', GradebookViewSet, basename='odel-gradebook')
router.register('formal-exams', OfficialExaminationViewSet, basename='odel-formal-exam')
router.register('formal-sessions', ExamSessionLogViewSet, basename='odel-formal-session')
router.register('formal-submissions', ExamSubmissionViewSet, basename='odel-formal-submission')

urlpatterns = [
    path('', include(router.urls)),
]
