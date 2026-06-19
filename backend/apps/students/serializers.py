from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from students.models import Student, PlacementTest, AdmissionApplication
from academics.serializers import LevelSerializer, CohortSerializer

User = get_user_model()

class StudentSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    current_level_details = LevelSerializer(source='current_level', read_only=True)
    current_cohort_details = CohortSerializer(source='current_cohort', read_only=True)

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ('user',)

    def create(self, validated_data):
        password = validated_data.pop('password', 'HorizonLMS2026')  # Default fallback password
        admission_number = validated_data.get('admission_number')
        
        if not admission_number:
            # Generate new admission number based on existing
            # Format: PREFIX YEAR/ID (e.g. CGHQ 2025/1)
            import datetime
            current_year = datetime.date.today().year
            prefix = f"CGHQ {current_year}/"
            
            last_student = Student.objects.filter(admission_number__startswith=prefix).order_by('id').last()
            next_id = 1
            if last_student and last_student.admission_number:
                parts = last_student.admission_number.split('/')
                if len(parts) == 2:
                    try:
                        next_id = int(parts[1]) + 1
                    except ValueError:
                        pass
            
            admission_number = f"{prefix}{next_id}"
            validated_data['admission_number'] = admission_number

        email = validated_data.get('email')
        
        with transaction.atomic():
            # Create matching user account
            user = User.objects.create_user(
                username=admission_number,
                password=password,
                email=email,
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                role=User.Role.STUDENT
            )
            
            # Create student profile linking back to the user
            student = Student.objects.create(user=user, **validated_data)
            
            # Auto-approve application if created via student endpoint
            if 'application' in self.context:
                app = self.context['application']
                app.status = AdmissionApplication.Status.APPROVED
                app.student_profile = student
                app.save()
                
            return student

    def update(self, instance, validated_data):
        user = instance.user
        user.first_name = validated_data.get('first_name', user.first_name)
        user.last_name = validated_data.get('last_name', user.last_name)
        user.email = validated_data.get('email', user.email)
        user.save()
        
        return super().update(instance, validated_data)

class PlacementTestSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    recommended_level_code = serializers.ReadOnlyField(source='recommended_level.code')
    examiner_name = serializers.SerializerMethodField()

    class Meta:
        model = PlacementTest
        fields = '__all__'

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_examiner_name(self, obj):
        if obj.examiner:
            return f"{obj.examiner.first_name} {obj.examiner.last_name}".strip() or obj.examiner.username
        return None

class AdmissionApplicationSerializer(serializers.ModelSerializer):
    campus_name = serializers.ReadOnlyField(source='campus.name')
    recommended_level_code = serializers.ReadOnlyField(source='recommended_level.code')

    class Meta:
        model = AdmissionApplication
        fields = '__all__'
        read_only_fields = ('student_profile', 'status')
