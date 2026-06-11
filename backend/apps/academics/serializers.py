from rest_framework import serializers
from academics.models import Level, Cohort, PromotionHistory

class LevelSerializer(serializers.ModelSerializer):
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
    student_name = serializers.ReadOnlyField(source='student.user.first_name') # we will fetch student detail
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
