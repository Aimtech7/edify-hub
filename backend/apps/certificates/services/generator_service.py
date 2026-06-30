from io import BytesIO
from django.conf import settings
from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode import qr

class CertificateGeneratorService:
    @classmethod
    def generate_pdf_bytes(cls, certificate):
        """
        Generates a ReportLab PDF byte stream for a Certificate record.
        Uses CertificateTemplate formatting if linked.
        """
        buffer = BytesIO()
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

        template = certificate.template
        title_text = template.header_text if template else "ZERTIFIKAT"
        subtitle_text = template.subtitle_text if template else "CERTIFICATE OF COMPLETION"
        sig_name = template.signature_name if template else "Dr. Klaus Weber"
        sig_title = template.signature_title if template else "Academic Director"

        title_style = ParagraphStyle(
            'CertTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=34,
            textColor=colors.HexColor('#1E3B8B'),
            alignment=1,
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            'CertSub',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=16,
            textColor=colors.HexColor('#B45309'),
            alignment=1,
            spaceAfter=30
        )
        text_style = ParagraphStyle(
            'CertText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=13,
            textColor=colors.HexColor('#334155'),
            alignment=1,
            leading=20,
            spaceAfter=25
        )
        name_style = ParagraphStyle(
            'CertName',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=26,
            textColor=colors.HexColor('#0F172A'),
            alignment=1,
            spaceAfter=15
        )
        meta_style = ParagraphStyle(
            'CertMeta',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=colors.HexColor('#64748B'),
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
        story.append(Paragraph(title_text, title_style))
        story.append(Paragraph(subtitle_text, subtitle_style))
        story.append(Paragraph("This is to certify that", text_style))

        student_name = f"{certificate.student.first_name} {certificate.student.last_name}"
        story.append(Paragraph(student_name, name_style))

        if template and template.body_template:
            body_formatted = template.body_template.format(
                student_name=student_name,
                level_name=certificate.level.name,
                level_code=certificate.level.code
            )
        else:
            body_formatted = (
                f"has successfully completed the German Language Course and met all examination requirements "
                f"for the Common European Framework of Reference for Languages (CEFR) at level <b>{certificate.level.name} ({certificate.level.code})</b>."
            )

        story.append(Paragraph(body_formatted, text_style))
        story.append(Spacer(1, 10))

        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        verify_url = f"{base_url}/verify/{certificate.certificate_number}"

        qr_code = qr.QrCodeWidget(verify_url)
        qr_code.barWidth = 80
        qr_code.barHeight = 80
        d = Drawing(80, 80)
        d.add(qr_code)

        sig_data = [
            [
                Paragraph(f"<b>Issue Date:</b><br/>{certificate.issue_date.strftime('%B %d, %Y')}", meta_style),
                Paragraph(f"<b>Certificate Serial:</b><br/>{certificate.certificate_number}<br/><b>UUID:</b><br/>{str(certificate.verification_code)[:13]}...", serial_style),
                Paragraph(f"<b>Authorized By:</b><br/>{sig_name}<br/><i>{sig_title}</i>", meta_style),
                d
            ]
        ]
        sig_table = Table(sig_data, colWidths=[140, 220, 150, 100])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LINEABOVE', (0,0), (0,0), 1, colors.HexColor('#CBD5E1')),
            ('LINEABOVE', (2,0), (2,0), 1, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 10),
        ]))

        story.append(sig_table)
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    @classmethod
    def generate_and_save(cls, certificate):
        """
        Generates PDF bytes and attaches them to certificate.pdf_file.
        """
        pdf_bytes = cls.generate_pdf_bytes(certificate)
        file_name = f"Certificate_{certificate.certificate_number}.pdf"
        certificate.pdf_file.save(file_name, ContentFile(pdf_bytes), save=True)
        return pdf_bytes
