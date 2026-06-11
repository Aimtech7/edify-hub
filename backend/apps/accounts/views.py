from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User
from accounts.serializers import (
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
    ResetPasswordSerializer,
    UserSerializer
)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            from audits.models import log_action
            from accounts.models import User
            username = request.data.get('username')
            try:
                user = User.objects.get(username=username)
                log_action(user, f"Login successful: {user.username} ({user.get_role_display()})", request)
            except User.DoesNotExist:
                pass
        return response

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception:
            # Simple fallback if blacklist is not enabled/supported
            return Response({"message": "Successfully logged out (session cleared)."}, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        user_data = serializer.data
        
        # Format matching frontend AuthUser format
        name = f"{user.first_name} {user.last_name}".strip() or user.username
        formatted_data = {
            'id': str(user.id),
            'name': name,
            'username': user.username,
            'role': user.role.lower(),
            'email': user.email,
        }
        
        if user.role == User.Role.STUDENT and hasattr(user, 'student_profile'):
            profile = user.student_profile
            formatted_data['admissionNo'] = profile.admission_number
            formatted_data['level'] = profile.current_level.code if profile.current_level else None
            formatted_data['classroom'] = profile.current_cohort.name if profile.current_cohort else None
            
        return Response(formatted_data, status=status.HTTP_200_OK)

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            from audits.models import log_action
            log_action(user, "User changed password successfully", request)
            return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = User.objects.get(username=serializer.validated_data['username'])
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                from audits.models import log_action
                log_action(user, "User password reset successfully", request)
                return Response({"message": "Password reset successfully. You can now log in."}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"username": ["User not found."]}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
