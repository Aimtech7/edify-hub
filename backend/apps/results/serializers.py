from rest_framework import serializers
from results.models import Result

class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    admission_no = serializers.ReadOnlyField(source='student.admission_number')
    level_code = serializers.ReadOnlyField(source='level.code')

    class Meta:
        model = Result
        fields = '__all__'
        read_only_fields = ('average_score', 'grade')

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()
