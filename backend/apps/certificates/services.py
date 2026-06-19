import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

class PDFService:
    @staticmethod
    def generate_certificate_pdf(certificate):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                                rightMargin=inch, leftMargin=inch,
                                topMargin=inch, bottomMargin=inch)
        elements = []
        styles = getSampleStyleSheet()
        
        center_title = ParagraphStyle(name='CenterTitle', parent=styles['Title'], alignment=TA_CENTER, fontSize=24)
        center_heading = ParagraphStyle(name='CenterHeading', parent=styles['Heading2'], alignment=TA_CENTER, fontSize=16)
        center_normal = ParagraphStyle(name='CenterNormal', parent=styles['Normal'], alignment=TA_CENTER, fontSize=14)
        
        elements.append(Paragraph("<b>CERTIFICATE OF COMPLETION</b>", center_title))
        elements.append(Spacer(1, 0.5 * inch))
        
        elements.append(Paragraph("This is to certify that", center_normal))
        elements.append(Spacer(1, 0.3 * inch))
        
        student = certificate.student
        elements.append(Paragraph(f"<b>{student.first_name} {student.last_name}</b>", center_title))
        elements.append(Spacer(1, 0.3 * inch))
        
        elements.append(Paragraph(f"has successfully completed the German Language Course for", center_normal))
        elements.append(Spacer(1, 0.2 * inch))
        
        elements.append(Paragraph(f"<b>CEFR Level {certificate.level.name}</b>", center_heading))
        elements.append(Spacer(1, 0.5 * inch))
        
        elements.append(Paragraph(f"Date of Issue: {certificate.issue_date}", center_normal))
        elements.append(Spacer(1, 0.2 * inch))
        
        elements.append(Paragraph(f"Certificate No: {certificate.certificate_number}", center_normal))
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(Paragraph(f"Verification Code: {certificate.verification_code}", center_normal))

        doc.build(elements)
        buffer.seek(0)
        return buffer
