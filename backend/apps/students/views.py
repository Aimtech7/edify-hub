from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from students.models import Student, PlacementTest
from students.serializers import StudentSerializer, PlacementTestSerializer
from accounts.permissions import IsAdminUser, IsTeacher, IsAccountant

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().order_by('admission_number')
    serializer_class = StudentSerializer

    def perform_create(self, serializer):
        student = serializer.save()
        from audits.models import log_action
        log_action(
            self.request.user,
            f"Created student profile for {student.first_name} {student.last_name} ({student.admission_number})",
            self.request
        )

    def perform_update(self, serializer):
        student = serializer.save()
        from audits.models import log_action
        log_action(
            self.request.user,
            f"Updated student profile for {student.first_name} {student.last_name} ({student.admission_number})",
            self.request
        )

    def perform_destroy(self, instance):
        admission = instance.admission_number
        name = f"{instance.first_name} {instance.last_name}"
        instance.delete()
        from audits.models import log_action
        log_action(
            self.request.user,
            f"Deleted student profile for {name} ({admission})",
            self.request
        )

    def get_permissions(self):
        # Admins, Accountants, and Teachers can access student list/CRUD
        # Students can access their own profile detail view
        if self.action in ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            # Students can only retrieve/view their own student profile
            return Student.objects.filter(user=user)
            
        # Admin, Accountant, Teacher can see list & apply filters
        queryset = Student.objects.all().order_by('admission_number')
        
        # Apply filters
        level = self.request.query_params.get('level')
        cohort = self.request.query_params.get('cohort')
        search = self.request.query_params.get('search')
        
        if level:
            queryset = queryset.filter(current_level__id=level)
        if cohort:
            queryset = queryset.filter(current_cohort__id=cohort)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(admission_number__icontains=search) |
                Q(email__icontains=search)
            )
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Helper endpoint returning the active user's student profile details.
        """
        try:
            student = Student.objects.get(user=request.user)
            serializer = self.get_serializer(student)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found for this user."}, status=status.HTTP_404_NOT_FOUND)

class PlacementTestViewSet(viewsets.ModelViewSet):
    queryset = PlacementTest.objects.all().order_by('-date_taken')
    serializer_class = PlacementTestSerializer

    def get_permissions(self):
        # Placement test creation/management restricted to Teachers and Admins
        return [IsTeacher()]

    def get_queryset(self):
        # Admin can see all, Teachers can see all
        # Students shouldn't call this directly but if they do, filter to their own
        user = self.request.user
        if user.role == 'STUDENT':
            return PlacementTest.objects.filter(student__user=user)
        return super().get_queryset()
