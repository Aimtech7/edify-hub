from rest_framework import serializers
from certificates.models import Certificate

class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    admission_no = serializers.ReadOnlyField(source='student.admission_number')
    level_name = serializers.ReadOnlyField(source='level.name')
    level_code = serializers.ReadOnlyField(source='level.code')
    issued_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = '__all__'

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_issued_by_name(self, obj):
        if obj.issued_by:
            return f"{obj.issued_by.first_name} {obj.issued_by.last_name}".strip() or obj.issued_by.username
        return None

class CertificateVerifySerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    admission_no = serializers.ReadOnlyField(source='student.admission_number')
    level_name = serializers.ReadOnlyField(source='level.name')
    level_code = serializers.ReadOnlyField(source='level.code')
    status = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = ('certificate_number', 'student_name', 'admission_no', 'level_name', 'level_code', 'issue_date', 'status')

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_status(self, obj):
        return "Verified / Valid"
