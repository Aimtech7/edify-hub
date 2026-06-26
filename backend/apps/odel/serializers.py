from rest_framework import serializers
from odel.models import (
    Course, Subject, Unit, Module, Lesson, Topic, Resource, StudentLessonProgress,
    RecordedLecture, DiscussionForum, ForumThread, ForumPost, Assignment,
    AssignmentSubmission, QuestionBank, Quiz, QuizQuestion, QuizAttempt, Gradebook
)

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = '__all__'

class LessonSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)
    resources = ResourceSerializer(many=True, read_only=True)
    is_unlocked = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = '__all__'

    def get_is_unlocked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if request.user.role != 'STUDENT':
            return True # Staff can view any lesson
        if not obj.prerequisite:
            return True
        prog = StudentLessonProgress.objects.filter(student__user=request.user, lesson=obj.prerequisite, is_completed=True).exists()
        return prog

class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    class Meta:
        model = Module
        fields = '__all__'

class UnitSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    class Meta:
        model = Unit
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True)
    class Meta:
        model = Subject
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    direct_modules = ModuleSerializer(many=True, read_only=True)
    class Meta:
        model = Course
        fields = '__all__'

class StudentLessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentLessonProgress
        fields = '__all__'

class RecordedLectureSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecordedLecture
        fields = '__all__'

class ForumPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = ForumPost
        fields = '__all__'
        read_only_fields = ['author', 'likes_count', 'created_at']

    def get_replies(self, obj):
        return ForumPostSerializer(obj.replies.all(), many=True).data

class ForumThreadSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    posts = ForumPostSerializer(many=True, read_only=True)

    class Meta:
        model = ForumThread
        fields = '__all__'
        read_only_fields = ['author', 'likes_count', 'created_at']

class DiscussionForumSerializer(serializers.ModelSerializer):
    threads = ForumThreadSerializer(many=True, read_only=True)

    class Meta:
        model = DiscussionForum
        fields = '__all__'

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.admission_number', read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = '__all__'
        read_only_fields = ['student', 'submitted_at', 'status', 'marks_obtained', 'teacher_feedback', 'graded_by', 'graded_at']

class AssignmentSerializer(serializers.ModelSerializer):
    submissions = AssignmentSubmissionSerializer(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = '__all__'

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = '__all__'

class QuizAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.admission_number', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = '__all__'
        read_only_fields = ['student', 'started_at', 'completed_at']

class QuestionBankSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = QuestionBank
        fields = '__all__'

class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = '__all__'

class GradebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gradebook
        fields = '__all__'
