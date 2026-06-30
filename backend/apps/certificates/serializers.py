from rest_framework import serializers
from certificates.models import Certificate, CertificateTemplate

class CertificateTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateTemplate
        fields = '__all__'

class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    admission_no = serializers.ReadOnlyField(source='student.admission_number')
    level_name = serializers.ReadOnlyField(source='level.name')
    level_code = serializers.ReadOnlyField(source='level.code')
    issued_by_name = serializers.SerializerMethodField()
    template_title = serializers.ReadOnlyField(source='template.title')
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = '__all__'

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_issued_by_name(self, obj):
        if obj.issued_by:
            return f"{obj.issued_by.first_name} {obj.issued_by.last_name}".strip() or obj.issued_by.username
        return None

    def get_pdf_url(self, obj):
        if obj.pdf_file and hasattr(obj.pdf_file, 'url'):
            return obj.pdf_file.url
        return None

class CertificateVerifySerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    admission_no = serializers.ReadOnlyField(source='student.admission_number')
    level_name = serializers.ReadOnlyField(source='level.name')
    level_code = serializers.ReadOnlyField(source='level.code')
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = (
            'certificate_number',
            'verification_code',
            'student_name',
            'admission_no',
            'level_name',
            'level_code',
            'certificate_type',
            'issue_date',
            'status',
            'status_label',
            'revocation_reason',
            'revoked_at'
        )

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_status_label(self, obj):
        if obj.status == Certificate.Status.REVOKED:
            return "REVOKED / INVALID"
        return "VERIFIED / VALID"
