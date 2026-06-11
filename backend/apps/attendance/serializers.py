from rest_framework import serializers
from attendance.models import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    admission_no = serializers.ReadOnlyField(source='student.admission_number')
    cohort_name = serializers.ReadOnlyField(source='cohort.name')
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = '__all__'

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return f"{obj.recorded_by.first_name} {obj.recorded_by.last_name}".strip() or obj.recorded_by.username
        return None

class AttendanceStatusSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=Attendance.Status.choices)

class BulkMarkAttendanceSerializer(serializers.Serializer):
    cohort_id = serializers.IntegerField()
    date = serializers.DateField()
    records = AttendanceStatusSerializer(many=True)
