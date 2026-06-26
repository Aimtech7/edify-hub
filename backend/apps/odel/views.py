from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from odel.models import (
    Course, Subject, Unit, Module, Lesson, Topic, Resource, StudentLessonProgress,
    RecordedLecture, DiscussionForum, ForumThread, ForumPost, Assignment,
    AssignmentSubmission, QuestionBank, Quiz, QuizQuestion, QuizAttempt, Gradebook
)
from odel.serializers import (
    CourseSerializer, SubjectSerializer, UnitSerializer, ModuleSerializer,
    LessonSerializer, TopicSerializer, ResourceSerializer, StudentLessonProgressSerializer,
    RecordedLectureSerializer, DiscussionForumSerializer, ForumThreadSerializer,
    ForumPostSerializer, AssignmentSerializer, AssignmentSubmissionSerializer,
    QuestionBankSerializer, QuizSerializer, QuizQuestionSerializer, QuizAttemptSerializer,
    GradebookSerializer
)
from accounts.permissions import IsStaffOrReadOnly

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by('-created_at')
    serializer_class = CourseSerializer
    permission_classes = [IsStaffOrReadOnly]

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        course = self.get_object()
        if request.user.role != 'STUDENT':
            return Response({'progress_percentage': 100.0, 'completed_lessons': 0, 'total_lessons': 0})
        total_lessons = Lesson.objects.filter(module__unit__subject__course=course).count() + Lesson.objects.filter(module__course=course).count()
        if total_lessons == 0:
            return Response({'progress_percentage': 0.0, 'completed_lessons': 0, 'total_lessons': 0})
        completed = StudentLessonProgress.objects.filter(
            student__user=request.user,
            lesson__module__unit__subject__course=course,
            is_completed=True
        ).count() + StudentLessonProgress.objects.filter(
            student__user=request.user,
            lesson__module__course=course,
            is_completed=True
        ).count()
        pct = round((completed / total_lessons) * 100, 2)
        return Response({
            'progress_percentage': pct,
            'completed_lessons': completed,
            'total_lessons': total_lessons
        })

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsStaffOrReadOnly]

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsStaffOrReadOnly]

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsStaffOrReadOnly]

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all().order_by('order')
    serializer_class = LessonSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_permissions(self):
        if self.action == 'record_progress':
            return [permissions.IsAuthenticated()]
        return [IsStaffOrReadOnly()]

    @action(detail=True, methods=['post'], url_path='record-progress')
    def record_progress(self, request, pk=None):
        lesson = self.get_object()
        if request.user.role != 'STUDENT':
            return Response({'status': 'ignored_for_staff'})
        student = getattr(request.user, 'student_profile', None)
        if not student:
            from students.models import Student
            student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

        time_spent = int(request.data.get('time_spent_seconds', 10))
        is_done = request.data.get('is_completed', False)
        if isinstance(is_done, str):
            is_done = is_done.lower() in ('true', '1', 'yes')

        prog, _ = StudentLessonProgress.objects.get_or_create(student=student, lesson=lesson)
        prog.time_spent_seconds += time_spent
        if is_done and not prog.is_completed:
            prog.is_completed = True
            prog.completed_at = timezone.now()
            prog.progress_percentage = 100.0
        elif not prog.is_completed:
            if lesson.duration_seconds > 0:
                prog.progress_percentage = min(99.0, round((prog.time_spent_seconds / lesson.duration_seconds) * 100, 1))
        prog.save()
        return Response(StudentLessonProgressSerializer(prog).data)

class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsStaffOrReadOnly]

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsStaffOrReadOnly]

class RecordedLectureViewSet(viewsets.ModelViewSet):
    queryset = RecordedLecture.objects.all()
    serializer_class = RecordedLectureSerializer
    permission_classes = [IsStaffOrReadOnly]

class DiscussionForumViewSet(viewsets.ModelViewSet):
    queryset = DiscussionForum.objects.all()
    serializer_class = DiscussionForumSerializer
    permission_classes = [permissions.IsAuthenticated]

class ForumThreadViewSet(viewsets.ModelViewSet):
    queryset = ForumThread.objects.all()
    serializer_class = ForumThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class ForumPostViewSet(viewsets.ModelViewSet):
    queryset = ForumPost.objects.all()
    serializer_class = ForumPostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsStaffOrReadOnly]

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        student = getattr(self.request.user, 'student_profile', None)
        if not student:
            from students.models import Student
            student = Student.objects.filter(user=self.request.user).first()
        serializer.save(student=student)

class QuestionBankViewSet(viewsets.ModelViewSet):
    queryset = QuestionBank.objects.all()
    serializer_class = QuestionBankSerializer
    permission_classes = [IsStaffOrReadOnly]

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsStaffOrReadOnly]

class QuizQuestionViewSet(viewsets.ModelViewSet):
    queryset = QuizQuestion.objects.all()
    serializer_class = QuizQuestionSerializer
    permission_classes = [IsStaffOrReadOnly]

class QuizAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        student = getattr(self.request.user, 'student_profile', None)
        if not student:
            from students.models import Student
            student = Student.objects.filter(user=self.request.user).first()
        serializer.save(student=student)

class GradebookViewSet(viewsets.ModelViewSet):
    queryset = Gradebook.objects.all()
    serializer_class = GradebookSerializer
    permission_classes = [IsStaffOrReadOnly]
