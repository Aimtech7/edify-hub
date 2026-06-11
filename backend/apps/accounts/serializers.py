from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from accounts.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'role')
        read_only_fields = ('id', 'role')

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        # Authenticates and gets base tokens (access and refresh)
        data = super().validate(attrs)
        
        # Build user profile details matching frontend AuthUser format
        name = f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
        user_data = {
            'id': str(self.user.id),
            'name': name,
            'username': self.user.username,
            'role': self.user.role.lower(),  # Frontend expects lowercase roles
            'email': self.user.email,
        }

        # Check if student and append profile fields
        if self.user.role == User.Role.STUDENT and hasattr(self.user, 'student_profile'):
            profile = self.user.student_profile
            user_data['admissionNo'] = profile.admission_number
            user_data['level'] = profile.current_level.code if profile.current_level else None
            user_data['classroom'] = profile.current_cohort.name if profile.current_cohort else None
            
        data['user'] = user_data
        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct.")
        return value

class ResetPasswordSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
