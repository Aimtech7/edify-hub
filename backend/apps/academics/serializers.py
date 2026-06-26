from rest_framework import serializers
from academics.models import (
    Campus, AcademicYear, Semester, Term, Department, Program,
    Level, Cohort, PromotionHistory, CareerPathway, Advisor,
    Intake, ExternalExam, ExternalExamRegistration, TimetableEvent,
    VirtualClass, LearningResource, ProgressionRule, GraduationRule,
    StudentTimelineEvent, AdvisingSession
)

class CampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campus
        fields = '__all__'

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'

class SemesterSerializer(serializers.ModelSerializer):
    academic_year_year = serializers.ReadOnlyField(source='academic_year.year')
    class Meta:
        model = Semester
        fields = '__all__'

class TermSerializer(serializers.ModelSerializer):
    semester_name = serializers.ReadOnlyField(source='semester.name')
    class Meta:
        model = Term
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    head_name = serializers.SerializerMethodField()
    class Meta:
        model = Department
        fields = '__all__'
    def get_head_name(self, obj):
        if obj.head:
            return f"{obj.head.first_name} {obj.head.last_name}".strip() or obj.head.username
        return None

class ProgramSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    class Meta:
        model = Program
        fields = '__all__'

class ProgressionRuleSerializer(serializers.ModelSerializer):
    level_code = serializers.ReadOnlyField(source='level.code')
    class Meta:
        model = ProgressionRule
        fields = '__all__'

class GraduationRuleSerializer(serializers.ModelSerializer):
    program_code = serializers.ReadOnlyField(source='program.code')
    required_level_code = serializers.ReadOnlyField(source='required_level.code')
    class Meta:
        model = GraduationRule
        fields = '__all__'

class LevelSerializer(serializers.ModelSerializer):
    progression_rule = ProgressionRuleSerializer(read_only=True)
    class Meta:
        model = Level
        fields = '__all__'

class CohortSerializer(serializers.ModelSerializer):
    level_code = serializers.ReadOnlyField(source='level.code')
    instructor_name = serializers.SerializerMethodField()

    class Meta:
        model = Cohort
        fields = '__all__'

    def get_instructor_name(self, obj):
        if obj.instructor:
            return f"{obj.instructor.first_name} {obj.instructor.last_name}".strip() or obj.instructor.username
        return None

class PromotionHistorySerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user.first_name')
    previous_level_code = serializers.ReadOnlyField(source='previous_level.code')
    new_level_code = serializers.ReadOnlyField(source='new_level.code')
    promoted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PromotionHistory
        fields = '__all__'

    def get_promoted_by_name(self, obj):
        if obj.promoted_by:
            return f"{obj.promoted_by.first_name} {obj.promoted_by.last_name}".strip() or obj.promoted_by.username
        return None

class CareerPathwaySerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerPathway
        fields = '__all__'

class AdvisorSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    class Meta:
        model = Advisor
        fields = '__all__'
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

class IntakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Intake
        fields = '__all__'

class ExternalExamSerializer(serializers.ModelSerializer):
    level_code = serializers.ReadOnlyField(source='level.code')
    class Meta:
        model = ExternalExam
        fields = '__all__'

class ExternalExamRegistrationSerializer(serializers.ModelSerializer):
    student_adm = serializers.ReadOnlyField(source='student.admission_number')
    exam_name = serializers.ReadOnlyField(source='exam.name')
    class Meta:
        model = ExternalExamRegistration
        fields = '__all__'

class TimetableEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimetableEvent
        fields = '__all__'

class VirtualClassSerializer(serializers.ModelSerializer):
    cohort_name = serializers.ReadOnlyField(source='cohort.name')
    class Meta:
        model = VirtualClass
        fields = '__all__'

class LearningResourceSerializer(serializers.ModelSerializer):
    level_code = serializers.ReadOnlyField(source='level.code')
    class Meta:
        model = LearningResource
        fields = '__all__'

class StudentTimelineEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    class Meta:
        model = StudentTimelineEvent
        fields = '__all__'
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return "System"

class AdvisingSessionSerializer(serializers.ModelSerializer):
    advisor_name = serializers.ReadOnlyField(source='advisor.user.username')
    class Meta:
        model = AdvisingSession
        fields = '__all__'
