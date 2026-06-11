from rest_framework.permissions import BasePermission, SAFE_METHODS
from accounts.models import User

class IsAdminUser(BasePermission):
    """
    Allows access only to Admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN

class IsTeacher(BasePermission):
    """
    Allows access only to Teachers and Admins.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role == User.Role.TEACHER or request.user.role == User.Role.ADMIN
        )

class IsAccountant(BasePermission):
    """
    Allows access only to Accountants and Admins.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role == User.Role.ACCOUNTANT or request.user.role == User.Role.ADMIN
        )

class IsStudent(BasePermission):
    """
    Allows access only to Students (read-only for own data) or Admins.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role == User.Role.STUDENT or request.user.role == User.Role.ADMIN
        )

class IsStudentSelfOrReadOnly(BasePermission):
    """
    Allows students to read/edit their own data, or staff to read.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins have full access
        if request.user.role == User.Role.ADMIN:
            return True
            
        # Teachers and Accountants can view, but not edit (unless allowed by views)
        if request.user.role in (User.Role.TEACHER, User.Role.ACCOUNTANT):
            return request.method in SAFE_METHODS
            
        # Students can view/edit their own profile
        if request.user.role == User.Role.STUDENT:
            # Check if object is the student's own User or Student profile
            if hasattr(obj, 'user'):
                return obj.user == request.user
            return obj == request.user
            
        return False
