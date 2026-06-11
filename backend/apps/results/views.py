from io import BytesIO
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from results.models import Result
from results.serializers import ResultSerializer
from accounts.permissions import IsTeacher, IsStudent

class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all().order_by('-created_at')
    serializer_class = ResultSerializer

    def perform_create(self, serializer):
        result = serializer.save()
        from audits.models import log_action
        log_action(
            self.request.user,
            f"Created academic result for student {result.student.admission_number} at Level {result.level.code}",
            self.request
        )

    def perform_update(self, serializer):
        result = serializer.save()
        from audits.models import log_action
        log_action(
            self.request.user,
            f"Updated academic result for student {result.student.admission_number} at Level {result.level.code}",
            self.request
        )

    def perform_destroy(self, instance):
        student_admission = instance.student.admission_number
        level_code = instance.level.code
        instance.delete()
        from audits.models import log_action
        log_action(
            self.request.user,
            f"Deleted academic result for student {student_admission} at Level {level_code}",
            self.request
        )

    def get_permissions(self):
        # List/retrieve and download report requires authentication
        # Create, Update, Delete, Publish requires Teacher/Admin
        if self.action in ['list', 'retrieve', 'download_report']:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            # Students can only view their own PUBLISHED results
            return Result.objects.filter(student__user=user, is_published=True).order_by('-created_at')
            
        # Teachers and Admins can view all and apply filters
        queryset = Result.objects.all().order_by('-created_at')
        student_id = self.request.query_params.get('student')
        level_id = self.request.query_params.get('level')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if level_id:
            queryset = queryset.filter(level_id=level_id)
            
        return queryset

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """
        Set result as published so it is visible to the student.
        """
        result = self.get_object()
        result.is_published = True
        result.save()
        from audits.models import log_action
        log_action(
            request.user,
            f"Published academic result for student {result.student.admission_number} at Level {result.level.code}",
            request
        )
        return Response({"message": "Result successfully published."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def download_report(self, request, pk=None):
        """
        Generates and downloads a clean, professional PDF report card for the student.
        """
        result = self.get_object()
        
        # Check permissions for students
        if request.user.role == 'STUDENT' and result.student.user != request.user:
            return Response({"detail": "You do not have permission to access this report."}, status=status.HTTP_403_FORBIDDEN)

        from audits.models import log_action
        log_action(
            request.user,
            f"Downloaded report card for student {result.student.admission_number} at Level {result.level.code}",
            request
        )

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Report_{result.student.admission_number}_{result.level.code}.pdf"'

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        story = []

        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            textColor=colors.HexColor('#0F172A'), # slate-900
            alignment=1, # Center
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'DocSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            textColor=colors.HexColor('#475569'), # slate-600
            alignment=1,
            spaceAfter=20
        )
        section_style = ParagraphStyle(
            'SecTitle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=colors.HexColor('#1E3A8A'), # Indigo
            spaceBefore=15,
            spaceAfter=8
        )
        normal_style = ParagraphStyle(
            'BodyNormal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=colors.HexColor('#1E293B'),
            leading=14
        )

        # Header Info
        story.append(Paragraph("Horizon Deutsch Training Institute", title_style))
        story.append(Paragraph("STUDENT ACADEMIC REPORT CARD", subtitle_style))
        
        # Student Info Table
        student_name = f"{result.student.first_name} {result.student.last_name}"
        info_data = [
            [Paragraph("<b>Student Name:</b>", normal_style), Paragraph(student_name, normal_style),
             Paragraph("<b>Admission No:</b>", normal_style), Paragraph(result.student.admission_number, normal_style)],
            [Paragraph("<b>CEFR Level:</b>", normal_style), Paragraph(result.level.name, normal_style),
             Paragraph("<b>Term/Module:</b>", normal_style), Paragraph(result.term, normal_style)],
            [Paragraph("<b>Grade:</b>", normal_style), Paragraph(result.grade, normal_style),
             Paragraph("<b>Average Score:</b>", normal_style), Paragraph(f"{result.average_score}%", normal_style)],
        ]
        info_table = Table(info_data, colWidths=[100, 160, 100, 160])
        info_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
            ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#F8FAFC')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 15))

        # Scores Section
        story.append(Paragraph("German Language Proficiency Breakdown", section_style))
        
        score_data = [
            [Paragraph("<b>Skill / Module</b>", normal_style), Paragraph("<b>Score (%)</b>", normal_style), Paragraph("<b>Evaluation / Status</b>", normal_style)],
            [Paragraph("Hören (Listening)", normal_style), Paragraph(f"{result.listening}%", normal_style), Paragraph("Bestanden" if result.listening >= 60.0 else "Nicht Bestanden", normal_style)],
            [Paragraph("Lesen (Reading)", normal_style), Paragraph(f"{result.reading}%", normal_style), Paragraph("Bestanden" if result.reading >= 60.0 else "Nicht Bestanden", normal_style)],
            [Paragraph("Schreiben (Writing)", normal_style), Paragraph(f"{result.writing}%", normal_style), Paragraph("Bestanden" if result.writing >= 60.0 else "Nicht Bestanden", normal_style)],
            [Paragraph("Sprechen (Speaking)", normal_style), Paragraph(f"{result.speaking}%", normal_style), Paragraph("Bestanden" if result.speaking >= 60.0 else "Nicht Bestanden", normal_style)],
            [Paragraph("Grammatik (Grammar)", normal_style), Paragraph(f"{result.grammar}%", normal_style), Paragraph("Bestanden" if result.grammar >= 60.0 else "Nicht Bestanden", normal_style)],
            [Paragraph("Wortschatz (Vocabulary)", normal_style), Paragraph(f"{result.vocabulary}%", normal_style), Paragraph("Bestanden" if result.vocabulary >= 60.0 else "Nicht Bestanden", normal_style)],
        ]
        score_table = Table(score_data, colWidths=[200, 120, 200])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('ALIGN', (1,0), (1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        
        # Simple text style fix for table headers (white text)
        header_style = ParagraphStyle(
            'TableHeader', parent=normal_style, fontName='Helvetica-Bold', textColor=colors.white
        )
        for i in range(3):
            score_data[0][i] = Paragraph(score_data[0][i].text, header_style)
            
        story.append(score_table)
        story.append(Spacer(1, 15))

        # Instructor Remarks Section
        story.append(Paragraph("Instructor Remarks", section_style))
        remarks_data = [[Paragraph(result.remarks or "Keine Bemerkungen.", normal_style)]]
        remarks_table = Table(remarks_data, colWidths=[520])
        remarks_table.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('PADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(remarks_table)
        
        # Build Document
        doc.build(story)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response
