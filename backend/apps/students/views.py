from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from students.models import Student, PlacementTest, AdmissionApplication
from students.serializers import StudentSerializer, PlacementTestSerializer, AdmissionApplicationSerializer
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
            return Student.objects.filter(user=user).order_by('admission_number')
        if user.role == 'PARENT':
            return Student.objects.filter(guardians__user=user).order_by('admission_number')
            
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

    @action(detail=False, methods=['get'], url_path='my-children', permission_classes=[permissions.IsAuthenticated])
    def my_children(self, request):
        """
        Helper endpoint returning summary details of children linked to the parent user.
        """
        from students.serializers import ParentChildSummarySerializer
        user = request.user
        if user.role == 'PARENT':
            children = Student.objects.filter(guardians__user=user).order_by('first_name')
        else:
            children = Student.objects.none()
        serializer = ParentChildSummarySerializer(children, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        student = self.get_object()
        
        timeline = []
        
        # Placement Tests
        for pt in student.placement_tests.all().order_by('date_taken'):
            timeline.append({
                "date": pt.date_taken,
                "type": "PLACEMENT_TEST",
                "details": f"Score: {pt.score}, Recommended Level: {pt.recommended_level.code}"
            })
            
        # Promotions
        for promo in student.promotions.all().order_by('promotion_date'):
            timeline.append({
                "date": promo.promotion_date,
                "type": "PROMOTION",
                "details": f"Promoted from {promo.previous_level.code} to {promo.new_level.code}. Remarks: {getattr(promo, 'remarks', '')}"
            })
            
        # Certificates
        for cert in student.certificates.all().order_by('issue_date'):
            timeline.append({
                "date": cert.issue_date,
                "type": "CERTIFICATE",
                "details": f"Obtained Certificate for Level {cert.level.code} (No: {cert.certificate_number})"
            })
            
        # Results
        for res in student.results.filter(is_published=True).order_by('created_at'):
            timeline.append({
                "date": res.created_at.date(),
                "type": "RESULT",
                "details": f"Completed Level {res.level.code} with Avg {res.average_score}% ({res.grade})"
            })
            
        # Sort all events by date
        timeline.sort(key=lambda x: x['date'])
        
        return Response(timeline, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def analytics(self, request):
        from django.db.models import Count
        
        # Academic Reports
        by_level = Student.objects.filter(status=Student.Status.ACTIVE).values('current_level__code').annotate(count=Count('id'))
        by_campus = Student.objects.filter(status=Student.Status.ACTIVE).values('campus__name').annotate(count=Count('id'))
        
        # Admissions & Marketing
        applications_total = AdmissionApplication.objects.count()
        applications_approved = AdmissionApplication.objects.filter(status='APPROVED').count()
        conversion_rate = (applications_approved / applications_total * 100) if applications_total > 0 else 0
        
        referrals = Student.objects.values('referral_source').annotate(count=Count('id'))
        pathways = Student.objects.values('career_pathway__name').annotate(count=Count('id'))

        return Response({
            "academic": {
                "students_by_level": by_level,
                "students_by_campus": by_campus
            },
            "admissions": {
                "total_applications": applications_total,
                "approved_applications": applications_approved,
                "conversion_rate_percentage": round(conversion_rate, 2),
                "referral_sources": referrals,
                "career_pathways": pathways
            }
        }, status=status.HTTP_200_OK)

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

class AdmissionApplicationViewSet(viewsets.ModelViewSet):
    queryset = AdmissionApplication.objects.all().order_by('-created_at')
    serializer_class = AdmissionApplicationSerializer
    
    def get_permissions(self):
        # Open to all for creation, restricted for viewing
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        app = serializer.save()
        from audits.models import log_action
        if self.request.user.is_authenticated:
            log_action(
                self.request.user,
                f"Created admission application for {app.first_name} {app.last_name}",
                self.request
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        app = self.get_object()
        
        if app.status == AdmissionApplication.Status.APPROVED:
            return Response({"detail": "Already approved."}, status=status.HTTP_400_BAD_REQUEST)
            
        if not app.documents_verified:
            return Response({"detail": "Documents must be verified before approval."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Approval converts application to student
        serializer = StudentSerializer(data={
            'first_name': app.first_name,
            'last_name': app.last_name,
            'email': app.email,
            'phone': app.phone,
            'current_level': app.recommended_level.id if app.recommended_level else None
        }, context={'application': app})
        
        if serializer.is_valid():
            serializer.save()
            from audits.models import log_action
            log_action(self.request.user, f"Approved admission for {app.first_name} {app.last_name}", request)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        from django.db.models import Count
        
        campus_stats = Student.objects.values('campus__name').annotate(count=Count('id'))
        level_stats = Student.objects.values('current_level__code').annotate(count=Count('id'))
        intake_stats = Student.objects.values('intake__name').annotate(count=Count('id'))
        pathway_stats = Student.objects.values('career_pathway__name').annotate(count=Count('id'))
        referral_stats = Student.objects.values('referral_source').annotate(count=Count('id'))

        return Response({
            'by_campus': campus_stats,
            'by_level': level_stats,
            'by_intake': intake_stats,
            'by_pathway': pathway_stats,
            'by_referral': referral_stats,
        })
