from rest_framework import serializers
from odel.models import (
    Course, Subject, Unit, Module, Lesson, Topic, Resource, StudentLessonProgress,
    RecordedLecture, DiscussionForum, ForumThread, ForumPost, Assignment,
    AssignmentSubmission, QuestionBank, Quiz, QuizQuestion, QuizAttempt, Gradebook,
    OfficialExamination, ExamSessionLog, ExamSubmission, StudentLessonNote
)

class StudentLessonNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentLessonNote
        fields = '__all__'
        read_only_fields = ['student', 'created_at', 'updated_at']

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


class ExamSessionLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True, default='')
    admission_number = serializers.CharField(source='student.admission_number', read_only=True, default='')

    class Meta:
        model = ExamSessionLog
        fields = '__all__'


class ExamSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    admission_number = serializers.CharField(source='student.admission_number', read_only=True, default='')
    exam_title = serializers.CharField(source='examination.title', read_only=True, default='')
    exam_code = serializers.CharField(source='examination.exam_code', read_only=True, default='')
    moderated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ExamSubmission
        fields = '__all__'
        read_only_fields = ['receipt_number', 'submitted_at', 'graded_by', 'graded_at', 'published_at', 'moderated_by', 'moderated_at']

    def get_student_name(self, obj):
        if obj.student and hasattr(obj.student, 'user') and obj.student.user:
            return f"{obj.student.user.first_name} {obj.student.user.last_name}".strip() or obj.student.user.username
        return obj.student.admission_number if obj.student else "Unknown"

    def get_moderated_by_name(self, obj):
        if obj.moderated_by:
            return f"{obj.moderated_by.first_name} {obj.moderated_by.last_name}".strip() or obj.moderated_by.username
        return ""


class OfficialExaminationSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.title', read_only=True, default='')
    level_code = serializers.CharField(source='level.code', read_only=True, default='')
    created_by_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    submissions_count = serializers.SerializerMethodField()
    user_submission = serializers.SerializerMethodField()
    active_session = serializers.SerializerMethodField()

    class Meta:
        model = OfficialExamination
        fields = '__all__'

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return "Examination Board"

    def get_teacher_name(self, obj):
        if obj.teacher:
            return f"{obj.teacher.first_name} {obj.teacher.last_name}".strip() or obj.teacher.username
        return self.get_created_by_name(obj)

    def get_submissions_count(self, obj):
        return obj.submissions.count()

    def get_user_submission(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        from students.models import Student
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return None
        sub = obj.submissions.filter(student=student).order_by('-submitted_at').first()
        if sub:
            return ExamSubmissionSerializer(sub).data
        return None

    def get_active_session(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        from students.models import Student
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return None
        sess = obj.session_logs.filter(student=student).order_by('-started_at').first()
        if sess:
            return ExamSessionLogSerializer(sess).data
        return None

