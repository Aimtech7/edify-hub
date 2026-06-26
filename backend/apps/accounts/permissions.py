from rest_framework.permissions import BasePermission, SAFE_METHODS
from accounts.models import User

STAFF_ROLES = [
    User.Role.TEACHER, User.Role.TUTOR, User.Role.REGISTRAR,
    User.Role.ACCOUNTANT, User.Role.FINANCE, User.Role.ADMISSIONS,
    User.Role.HR, User.Role.LIBRARY, User.Role.ICT, User.Role.ADMIN
]

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)

class IsStaffUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in STAFF_ROLES)

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)

class IsStaffOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.role in STAFF_ROLES)

class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [User.Role.TEACHER, User.Role.TUTOR, User.Role.ADMIN])

class IsAccountant(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [User.Role.ACCOUNTANT, User.Role.FINANCE, User.Role.ADMIN])

class IsRegistrar(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [User.Role.REGISTRAR, User.Role.ADMISSIONS, User.Role.ADMIN])

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [User.Role.STUDENT, User.Role.ADMIN])

class IsStudentSelfOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == User.Role.ADMIN:
            return True
        if request.user.role in STAFF_ROLES:
            return request.method in SAFE_METHODS
        if request.user.role == User.Role.STUDENT:
            if hasattr(obj, 'user'):
                return obj.user == request.user
            if hasattr(obj, 'student'):
                return obj.student.user == request.user
            return obj == request.user
        return False
