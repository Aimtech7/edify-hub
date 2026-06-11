from rest_framework import serializers
from django.contrib.auth import get_user_model
from students.models import Student, PlacementTest
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
        email = validated_data.get('email')
        
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
