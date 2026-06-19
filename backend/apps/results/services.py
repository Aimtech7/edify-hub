import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

class PDFService:
    @staticmethod
    def generate_result_pdf(result):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()

        # Header
        elements.append(Paragraph("<b>Horizon LMS - Student Result Slip</b>", styles['Title']))
        elements.append(Spacer(1, 0.2 * inch))

        # Student Info
        student = result.student
        info_data = [
            ["Student Name:", f"{student.first_name} {student.last_name}", "Admission No:", student.admission_number],
            ["Level:", result.level.name, "Term:", result.term],
        ]
        
        t = Table(info_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
        t.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.2 * inch))

        # Grades Breakdown
        elements.append(Paragraph("<b>Assessment Scores</b>", styles['Heading3']))
        scores_data = [
            ["Component", "Score (%)"],
            ["Listening", f"{result.listening}"],
            ["Reading", f"{result.reading}"],
            ["Writing", f"{result.writing}"],
            ["Speaking", f"{result.speaking}"],
            ["Grammar", f"{result.grammar}"],
            ["Vocabulary", f"{result.vocabulary}"],
            ["<b>Average</b>", f"<b>{result.average_score}</b>"],
            ["<b>Grade</b>", f"<b>{result.grade}</b>"],
        ]
        
        t2 = Table(scores_data, colWidths=[3*inch, 2*inch])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(t2)
        elements.append(Spacer(1, 0.3 * inch))

        # Remarks
        elements.append(Paragraph("<b>Remarks:</b>", styles['Heading3']))
        elements.append(Paragraph(result.remarks or "None", styles['Normal']))

        doc.build(elements)
        buffer.seek(0)
        return buffer
