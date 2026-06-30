from io import BytesIO
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from certificates.models import Certificate, CertificateTemplate
from certificates.serializers import (
    CertificateSerializer,
    CertificateVerifySerializer,
    CertificateTemplateSerializer
)
from certificates.services.eligibility_service import CertificateEligibilityService
from certificates.services.generator_service import CertificateGeneratorService
from accounts.permissions import IsAdminUser
from students.models import Student
from academics.models import Level

class CertificateTemplateViewSet(viewsets.ModelViewSet):
    queryset = CertificateTemplate.objects.all().order_by('-is_active', '-created_at')
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        template = self.get_object()
        template.is_active = True
        template.save(update_fields=['is_active'])
        from audits.models import log_action
        log_action(request.user, f"Activated certificate template: {template.title}", request)
        return Response({"detail": "Template activated successfully.", "is_active": True})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        template = self.get_object()
        template.is_active = False
        template.save(update_fields=['is_active'])
        from audits.models import log_action
        log_action(request.user, f"Deactivated certificate template: {template.title}", request)
        return Response({"detail": "Template deactivated successfully.", "is_active": False})


class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all().order_by('-issue_date')
    serializer_class = CertificateSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'download']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    @action(detail=False, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticated])
    def check_eligibility(self, request):
        data = request.data if request.method == 'POST' else request.query_params
        student_id = data.get('student_id') or data.get('student')
        level_id = data.get('level_id') or data.get('level')
        cert_type = data.get('certificate_type', 'CEFR_LEVEL')

        if not student_id or not level_id:
            return Response(
                {"detail": "Both student_id and level_id are required to run eligibility check."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            level = Level.objects.get(pk=level_id)
        except Level.DoesNotExist:
            return Response({"detail": "Level not found."}, status=status.HTTP_404_NOT_FOUND)

        result = CertificateEligibilityService.check_eligibility(student, level, cert_type)
        return Response(result, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        student = serializer.validated_data.get('student')
        level = serializer.validated_data.get('level')
        cert_type = serializer.validated_data.get('certificate_type', 'CEFR_LEVEL')
        override = self.request.data.get('override_eligibility', False)

        if not override:
            eligibility = CertificateEligibilityService.check_eligibility(student, level, cert_type)
            if not eligibility['eligible']:
                from audits.models import log_action
                log_action(
                    self.request.user,
                    f"Blocked certificate issuance to {student.admission_number} due to failed eligibility: {eligibility['reasons']}",
                    self.request
                )
                raise ValidationError({
                    "detail": "Student is not eligible for certificate issuance.",
                    "reasons": eligibility["reasons"]
                })

        # Save record
        certificate = serializer.save(issued_by=self.request.user)

        # Generate PDF and store on file field
        try:
            CertificateGeneratorService.generate_and_save(certificate)
        except Exception as e:
            pass

        from audits.models import log_action
        log_action(
            self.request.user,
            f"Issued Level {certificate.level.code} ({certificate.get_certificate_type_display()}) to {certificate.student.admission_number}",
            self.request
        )

        # Send Notification
        try:
            from notifications.services import NotificationService
            NotificationService.notify_user(
                user=certificate.student.user,
                title="Certificate Issued",
                message=f"Congratulations {certificate.student.first_name}! Your official {certificate.get_certificate_type_display()} for Level {certificate.level.code} has been issued.",
                send_email=True
            )
        except Exception:
            pass

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return Certificate.objects.filter(student__user=user).order_by('-issue_date')
        if user.role == 'PARENT':
            return Certificate.objects.filter(student__guardians__user=user).order_by('-issue_date')
        return super().get_queryset()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reissue(self, request, pk=None):
        certificate = self.get_object()
        reason = request.data.get('reason') or request.data.get('reissue_reason') or "Administrative reissue"
        
        certificate.reissue_reason = reason
        certificate.reissued_by = request.user
        certificate.reissued_at = timezone.now()
        certificate.status = Certificate.Status.ACTIVE
        certificate.save(update_fields=['reissue_reason', 'reissued_by', 'reissued_at', 'status'])

        # Regenerate updated PDF
        CertificateGeneratorService.generate_and_save(certificate)

        from audits.models import log_action
        log_action(
            request.user,
            f"Reissued certificate {certificate.certificate_number} for {certificate.student.admission_number}. Reason: {reason}",
            request
        )

        try:
            from notifications.services import NotificationService
            NotificationService.notify_user(
                user=certificate.student.user,
                title="Certificate Reissued",
                message=f"Your certificate ({certificate.certificate_number}) has been reissued. Reason: {reason}",
                send_email=True
            )
        except Exception:
            pass

        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def revoke(self, request, pk=None):
        certificate = self.get_object()
        reason = request.data.get('reason') or request.data.get('revocation_reason')
        if not reason:
            return Response({"detail": "A revocation reason is mandatory."}, status=status.HTTP_400_BAD_REQUEST)

        certificate.status = Certificate.Status.REVOKED
        certificate.revocation_reason = reason
        certificate.revoked_by = request.user
        certificate.revoked_at = timezone.now()
        certificate.save(update_fields=['status', 'revocation_reason', 'revoked_by', 'revoked_at'])

        from audits.models import log_action
        log_action(
            request.user,
            f"Revoked certificate {certificate.certificate_number} for {certificate.student.admission_number}. Reason: {reason}",
            request
        )

        try:
            from notifications.services import NotificationService
            NotificationService.notify_user(
                user=certificate.student.user,
                title="Certificate Revoked",
                message=f"Important: Your certificate ({certificate.certificate_number}) has been revoked. Reason: {reason}",
                send_email=True
            )
        except Exception:
            pass

        serializer = self.get_serializer(certificate)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Generates or streams premium landscape-style PDF certificate.
        """
        certificate = self.get_object()

        if request.user.role == 'STUDENT' and certificate.student.user != request.user:
            return Response({"detail": "You do not have permission to access this certificate."}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'PARENT' and not certificate.student.guardians.filter(user=request.user).exists():
            return Response({"detail": "You do not have permission to access this certificate."}, status=status.HTTP_403_FORBIDDEN)

        if certificate.status == Certificate.Status.REVOKED:
            return Response({
                "detail": "This certificate has been revoked and cannot be downloaded as valid.",
                "reason": certificate.revocation_reason
            }, status=status.HTTP_403_FORBIDDEN)

        from audits.models import log_action
        log_action(request.user, f"Downloaded certificate PDF {certificate.certificate_number}", request)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Certificate_{certificate.certificate_number}.pdf"'

        # If stored file exists, read bytes, otherwise generate on the fly
        if certificate.pdf_file and hasattr(certificate.pdf_file, 'path'):
            try:
                with certificate.pdf_file.open('rb') as f:
                    response.write(f.read())
                return response
            except Exception:
                pass

        pdf_bytes = CertificateGeneratorService.generate_pdf_bytes(certificate)
        response.write(pdf_bytes)
        return response


class CertificateVerifyView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, certificate_number=None):
        """
        Public verification endpoint to validate certificate serial code or UUID.
        """
        cert_no = certificate_number or request.query_params.get('cert_no')
        if not cert_no:
            return Response(
                {"detail": "Certificate number or verification code is required for verification."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            # Check by serial number first, or UUID verification code
            from django.db.models import Q
            cert = Certificate.objects.filter(
                Q(certificate_number__iexact=cert_no) | Q(verification_code__iexact=cert_no)
            ).first()

            if not cert:
                return Response(
                    {"detail": "Invalid certificate serial number or UUID. Verification failed."},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = CertificateVerifySerializer(cert)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"detail": "Invalid certificate serial number or verification code."},
                status=status.HTTP_404_NOT_FOUND
            )
