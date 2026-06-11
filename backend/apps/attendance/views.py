from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from attendance.models import Attendance
from students.models import Student
from academics.models import Cohort
from attendance.serializers import AttendanceSerializer, BulkMarkAttendanceSerializer
from accounts.permissions import IsTeacher

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('-date')
    serializer_class = AttendanceSerializer

    def get_permissions(self):
        # View/mark attendance requires authentication
        # Marking/deleting/modifying requires Teacher or Admin
        if self.action in ['list', 'retrieve', 'my_history']:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            # Students can only view their own attendance history
            return Attendance.objects.filter(student__user=user).order_by('-date')
            
        # Teachers and Admins can see all records and apply filters
        queryset = Attendance.objects.all().order_by('-date')
        cohort_id = self.request.query_params.get('cohort')
        student_id = self.request.query_params.get('student')
        date = self.request.query_params.get('date')
        
        if cohort_id:
            queryset = queryset.filter(cohort_id=cohort_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if date:
            queryset = queryset.filter(date=date)
            
        return queryset

    @action(detail=False, methods=['post'], serializer_class=BulkMarkAttendanceSerializer)
    def mark(self, request):
        """
        Record or update attendance records for a batch of students in a cohort on a given date.
        """
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        cohort_id = serializer.validated_data['cohort_id']
        date = serializer.validated_data['date']
        records = serializer.validated_data['records']
        
        try:
            cohort = Cohort.objects.get(id=cohort_id)
        except Cohort.DoesNotExist:
            return Response({"cohort_id": ["Cohort not found."]}, status=status.HTTP_404_NOT_FOUND)
            
        created_count = 0
        updated_count = 0
        
        for record in records:
            student_id = record['student_id']
            state = record['status']
            
            try:
                student = Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                continue
                
            attendance_obj, created = Attendance.objects.update_or_create(
                student=student,
                cohort=cohort,
                date=date,
                defaults={
                    'status': state,
                    'recorded_by': request.user
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        return Response({
            "message": f"Successfully marked attendance. Created {created_count}, updated {updated_count} records."
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def report(self, request):
        """
        Generate attendance statistics for a specific student or cohort.
        """
        student_id = request.query_params.get('student')
        cohort_id = request.query_params.get('cohort')
        
        query = Q()
        if student_id:
            query &= Q(student_id=student_id)
        if cohort_id:
            query &= Q(cohort_id=cohort_id)
            
        if not student_id and not cohort_id:
            # If student is a student, report for themselves
            if request.user.role == 'STUDENT':
                query &= Q(student__user=request.user)
            else:
                return Response(
                    {"detail": "Please specify a student or cohort query parameter."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        records = Attendance.objects.filter(query)
        total = records.count()
        if total == 0:
            return Response({
                "total_days": 0,
                "present_days": 0,
                "absent_days": 0,
                "late_days": 0,
                "attendance_rate": 0.0
            })
            
        present = records.filter(status=Attendance.Status.PRESENT).count()
        absent = records.filter(status=Attendance.Status.ABSENT).count()
        late = records.filter(status=Attendance.Status.LATE).count()
        
        # Present and Late count as attended/present in rate calculations
        attendance_rate = ((present + late) / total) * 100
        
        return Response({
            "total_days": total,
            "present_days": present,
            "absent_days": absent,
            "late_days": late,
            "attendance_rate": round(attendance_rate, 2)
        }, status=status.HTTP_200_OK)
