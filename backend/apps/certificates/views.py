from io import BytesIO
from django.conf import settings
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode import qr

from certificates.models import Certificate
from certificates.serializers import CertificateSerializer, CertificateVerifySerializer
from accounts.permissions import IsAdminUser

class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all().order_by('-issue_date')
    serializer_class = CertificateSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'download']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            # Students can only see their own certificates
            return Certificate.objects.filter(student__user=user).order_by('-issue_date')
        return super().get_queryset()

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Generates a premium landscape-style PDF certificate of completion.
        """
        certificate = self.get_object()
        
        # Check permissions for students
        if request.user.role == 'STUDENT' and certificate.student.user != request.user:
            return Response({"detail": "You do not have permission to access this certificate."}, status=status.HTTP_403_FORBIDDEN)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Certificate_{certificate.certificate_number}.pdf"'

        buffer = BytesIO()
        
        # Landscape certificate layout
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=50
        )
        story = []

        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CertTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=34,
            textColor=colors.HexColor('#1E3B8B'), # Deep Institutional Blue
            alignment=1, # Center
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            'CertSub',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=16,
            textColor=colors.HexColor('#B45309'), # Amber/Gold accent
            alignment=1,
            spaceAfter=30
        )
        text_style = ParagraphStyle(
            'CertText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=13,
            textColor=colors.HexColor('#334155'), # slate-700
            alignment=1,
            leading=20,
            spaceAfter=25
        )
        name_style = ParagraphStyle(
            'CertName',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=26,
            textColor=colors.HexColor('#0F172A'), # slate-900
            alignment=1,
            spaceAfter=15
        )
        meta_style = ParagraphStyle(
            'CertMeta',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=colors.HexColor('#64748B'), # slate-500
            alignment=1
        )
        serial_style = ParagraphStyle(
            'CertSerial',
            parent=styles['Normal'],
            fontName='Courier-Bold',
            fontSize=11,
            textColor=colors.HexColor('#475569'),
            alignment=1
        )

        story.append(Spacer(1, 20))
        story.append(Paragraph("ZERTIFIKAT", title_style))
        story.append(Paragraph("CERTIFICATE OF COMPLETION", subtitle_style))
        
        story.append(Paragraph("This is to certify that", text_style))
        
        student_name = f"{certificate.student.first_name} {certificate.student.last_name}"
        story.append(Paragraph(student_name, name_style))
        
        completion_text = (
            f"has successfully completed the German Language Course and met all examination requirements "
            f"for the Common European Framework of Reference for Languages (CEFR) at level <b>{certificate.level.name} ({certificate.level.code})</b>."
        )
        story.append(Paragraph(completion_text, text_style))
        story.append(Spacer(1, 10))

        # Generate QR Code
        # We assume the frontend will be hosted at this address (configurable via settings ideally)
        base_url = getattr(settings, 'FRONTEND_URL', 'https://verify.deutschakademie.co.ke')
        verify_url = f"{base_url}/verify/{certificate.certificate_number}"
        
        qr_code = qr.QrCodeWidget(verify_url)
        qr_code.barWidth = 80
        qr_code.barHeight = 80
        
        d = Drawing(80, 80)
        d.add(qr_code)

        # Bottom Signatures & Serial Table
        sig_data = [
            [
                Paragraph(f"<b>Issue Date:</b><br/>{certificate.issue_date.strftime('%B %d, %Y')}", meta_style),
                Paragraph(f"<b>Certificate Serial:</b><br/>{certificate.certificate_number}", serial_style),
                Paragraph("<b>Authorized By:</b><br/>Horizon Deutsch Institute Board", meta_style),
                d
            ]
        ]
        sig_table = Table(sig_data, colWidths=[150, 220, 150, 100])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LINEABOVE', (0,0), (0,0), 1, colors.HexColor('#CBD5E1')),
            ('LINEABOVE', (2,0), (2,0), 1, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 10),
        ]))
        
        story.append(sig_table)
        
        doc.build(story)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class CertificateVerifyView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, certificate_number=None):
        """
        Public verification endpoint to validate certificate serial code.
        """
        cert_no = certificate_number or request.query_params.get('cert_no')
        if not cert_no:
            return Response(
                {"detail": "Certificate number is required for verification."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            cert = Certificate.objects.get(certificate_number=cert_no)
            serializer = CertificateVerifySerializer(cert)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Certificate.DoesNotExist:
            return Response(
                {"detail": "Invalid certificate serial number. Verification failed."},
                status=status.HTTP_404_NOT_FOUND
            )
