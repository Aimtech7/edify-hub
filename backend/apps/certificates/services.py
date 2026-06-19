import io
from django.conf import settings
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing

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
        
        elements.append(Paragraph(f"<b>CEFR Level {certificate.level.code}</b>", center_heading))
        elements.append(Spacer(1, 0.5 * inch))
        
        elements.append(Paragraph(f"Date of Issue: {certificate.issue_date}", center_normal))
        elements.append(Spacer(1, 0.2 * inch))
        
        elements.append(Paragraph(f"Certificate No: {certificate.certificate_number}", center_normal))
        elements.append(Spacer(1, 0.1 * inch))
        
        # QR Code Generation
        # Assuming frontend runs on localhost:5173 for testing, or production domain
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        verify_url = f"{base_url}/verify/{certificate.certificate_number}"
        
        qr_code = qr.QrCodeWidget(verify_url)
        bounds = qr_code.getBounds()
        width = bounds[2] - bounds[0]
        height = bounds[3] - bounds[1]
        d = Drawing(100, 100, transform=[100/width,0,0,100/height,0,0])
        d.add(qr_code)
        
        elements.append(d)
        elements.append(Spacer(1, 0.1 * inch))
        
        elements.append(Paragraph(f"Scan to Verify", center_normal))

        doc.build(elements)
        buffer.seek(0)
        return buffer
